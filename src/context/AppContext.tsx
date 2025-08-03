"use client";

import type { ReactNode } from "react";
import React, { createContext, useContext, useEffect, useState, useTransition } from "react";
import type { Bet, Transaction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { 
  getWalletBalance, 
  getBets, 
  getTransactions, 
  placeBetAction,
  requestDepositAction,
  requestWithdrawalAction,
  handleTransactionAction
} from "@/app/actions";

interface AppContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  walletBalance: number;
  bets: Bet[];
  transactions: Transaction[];
  login: () => void;
  logout: () => void;
  placeBet: (amount: number, color: string, colorHex: string) => Promise<void>;
  requestDeposit: (amount: number, utr: string) => Promise<void>;
  requestWithdrawal: (amount: number, upi: string) => Promise<void>;
  handleTransaction: (transactionId: string, newStatus: "approved" | "rejected") => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [bets, setBets] = useState<Bet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { toast } = useToast();

  const fetchData = async () => {
    if (isLoggedIn) {
      const [balanceRes, betsRes, transactionsRes] = await Promise.all([
        getWalletBalance(),
        getBets(),
        getTransactions(),
      ]);
      setWalletBalance(balanceRes.balance);
      setBets(betsRes.bets);
      setTransactions(transactionsRes.transactions);
    }
  };

  useEffect(() => {
    const loggedInStatus = sessionStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(loggedInStatus);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if(isLoggedIn){
      fetchData();
    }
  }, [isLoggedIn]);

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
    // No need to call fetchData(), revalidatePath in action handles it
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
