'use server';

import type { Bet, Transaction } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, writeBatch, runTransaction, query, orderBy, getDocs, addDoc, serverTimestamp, updateDoc, where } from "firebase/firestore";

// This is a hardcoded user ID for now. In a real multi-user app, 
// this would come from an authentication system.
const USER_ID = "user123"; 
const USER_DOC_REF = doc(db, "users", USER_ID);
const BETS_COLLECTION_REF = collection(db, `users/${USER_ID}/bets`);
const TRANSACTIONS_COLLECTION_REF = collection(db, `users/${USER_ID}/transactions`);
const GLOBAL_TRANSACTIONS_COLLECTION_REF = collection(db, "transactions");


// Helper function to ensure user document exists
async function ensureUserDocument() {
    const userDoc = await getDoc(USER_DOC_REF);
    if (!userDoc.exists()) {
        await writeBatch(db)
            .set(USER_DOC_REF, { walletBalance: 1000, uid: USER_ID })
            .commit();
    }
    return userDoc;
}


// --- DATA ACCESS FUNCTIONS ---

export async function getWalletBalance() {
  await ensureUserDocument();
  const userDoc = await getDoc(USER_DOC_REF);
  // The user document is created with a balance of 1000 if it doesn't exist.
  const balance = userDoc.data()?.walletBalance ?? 0;
  return { balance };
}

export async function getBets() {
  await ensureUserDocument();
  const q = query(BETS_COLLECTION_REF, orderBy("timestamp", "desc"));
  const querySnapshot = await getDocs(q);
  const bets = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bet));
  return { bets };
}

export async function getTransactions() {
  await ensureUserDocument();
  const q = query(TRANSACTIONS_COLLECTION_REF, orderBy("timestamp", "desc"));
  const querySnapshot = await getDocs(q);
  const transactions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
  return { transactions };
}

export async function getPendingTransactions() {
    const q = query(GLOBAL_TRANSACTIONS_COLLECTION_REF, where("status", "==", "pending"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    const transactions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    return { transactions };
}


// --- MUTATION FUNCTIONS (SERVER ACTIONS) ---

export async function placeBetAction(amount: number, color: string, colorHex: string) {
    try {
        const { isWin, payout, newBalance } = await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(USER_DOC_REF);
            if (!userDoc.exists()) {
                throw "User document does not exist!";
            }
            const currentBalance = userDoc.data().walletBalance;

            if (amount > currentBalance) {
                throw "Insufficient balance";
            }

            const isWin = Math.random() < 0.4; // 40% chance to win
            const payout = isWin ? amount * 2 : 0;
            const newBalance = currentBalance - amount + payout;

            transaction.update(USER_DOC_REF, { walletBalance: newBalance });

            const newBetRef = doc(BETS_COLLECTION_REF);
            transaction.set(newBetRef, {
                color,
                colorHex,
                amount,
                outcome: isWin ? "win" : "loss",
                payout,
                timestamp: serverTimestamp(),
            });

            return { isWin, payout, newBalance };
        });

        revalidatePath('/dashboard');

        return { 
            success: true, 
            isWin,
            payout,
            message: isWin ? `You won ₹${payout.toFixed(2)}` : `You lost ₹${amount.toFixed(2)}`
        };

    } catch (e: any) {
        console.error("placeBetAction failed: ", e);
        return { success: false, message: typeof e === 'string' ? e : "An unknown error occurred." };
    }
}

export async function requestDepositAction(amount: number, utr: string) {
    const newTransaction: Omit<Transaction, "id" | "timestamp"> = {
        type: 'deposit',
        amount,
        status: 'pending',
        utr,
        userId: USER_ID, // Store userId for admin handling
        timestamp: serverTimestamp(),
    };
    
    const batch = writeBatch(db);
    batch.set(doc(TRANSACTIONS_COLLECTION_REF), newTransaction);
    batch.set(doc(GLOBAL_TRANSACTIONS_COLLECTION_REF), newTransaction);
    await batch.commit();

    revalidatePath('/wallet');
    revalidatePath('/admin');
    
    return { success: true, message: `Deposit request for ₹${amount.toFixed(2)} submitted.` };
}

export async function requestWithdrawalAction(amount: number, upi: string) {
     const userDoc = await getDoc(USER_DOC_REF);
     const currentBalance = userDoc.data()?.walletBalance ?? 0;

    if (amount > currentBalance) {
        return { success: false, message: "Cannot withdraw more than current balance." };
    }
    const newTransaction: Omit<Transaction, "id" | "timestamp"> = {
        type: 'withdrawal',
        amount,
        status: 'pending',
        upi,
        userId: USER_ID, // Store userId for admin handling
        timestamp: serverTimestamp(),
    };
    
    const batch = writeBatch(db);
    batch.set(doc(TRANSACTIONS_COLLECTION_REF), newTransaction);
    batch.set(doc(GLOBAL_TRANSACTIONS_COLLECTION_REF), newTransaction);
    await batch.commit();
    
    revalidatePath('/wallet');
    revalidatePath('/admin');
    
    return { success: true, message: `Withdrawal request for ₹${amount.toFixed(2)} submitted.` };
}

export async function handleTransactionAction(transactionId: string, newStatus: 'approved' | 'rejected') {
    const globalTransactionRef = doc(db, "transactions", transactionId);

    try {
        await runTransaction(db, async (transaction) => {
            const globalDoc = await transaction.get(globalTransactionRef);
            if (!globalDoc.exists()) {
                throw "Transaction not found.";
            }

            const transData = globalDoc.data() as Transaction;
            const userDocRef = doc(db, "users", transData.userId);
            const userTransactionQuery = query(
                collection(db, `users/${transData.userId}/transactions`), 
                where("timestamp", "==", transData.timestamp),
                where("amount", "==", transData.amount)
            );
            const userTransactionSnapshot = await getDocs(userTransactionQuery);
            if (userTransactionSnapshot.empty) {
                throw "User's corresponding transaction not found.";
            }
            const userTransactionRef = userTransactionSnapshot.docs[0].ref;

            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) {
                throw "User to update not found";
            }
            
            // Update both global and user-specific transaction docs
            transaction.update(globalTransactionRef, { status: newStatus, processedTimestamp: serverTimestamp() });
            transaction.update(userTransactionRef, { status: newStatus, processedTimestamp: serverTimestamp() });

            if (newStatus === 'approved') {
                const currentBalance = userDoc.data().walletBalance;
                if (transData.type === 'deposit') {
                    transaction.update(userDocRef, { walletBalance: currentBalance + transData.amount });
                } else if (transData.type === 'withdrawal') {
                     if (transData.amount > currentBalance) {
                        throw "User has insufficient balance for this withdrawal."
                    }
                    transaction.update(userDocRef, { walletBalance: currentBalance - transData.amount });
                }
            }
        });
        
        revalidatePath('/admin');
        revalidatePath('/wallet');
        revalidatePath('/dashboard');
        
        return { success: true, message: `Transaction ${newStatus}.` };

    } catch (e: any) {
        console.error("handleTransactionAction failed: ", e);
        return { success: false, message: typeof e === 'string' ? e : "An unknown error occurred while processing the transaction." };
    }
}
