'use server';

import type { Bet, Transaction } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, writeBatch, runTransaction, query, orderBy, getDocs, addDoc, serverTimestamp, updateDoc, where, Timestamp } from "firebase/firestore";

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
        const BIG_BET_THRESHOLD = 100;

        const betResult = await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) {
                throw "User document does not exist!";
            }
            const currentBalance = userDoc.data().walletBalance;

            if (amount > currentBalance) {
                throw "Insufficient balance";
            }

            // --- GAME LOGIC ---
            let winningNumber: number;
            const isBigBet = amount >= BIG_BET_THRESHOLD;
            const shouldForceLoss = isBigBet && Math.random() < 0.9; // 90% chance to lose on big bets

            if (shouldForceLoss) {
                // Force a loss by generating a winning number that doesn't match the user's bet
                const possibleNumbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
                let losingNumbers: number[];

                if (betType === 'number') {
                    losingNumbers = possibleNumbers.filter(n => n !== Number(betValue));
                } else if (betType === 'color') {
                    if (betValue === 'Green') losingNumbers = [0, 2, 4, 5, 6, 8]; // Avoid 1,3,7,9
                    else if (betValue === 'Red') losingNumbers = [1, 3, 5, 7, 9]; // Avoid 0,2,4,6,8
                    else if (betValue === 'Violet') losingNumbers = possibleNumbers.filter(n => n !== 0 && n !== 5);
                    else losingNumbers = possibleNumbers; // Fallback
                } else if (betType === 'size') {
                     if (betValue === 'Big') losingNumbers = [0, 1, 2, 3, 4]; // Small numbers
                     else losingNumbers = [5, 6, 7, 8, 9]; // Big numbers
                } else if (betType === 'trio') {
                    const trioMap: { [key: string]: number[] } = { 'trio1': [1, 4, 7], 'trio2': [2, 5, 8], 'trio3': [3, 6, 9] };
                    const winningTrio = trioMap[betValue as string] || [];
                    losingNumbers = possibleNumbers.filter(n => !winningTrio.includes(n));
                } else {
                    losingNumbers = possibleNumbers;
                }
                
                if (losingNumbers.length === 0) {
                    // This is a fallback in case the logic somehow filters all numbers.
                    // It ensures the user doesn't automatically win.
                    losingNumbers = possibleNumbers.filter(n => n !== Number(betValue));
                }

                winningNumber = losingNumbers[Math.floor(Math.random() * losingNumbers.length)];

            } else {
                // Normal random generation for small bets or the 10% lucky chance on big bets
                winningNumber = Math.floor(Math.random() * 10); // 0-9
            }

            
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
            let finalBetType = betType;

            // Handle the composite bet type from the client
            if (betType === 'number' && typeof betValue === 'string' && betValue.startsWith('trio')) {
              finalBetType = 'trio';
            }

            if (finalBetType === 'color') {
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
            } else if (finalBetType === 'number') {
                 if (winningNumber === Number(betValue)) {
                    isWin = true;
                    payoutRate = 9;
                }
            } else if (finalBetType === 'trio') {
                const trioMap: { [key: string]: number[] } = {
                    'trio1': [1, 4, 7],
                    'trio2': [2, 5, 8],
                    'trio3': [3, 6, 9],
                };
                if (trioMap[betValue as string]?.includes(winningNumber)) {
                    isWin = true;
                    payoutRate = 3;
                }
            } else if (finalBetType === 'size') {
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
                betType: finalBetType,
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

    const newTransaction: Omit<Transaction, "id" | "timestamp"> & { timestamp: any } = {
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

            const transData = globalDoc.data() as Transaction & { timestamp: Timestamp }; // Cast to include Firestore Timestamp
            const userDocRef = doc(db, "users", transData.userId);
            
            const userTransactionQuery = query(
                collection(db, `users/${transData.userId}/transactions`), 
                where("timestamp", "==", transData.timestamp),
                where("amount", "==", transData.amount),
                where("type", "==", transData.type)
            );
            const userTransactionSnapshot = await getDocs(userTransactionQuery);
            if (userTransactionSnapshot.empty) {
                console.warn("User's corresponding transaction not found. Only updating global record.");
            }
            
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) {
                throw "User to update not found";
            }
            
            // Update global transaction doc
            transaction.update(globalTransactionRef, { status: newStatus });
            
            // Update user-specific transaction doc if found
            if (!userTransactionSnapshot.empty) {
                 const userTransactionRef = userTransactionSnapshot.docs[0].ref;
                 transaction.update(userTransactionRef, { status: newStatus });
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
