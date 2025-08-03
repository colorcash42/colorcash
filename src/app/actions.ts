'use server';

import type { Bet, Transaction } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, writeBatch, runTransaction, query, orderBy, getDocs, addDoc, serverTimestamp, updateDoc, where } from "firebase/firestore";

// Helper function to ensure user document exists
async function ensureUserDocument(userId: string) {
    if (!userId) throw new Error("User not authenticated");
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
        await writeBatch(db)
            .set(userDocRef, { walletBalance: 1000, uid: userId })
            .commit();
    }
    return userDocRef;
}


// --- DATA ACCESS FUNCTIONS ---

export async function getWalletBalance(userId: string) {
  const userDocRef = await ensureUserDocument(userId);
  const userDoc = await getDoc(userDocRef);
  const balance = userDoc.data()?.walletBalance ?? 0;
  return { balance };
}

export async function getBets(userId: string) {
  const betsCollectionRef = collection(db, `users/${userId}/bets`);
  const q = query(betsCollectionRef, orderBy("timestamp", "desc"));
  const querySnapshot = await getDocs(q);
  const bets = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bet));
  return { bets };
}

export async function getTransactions(userId: string) {
  const transactionsCollectionRef = collection(db, `users/${userId}/transactions`);
  const q = query(transactionsCollectionRef, orderBy("timestamp", "desc"));
  const querySnapshot = await getDocs(q);
  const transactions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
  return { transactions };
}

// This is an admin function, so it doesn't need userId from client
export async function getPendingTransactions() {
    const globalTransactionsCollectionRef = collection(db, "transactions");
    const q = query(globalTransactionsCollectionRef, where("status", "==", "pending"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    const transactions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    return { transactions };
}


// --- MUTATION FUNCTIONS (SERVER ACTIONS) ---

export async function placeBetAction(userId: string, amount: number, color: string, colorHex: string) {
    try {
        const userDocRef = doc(db, "users", userId);
        const betsCollectionRef = collection(db, `users/${userId}/bets`);

        const { isWin, payout, newBalance } = await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
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

            transaction.update(userDocRef, { walletBalance: newBalance });

            const newBetRef = doc(betsCollectionRef);
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

export async function requestDepositAction(userId: string, amount: number, utr: string) {
    const transactionsCollectionRef = collection(db, `users/${userId}/transactions`);
    const globalTransactionsCollectionRef = collection(db, "transactions");

    const newTransaction: Omit<Transaction, "id" | "timestamp"> = {
        type: 'deposit',
        amount,
        status: 'pending',
        utr,
        userId: userId, // Store userId for admin handling
        timestamp: serverTimestamp(),
    };
    
    const batch = writeBatch(db);
    // Add to user-specific and global collections
    batch.set(doc(transactionsCollectionRef), newTransaction);
    batch.set(doc(globalTransactionsCollectionRef), newTransaction);
    await batch.commit();

    revalidatePath('/wallet');
    revalidatePath('/admin');
    
    return { success: true, message: `Deposit request for ₹${amount.toFixed(2)} submitted.` };
}

export async function requestWithdrawalAction(userId: string, amount: number, upi: string) {
     const userDocRef = doc(db, "users", userId);
     const userDoc = await getDoc(userDocRef);
     const currentBalance = userDoc.data()?.walletBalance ?? 0;

    if (amount > currentBalance) {
        return { success: false, message: "Cannot withdraw more than current balance." };
    }

    const transactionsCollectionRef = collection(db, `users/${userId}/transactions`);
    const globalTransactionsCollectionRef = collection(db, "transactions");

    const newTransaction: Omit<Transaction, "id" | "timestamp"> = {
        type: 'withdrawal',
        amount,
        status: 'pending',
        upi,
        userId: userId, // Store userId for admin handling
        timestamp: serverTimestamp(),
    };
    
    const batch = writeBatch(db);
    batch.set(doc(transactionsCollectionRef), newTransaction);
    batch.set(doc(globalTransactionsCollectionRef), newTransaction);
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
            
            // Find the user's transaction document to update it as well.
            // This is a bit tricky without a unique ID shared between them.
            // We'll query based on timestamp and amount, which is not foolproof but okay for this app.
            const userTransactionQuery = query(
                collection(db, `users/${transData.userId}/transactions`), 
                where("timestamp", "==", transData.timestamp),
                where("amount", "==", transData.amount),
                where("type", "==", transData.type)
            );
            const userTransactionSnapshot = await getDocs(userTransactionQuery);
            if (userTransactionSnapshot.empty) {
                // This might happen if there's a slight time mismatch. For a real app,
                // a more robust linking mechanism would be needed.
                console.warn("User's corresponding transaction not found. Only updating global record.");
            }
            
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) {
                throw "User to update not found";
            }
            
            // Update global transaction doc
            transaction.update(globalTransactionRef, { status: newStatus, processedTimestamp: serverTimestamp() });
            
            // Update user-specific transaction doc if found
            if (!userTransactionSnapshot.empty) {
                 const userTransactionRef = userTransactionSnapshot.docs[0].ref;
                 transaction.update(userTransactionRef, { status: newStatus, processedTimestamp: serverTimestamp() });
            }

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
