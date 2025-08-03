
"use client";

import type { ReactNode } from "react";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { Bet, Transaction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { ADMIN_UIDS } from "@/lib/admins";
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

type Theme = "light" | "dark" | "dark-pro";
type BetType = 'color' | 'number' | 'size' | 'trio';

interface AppContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  walletBalance: number;
  bets: Bet[];
  transactions: Transaction[];
  pendingTransactions: Transaction[]; // For admin
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isUserAdmin: boolean;
  viewAsAdmin: boolean;
  setViewAsAdmin: (viewAsAdmin: boolean) => void;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  placeBet: (amount: number, betType: BetType, betValue: string | number) => Promise<any>;
  requestDeposit: (amount: number, utr: string) => Promise<void>;
  requestWithdrawal: (amount: number, upi: string) => Promise<void>;
  handleTransaction: (transactionId: string, newStatus: "approved" | "rejected") => Promise<void>;
  fetchData: () => Promise<void>; 
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [bets, setBets] = useState<Bet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [theme, setThemeState] = useState<Theme>('dark-pro');
  const [viewAsAdmin, setViewAsAdmin] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const isUserAdmin = user ? ADMIN_UIDS.includes(user.uid) : false;

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    if (storedTheme) {
      setThemeState(storedTheme);
    }
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
      if (currentUser) {
        router.push("/dashboard");
      }
    });
    
    return () => unsubscribe();
  }, [router]);

  const setTheme = (theme: Theme) => {
    setThemeState(theme);
    localStorage.setItem("theme", theme);
  };

  const isLoggedIn = user !== null;

  const fetchData = useCallback(async () => {
    if (user) {
      const isAdmin = ADMIN_UIDS.includes(user.uid);

      // All users fetch their own data
      const [balanceRes, betsRes, transactionsRes] = await Promise.all([
        getWalletBalance(user.uid),
        getBets(user.uid),
        getTransactions(user.uid),
      ]);

      setWalletBalance(balanceRes.balance);
      setBets(betsRes.bets);
      setTransactions(transactionsRes.transactions);

      // Only admins fetch all pending transactions
      if (isAdmin) {
        const pendingTransRes = await getPendingTransactions();
        setPendingTransactions(pendingTransRes.transactions);
      } else {
        setPendingTransactions([]); // Ensure non-admins have an empty list
      }
    }
  }, [user]);


  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn, fetchData]);

  const login = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      toast({
        title: "Login Successful",
        description: "Welcome back to ColorCash!",
      });
      // onAuthStateChanged will handle the redirect
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
    }
  };

   const signup = async (email: string, pass: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      toast({
        title: "Account Created",
        description: "Welcome to ColorCash! You are now logged in.",
      });
      // onAuthStateChanged will handle user state and redirect
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: error.message,
      });
    }
  };


  const logout = async () => {
    await signOut(auth);
    setWalletBalance(0);
    setBets([]);
    setTransactions([]);
    setPendingTransactions([]);
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    router.push("/");
  };

  const placeBet = async (amount: number, betType: BetType, betValue: string | number) => {
    if (!user) {
      const failResult = { success: false, message: "User not logged in" };
      toast({ variant: "destructive", title: "Bet Failed", description: failResult.message });
      return failResult;
    };
    const result = await placeBetAction(user.uid, amount, betType, betValue);
    
    if (!result.success) {
      toast({
        variant: "destructive",
        title: "Bet Failed",
        description: result.message,
      });
    }

    await fetchData();
    return result;
  };
  
  const requestDeposit = async (amount: number, utr: string) => {
    if (!user) return;
    const result = await requestDepositAction(user.uid, amount, utr);
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
    if (!user) return;
    const result = await requestWithdrawalAction(user.uid, amount, upi);
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
    if (!isUserAdmin) {
        toast({variant: 'destructive', title: 'Permission Denied'});
        return;
    }
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
    user,
    isLoggedIn,
    isLoading,
    walletBalance,
    bets,
    transactions,
    pendingTransactions,
    login,
    signup,
    logout,
    placeBet,
    requestDeposit,
    requestWithdrawal,
    handleTransaction,
    fetchData,
    theme,
    setTheme,
    isUserAdmin,
    viewAsAdmin,
    setViewAsAdmin,
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
