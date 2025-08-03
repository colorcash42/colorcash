"use client";

import type { ReactNode } from "react";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Bet, Transaction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { 
  getWalletBalance, 
  getBets, 
  getTransactions, 
  placeBetAction,
  requestDepositAction,
  requestWithdrawalAction,
  handleTransactionAction,
  getPendingTransactions,
} from "@/app/actions";

// Helper function to convert Firestore server timestamps to JS Dates
const convertTimestamps = (data: any) => {
  for (const key in data) {
    if (data[key] && typeof data[key] === 'object' && data[key].seconds) {
      // Check for Firestore Timestamp signature
      data[key] = new Date(data[key].seconds * 1000);
    } else if (typeof data[key] === 'object' && data[key] !== null) {
      convertTimestamps(data[key]); // Recurse into nested objects
    }
  }
  return data;
}

interface AppContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  walletBalance: number;
  bets: Bet[];
  transactions: Transaction[];
  pendingTransactions: Transaction[]; // For admin
  login: () => void;
  logout: () => void;
  placeBet: (amount: number, color: string, colorHex: string) => Promise<void>;
  requestDeposit: (amount: number, utr: string) => Promise<void>;
  requestWithdrawal: (amount: number, upi: string) => Promise<void>;
  handleTransaction: (transactionId: string, newStatus: "approved" | "rejected") => Promise<void>;
  fetchData: () => Promise<void>; 
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [bets, setBets] = useState<Bet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]); // For Admin
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    if (isLoggedIn) {
      const [balanceRes, betsRes, transactionsRes, pendingTransRes] = await Promise.all([
        getWalletBalance(),
        getBets(),
        getTransactions(),
        getPendingTransactions(), // Fetch for admin panel
      ]);

      setWalletBalance(balanceRes.balance);
      setBets(betsRes.bets.map(convertTimestamps));
      setTransactions(transactionsRes.transactions.map(convertTimestamps));
      setPendingTransactions(pendingTransRes.transactions.map(convertTimestamps));
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const loggedInStatus = sessionStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(loggedInStatus);
    setIsLoading(false);
  }, []);
  
  useEffect(() => {
    if(isLoggedIn){
      fetchData();
    }
  }, [isLoggedIn, fetchData]);

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
    setWalletBalance(0);
    setBets([]);
    setTransactions([]);
    setPendingTransactions([]);
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  const placeBet = async (amount: number, color: string, colorHex: string) => {
    const result = await placeBetAction(amount, color, colorHex);
    if (result.success) {
      toast({
        title: result.isWin ? "You Won!" : "You Lost",
        description: result.message,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Bet Failed",
        description: result.message,
      });
    }
    await fetchData(); 
  };
  
  const requestDeposit = async (amount: number, utr: string) => {
    const result = await requestDepositAction(amount, utr);
    if(result.success) {
        toast({
            title: 'Deposit Request Submitted',
            description: result.message
        });
    } else {
        toast({
            variant: 'destructive',
            title: 'Request Failed',
            description: result.message
        });
    }
    await fetchData(); 
  };

  const requestWithdrawal = async (amount: number, upi: string) => {
    const result = await requestWithdrawalAction(amount, upi);
     if(result.success) {
        toast({
            title: 'Withdrawal Request Submitted',
            description: result.message
        });
    } else {
        toast({
            variant: 'destructive',
            title: 'Request Failed',
            description: result.message
        });
    }
    await fetchData();
  };

  const handleTransaction = async (transactionId: string, newStatus: 'approved' | 'rejected') => {
    const result = await handleTransactionAction(transactionId, newStatus);
    if (result.success) {
       toast({
            title: `Transaction ${newStatus}`,
            description: result.message
        });
    } else {
        toast({
            variant: 'destructive',
            title: 'Action Failed',
            description: result.message
        });
    }
    await fetchData();
  };

  const value = {
    isLoggedIn,
    isLoading,
    walletBalance,
    bets,
    transactions,
    pendingTransactions,
    login,
    logout,
    placeBet,
    requestDeposit,
    requestWithdrawal,
    handleTransaction,
    fetchData,
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
