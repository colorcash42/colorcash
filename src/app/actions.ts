'use server';

import type { Bet, Transaction, LiveGameRound, LiveBet } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, writeBatch, runTransaction, query, orderBy, getDocs, addDoc, serverTimestamp, updateDoc, where, Timestamp, limit, collectionGroup } from "firebase/firestore";
import { suggestBet } from "@/ai/flows/suggest-bet-flow";

// --- HELPER FUNCTIONS ---

// Converts Firestore Timestamps to ISO strings for serialization
const serializeObject = (obj: any) => {
    if (!obj) return obj;
    if (obj instanceof Timestamp) {
        return obj.toDate().toISOString();
    }
    if (Array.isArray(obj)) {
        return obj.map(item => serializeObject(item));
    }
    if (typeof obj === 'object') {
        const newObj: { [key: string]: any } = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                newObj[key] = serializeObject(obj[key]);
            }
        }
        return newObj;
    }
    return obj;
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

export async function getBets(userId:string) {
  // Query both instant and live bets
  const betsCollectionRef = collection(db, `users/${userId}/bets`);
  const qInstant = query(betsCollectionRef, orderBy("timestamp", "desc"));
  
  const liveBetsRef = collection(db, "bets");
  const qLive = query(liveBetsRef, where("userId", "==", userId), orderBy("timestamp", "desc"));

  const [instantSnapshot, liveSnapshot] = await Promise.all([
    getDocs(qInstant),
    getDocs(qLive),
  ]);

  const instantBets = instantSnapshot.docs.map(doc => serializeObject({ id: doc.id, ...doc.data() }) as Bet);
  const liveBets = liveSnapshot.docs.map(doc => serializeObject({ id: doc.id, ...doc.data() }) as Bet);

  // Merge and sort
  const allBets = [...instantBets, ...liveBets].sort((a, b) => {
    const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return dateB - dateA;
  });

  return { bets: allBets };
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
type BetType = 'color' | 'number' | 'size' | 'trio' | 'oddOrEven';

interface ColorCashBetResult {
    isWin: boolean;
    payout: number;
    winningNumber: number;
    winningColor: string;
    winningSize: string;
}

export async function placeBetAction(userId: string, amount: number, betType: BetType, betValue: string | number): Promise<{ success: boolean; message: string; result?: ColorCashBetResult; }> {
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
                gameId: 'colorcash',
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

interface OddEvenBetResult {
    isWin: boolean;
    payout: number;
    winningNumber: number;
}

export async function placeOddEvenBetAction(userId: string, amount: number, betValue: 'Odd' | 'Even'): Promise<{ success: boolean; message: string; result?: OddEvenBetResult; }> {
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
            const winningNumber = Math.floor(Math.random() * 6) + 1; // 1-6
            const isWinningNumberEven = winningNumber % 2 === 0;

            let isWin = false;
            if ((betValue === 'Even' && isWinningNumberEven) || (betValue === 'Odd' && !isWinningNumberEven)) {
                isWin = true;
            }
            
            const payoutRate = 2;
            const payout = isWin ? amount * payoutRate : 0;
            const newBalance = currentBalance - amount + payout;

            transaction.update(userDocRef, { walletBalance: newBalance });

            const newBetRef = doc(betsCollectionRef);
            transaction.set(newBetRef, {
                gameId: 'oddeven',
                betType: 'oddOrEven',
                betValue,
                amount,
                outcome: isWin ? "win" : "loss",
                payout,
                timestamp: serverTimestamp(),
            });
            
            return { isWin, payout, winningNumber };
        });

        revalidatePath('/dashboard');

        return { 
            success: true, 
            result: { ...betResult },
            message: betResult.isWin ? `You won ₹${betResult.payout.toFixed(2)}` : `You lost ₹${amount.toFixed(2)}`
        };

    } catch (e: any) {
        console.error("placeOddEvenBetAction failed: ", e);
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
    // We only care about colorcash history for the guru for now.
    const colorCashHistory = history.filter(b => b.gameId === 'colorcash' || !b.gameId);
    const result = await suggestBet({ history: colorCashHistory });
    return { suggestion: result.suggestion };
  } catch (error) {
    console.error('Error getting suggestion:', error);
    return { error: 'Sorry, the guru is currently meditating. Please try again later.' };
  }
}

// --- LIVE GAME ACTIONS ---

export async function getLiveGameData(): Promise<{ currentRound: LiveGameRound | null }> {
    const liveStatusRef = doc(db, "liveGameStatus", "current");
    const docSnap = await getDoc(liveStatusRef);

    if (!docSnap.exists()) {
        return { currentRound: null };
    }

    const currentRound = serializeObject(docSnap.data()) as LiveGameRound;
    return { currentRound };
}


export async function placeLiveBetAction(userId: string, amount: number, roundId: string): Promise<{ success: boolean; message: string; }> {
    if (!userId) return { success: false, message: "User not authenticated." };
    if (!roundId) return { success: false, message: "No active game round." };

    const userDocRef = doc(db, "users", userId);
    const roundStatusDocRef = doc(db, "liveGameStatus", "current");
    
    // Bets are stored in a root 'bets' collection for easy querying by the function
    const betDocRef = doc(collection(db, "bets")); 

    try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            const roundDoc = await transaction.get(roundStatusDocRef);

            if (!userDoc.exists()) throw new Error("User not found.");
            if (!roundDoc.exists()) throw new Error("Game round not found.");
            
            const roundData = roundDoc.data();
            if (roundData.status !== 'betting') throw new Error("Betting for this round is closed.");
            if (roundData.id !== roundId) throw new Error("Betting for this round has already closed.");


            const currentBalance = userDoc.data().walletBalance;
            if (amount > currentBalance) throw new Error("Insufficient balance.");

            const newBalance = currentBalance - amount;

            const newBet: Omit<LiveBet, 'id'> = {
                userId,
                roundId,
                gameId: 'spin-and-win',
                amount,
                payout: null, // Payout is calculated by the cloud function
                status: 'pending',
                timestamp: serverTimestamp() as any, // Let server set timestamp
            };

            // Deduct amount immediately
            transaction.update(userDocRef, { walletBalance: newBalance });
            // Record the bet in a single, queryable collection
            transaction.set(betDocRef, newBet);
        });
        
        revalidatePath('/live'); // To update wallet balance display
        return { success: true, message: "Bet placed successfully!" };
    } catch (e: any) {
        console.error("placeLiveBetAction failed: ", e);
        return { success: false, message: e.message || "An unknown error occurred." };
    }
}