'use server';

import type { Bet, Transaction } from "@/lib/types";
import { revalidatePath } from "next/cache";

// This is a temporary in-memory store. 
// In a real application, you would use a database like Firestore.
const FAKE_DB = {
  walletBalance: 1000,
  bets: [] as Bet[],
  transactions: [] as Transaction[],
};

// --- DATA ACCESS FUNCTIONS ---

export async function getWalletBalance() {
  return { balance: FAKE_DB.walletBalance };
}

export async function getBets() {
  return { bets: FAKE_DB.bets.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()) };
}

export async function getTransactions() {
  return { transactions: FAKE_DB.transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()) };
}

export async function getPendingTransactions() {
    return { transactions: FAKE_DB.transactions.filter(t => t.status === 'pending').sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()) };
}


// --- MUTATION FUNCTIONS (SERVER ACTIONS) ---

export async function placeBetAction(amount: number, color: string, colorHex: string) {
    if (amount > FAKE_DB.walletBalance) {
        return { success: false, message: "Insufficient balance" };
    }

    const isWin = Math.random() < 0.4; // 40% chance to win
    const payout = isWin ? amount * 2 : 0;
    const newBalance = FAKE_DB.walletBalance - amount + payout;

    FAKE_DB.walletBalance = newBalance;

    const newBet: Bet = {
        id: crypto.randomUUID(),
        color,
        colorHex,
        amount,
        outcome: isWin ? "win" : "loss",
        payout,
        timestamp: new Date(),
    };

    FAKE_DB.bets.unshift(newBet);
    
    revalidatePath('/dashboard');

    return { 
        success: true, 
        isWin,
        payout,
        message: isWin ? `You won ₹${payout.toFixed(2)}` : `You lost ₹${amount.toFixed(2)}`
    };
}

export async function requestDepositAction(amount: number, utr: string) {
    const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        type: 'deposit',
        amount,
        status: 'pending',
        utr,
        timestamp: new Date(),
    };
    FAKE_DB.transactions.unshift(newTransaction);

    revalidatePath('/wallet');
    revalidatePath('/admin');
    
    return { success: true, message: `Deposit request for ₹${amount.toFixed(2)} submitted.` };
}

export async function requestWithdrawalAction(amount: number, upi: string) {
    if (amount > FAKE_DB.walletBalance) {
        return { success: false, message: "Cannot withdraw more than current balance." };
    }
    const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        type: 'withdrawal',
        amount,
        status: 'pending',
        upi,
        timestamp: new Date(),
    };
    FAKE_DB.transactions.unshift(newTransaction);
    
    revalidatePath('/wallet');
    revalidatePath('/admin');
    
    return { success: true, message: `Withdrawal request for ₹${amount.toFixed(2)} submitted.` };
}

export async function handleTransactionAction(transactionId: string, newStatus: 'approved' | 'rejected') {
    const transaction = FAKE_DB.transactions.find(t => t.id === transactionId);
    if (!transaction) {
        return { success: false, message: "Transaction not found." };
    }

    transaction.status = newStatus;
    transaction.processedTimestamp = new Date();

    if (newStatus === 'approved') {
        if (transaction.type === 'deposit') {
            FAKE_DB.walletBalance += transaction.amount;
        } else if (transaction.type === 'withdrawal') {
            // Balance for withdrawal was already checked at time of request,
            // but a check here would be good practice in a real app.
            FAKE_DB.walletBalance -= transaction.amount;
        }
    }
    
    revalidatePath('/admin');
    revalidatePath('/wallet');
    revalidatePath('/dashboard'); // for wallet balance in header
    
    return { success: true, message: `Transaction ${newStatus}.` };
}