
'use server';

import type { Bet, Transaction } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, writeBatch, runTransaction, query, orderBy, getDocs, addDoc, serverTimestamp, updateDoc, where, Timestamp } from "firebase/firestore";
import { suggestBet } from "@/ai/flows/suggest-bet-flow";

// --- HELPER FUNCTIONS ---

// Converts Firestore Timestamps to ISO strings for serialization
const serializeObject = (obj: any) => {
    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (value instanceof Timestamp) {
                newObj[key] = value.toDate().toISOString();
            } else if (value && typeof value === 'object' && !Array.isArray(value)) {
                newObj[key] = serializeObject(value);
            } else {
                newObj[key] = value;
            }
        }
    }
    return newObj;
};


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
  // Serialize each document before returning
  const bets = querySnapshot.docs.map(doc => serializeObject({ id: doc.id, ...doc.data() }) as Bet);
  return { bets };
}

export async function getTransactions(userId: string) {
  const transactionsCollectionRef = collection(db, `users/${userId}/transactions`);
  const q = query(transactionsCollectionRef, orderBy("timestamp", "desc"));
  const querySnapshot = await getDocs(q);
  // Serialize each document before returning
  const transactions = querySnapshot.docs.map(doc => serializeObject({ id: doc.id, ...doc.data() }) as Transaction);
  return { transactions };
}

// This is an admin function, so it doesn't need userId from client
export async function getPendingTransactions() {
    const globalTransactionsCollectionRef = collection(db, "transactions");
    const q = query(globalTransactionsCollectionRef, where("status", "==", "pending"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    // Serialize each document before returning
    const transactions = querySnapshot.docs.map(doc => serializeObject({ id: doc.id, ...doc.data() }) as Transaction);
    return { transactions };
}


// --- MUTATION FUNCTIONS (SERVER ACTIONS) ---
type BetType = 'color' | 'number' | 'size' | 'trio';

interface BetResult {
    isWin: boolean;
    payout: number;
    winningNumber: number;
    winningColor: string;
    winningSize: string;
}

export async function placeBetAction(userId: string, amount: number, betType: BetType, betValue: string | number): Promise<{ success: boolean; message: string; result?: BetResult; }> {
    try {
        const userDocRef = doc(db, "users", userId);
        const betsCollectionRef = collection(db, `users/${userId}/bets`);

        const betResult = await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) {
                throw "User document does not exist!";
            }
            const currentBalance = userDoc.data().walletBalance;

            if (amount > currentBalance) {
                throw "Insufficient balance";
            }
            
            // --- FAIR GAME LOGIC ---
            // The logic for biased results based on bet amount has been removed.
            // Every bet now has the same fair chance of winning based on the game rules.
            const winningNumber = Math.floor(Math.random() * 10); // 0-9. Fair for all bets.

            let winningColor = '';
            let winningSize = '';

            // Determine Winning Color
            if ([1, 3, 7, 9].includes(winningNumber)) {
                winningColor = 'Green';
            } else if ([2, 4, 6, 8].includes(winningNumber)) {
                winningColor = 'Red';
            } else if (winningNumber === 0) {
                winningColor = 'VioletRed'; // Red + Violet
            } else if (winningNumber === 5) {
                winningColor = 'VioletGreen'; // Green + Violet
            }

            // Determine Winning Size
            if (winningNumber >= 5 && winningNumber <= 9) {
                winningSize = 'Big';
            } else if (winningNumber >= 0 && winningNumber <= 4) {
                winningSize = 'Small';
            }

            let isWin = false;
            let payoutRate = 0;

            if (betType === 'color') {
                if (betValue === 'Violet' && (winningNumber === 0 || winningNumber === 5)) {
                    isWin = true;
                    payoutRate = 4.5;
                } else if (betValue === 'Red' && (winningColor === 'Red' || winningColor === 'VioletRed')) {
                    isWin = true;
                    payoutRate = (winningNumber === 0) ? 1.5 : 2;
                } else if (betValue === 'Green' && (winningColor === 'Green' || winningColor === 'VioletGreen')) {
                    isWin = true;
                    payoutRate = (winningNumber === 5) ? 1.5 : 2;
                }
            } else if (betType === 'number') {
                 if (winningNumber === Number(betValue)) {
                    isWin = true;
                    payoutRate = 9;
                }
            } else if (betType === 'trio') {
                const trioMap: { [key: string]: number[] } = {
                    'trio1': [1, 4, 7],
                    'trio2': [2, 5, 8],
                    'trio3': [3, 6, 9],
                };
                if (trioMap[betValue as string]?.includes(winningNumber)) {
                    isWin = true;
                    payoutRate = 3;
                }
            } else if (betType === 'size') {
                if (winningSize === betValue) {
                    isWin = true;
                    payoutRate = 2;
                }
            }
            // --- END GAME LOGIC ---

            const payout = isWin ? amount * payoutRate : 0;
            const newBalance = currentBalance - amount + payout;

            transaction.update(userDocRef, { walletBalance: newBalance });

            const newBetRef = doc(betsCollectionRef);
            transaction.set(newBetRef, {
                betType,
                betValue,
                amount,
                outcome: isWin ? "win" : "loss",
                payout,
                timestamp: serverTimestamp(),
            });
            
            return { isWin, payout, winningNumber, winningColor, winningSize };
        });

        revalidatePath('/dashboard');

        return { 
            success: true, 
            result: { ...betResult },
            message: betResult.isWin ? `You won ₹${betResult.payout.toFixed(2)}` : `You lost ₹${amount.toFixed(2)}`
        };

    } catch (e: any) {
        console.error("placeBetAction failed: ", e);
        return { success: false, message: typeof e === 'string' ? e : "An unknown error occurred." };
    }
}


