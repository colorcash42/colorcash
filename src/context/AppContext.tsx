"use client";

import type { ReactNode } from "react";
import React, { createContext, useContext, useEffect, useState } from "react";
import type { Bet, Transaction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface AppContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  walletBalance: number;
  bets: Bet[];
  transactions: Transaction[];
  login: () => void;
  logout: () => void;
  placeBet: (amount: number, color: string, colorHex: string) => void;
  requestDeposit: (amount: number, utr: string) => void;
  requestWithdrawal: (amount: number, upi: string) => void;
  handleTransaction: (transactionId: string, newStatus: "approved" | "rejected") => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(1000);
  const [bets, setBets] = useState<Bet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate checking auth status
    const loggedInStatus = sessionStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(loggedInStatus);
    setIsLoading(false);
  }, []);

  const login = () => {
    setIsLoggedIn(true);
    sessionStorage.setItem("isLoggedIn", "true");
    toast({
      title: "Login Successful",
      description: "Welcome to ColorCash!",
    });
  };

  const logout = () => {
    setIsLoggedIn(false);
    sessionStorage.removeItem("isLoggedIn");
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  const placeBet = (amount: number, color: string, colorHex: string) => {
    if (amount > walletBalance) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: "You don't have enough funds to place this bet.",
      });
      return;
    }

    // Make the win condition less predictable
    const isWin = Math.random() < 0.4; // 40% chance to win
    const payout = isWin ? amount * 2 : 0;
    const newBalance = walletBalance - amount + payout;

    setWalletBalance(newBalance);

    const newBet: Bet = {
      id: crypto.randomUUID(),
      color,
      colorHex,
      amount,
      outcome: isWin ? "win" : "loss",
      payout,
      timestamp: new Date(),
    };

    setBets((prev) => [newBet, ...prev]);

    toast({
      title: isWin ? "You Won!" : "You Lost",
      description: isWin
        ? `Congratulations! You won ₹${payout.toFixed(2)}.`
        : `Better luck next time. You lost ₹${amount.toFixed(2)}.`,
    });
  };
  
  const requestDeposit = (amount: number, utr: string) => {
    const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        type: 'deposit',
        amount,
        status: 'pending',
        utr,
        timestamp: new Date(),
    };
    setTransactions(prev => [newTransaction, ...prev]);
    toast({
        title: 'Deposit Request Submitted',
        description: `Your request to deposit ₹${amount.toFixed(2)} is pending approval.`
    });
  };

  const requestWithdrawal = (amount: number, upi: string) => {
    if (amount > walletBalance) {
        toast({
            variant: "destructive",
            title: "Insufficient Balance",
            description: "You cannot withdraw more than your current balance.",
        });
        return;
    }
    const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        type: 'withdrawal',
        amount,
        status: 'pending',
        upi,
        timestamp: new Date(),
    };
    setTransactions(prev => [newTransaction, ...prev]);
    toast({
        title: 'Withdrawal Request Submitted',
        description: `Your request to withdraw ₹${amount.toFixed(2)} is pending approval.`
    });
  };

  const handleTransaction = (transactionId: string, newStatus: 'approved' | 'rejected') => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;

    setTransactions(prev => prev.map(t => t.id === transactionId ? { ...t, status: newStatus, processedTimestamp: new Date() } : t));

    if (newStatus === 'approved') {
        if (transaction.type === 'deposit') {
            setWalletBalance(prev => prev + transaction.amount);
            toast({ title: 'Deposit Approved', description: `₹${transaction.amount.toFixed(2)} has been added to your wallet.`});
        } else if (transaction.type === 'withdrawal') {
            setWalletBalance(prev => prev - transaction.amount);
            toast({ title: 'Withdrawal Approved', description: `₹${transaction.amount.toFixed(2)} has been deducted from your wallet.`});
        }
    } else {
        toast({
            variant: 'destructive',
            title: `Transaction Rejected`,
            description: `Your ${transaction.type} request of ₹${transaction.amount.toFixed(2)} was rejected.`
        })
    }
  };


  const value = {
    isLoggedIn,
    isLoading,
    walletBalance,
    bets,
    transactions,
    login,
    logout,
    placeBet,
    requestDeposit,
    requestWithdrawal,
    handleTransaction,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