export async function requestDepositAction(userId: string, amount: number, utr: string) {
    const transactionsCollectionRef = collection(db, `users/${userId}/transactions`);
    const globalTransactionsCollectionRef = collection(db, "transactions");

    const newTransaction: Omit<Transaction, "id" | "timestamp"> & { timestamp: any } = {
        type: 'deposit',
        amount,
        status: 'pending',
        utr,
        userId: userId, // Store userId for admin handling
        timestamp: serverTimestamp(),
    };
    
    // Add to user-specific and global collections using auto-generated IDs
    const userTransactionDocRef = doc(transactionsCollectionRef);
    const globalDocRef = doc(globalTransactionsCollectionRef);

    const batch = writeBatch(db);
    batch.set(userTransactionDocRef, newTransaction);
    batch.set(globalDocRef, { ...newTransaction, userTransactionId: userTransactionDocRef.id, id: globalDocRef.id }); // Add cross-reference
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

    const newTransaction: Omit<Transaction, "id" | "timestamp"> & { timestamp: any } = {
        type: 'withdrawal',
        amount,
        status: 'pending',
        upi,
        userId: userId, // Store userId for admin handling
        timestamp: serverTimestamp(),
    };
    
    const userTransactionDocRef = doc(transactionsCollectionRef);
    const globalDocRef = doc(globalTransactionsCollectionRef);

    const batch = writeBatch(db);
    batch.set(userTransactionDocRef, newTransaction);
    batch.set(globalDocRef, { ...newTransaction, userTransactionId: userTransactionDocRef.id, id: globalDocRef.id });
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
             if (globalDoc.data().status !== 'pending') {
                throw "This transaction has already been processed.";
            }

            const transData = globalDoc.data() as Transaction;
            const userDocRef = doc(db, "users", transData.userId);
            const userTransactionRef = doc(db, `users/${transData.userId}/transactions`, transData.userTransactionId!);

            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) {
                throw "User to update not found";
            }
            
            // Update global transaction doc
            transaction.update(globalTransactionRef, { status: newStatus });
            
            // Update user-specific transaction doc
            transaction.update(userTransactionRef, { status: newStatus });

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


export async function getGuruSuggestionAction(history: Bet[]): Promise<{ suggestion?: string, error?: string }> {
  try {
    const result = await suggestBet({ history });
    return { suggestion: result.suggestion };
  } catch (error) {
    console.error('Error getting suggestion:', error);
    return { error: 'Sorry, the guru is currently meditating. Please try again later.' };
  }
}
