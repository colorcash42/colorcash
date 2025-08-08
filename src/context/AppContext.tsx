
"use client";

import type { ReactNode } from "react";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, EmailAuthProvider, reauthenticateWithCredential, updatePassword, sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import type { Bet, Transaction, UserData, LiveGameRound, LiveBet } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { ADMIN_UIDS } from "@/lib/admins";
import { 
  getUserData,
  getBets, 
  getTransactions, 
  placeBetAction,
  placeOddEvenBetAction,
  requestDepositAction,
  requestWithdrawalAction,
  handleTransactionAction,
  getPendingTransactions,
  getGuruSuggestionAction,
  changePasswordAction,
  ensureUserDocument,
  getLiveGameData,
  placeFourColorBetAction,
  startFourColorRoundAction,
  endFourColorRoundAction,
} from "@/app/actions";
import { doc, onSnapshot, Timestamp, collection, query, where } from "firebase/firestore";

type Theme = "light" | "dark";
type ColorCashBetType = 'color' | 'number' | 'size' | 'trio';
type OddEvenBetType = 'Odd' | 'Even';
type FourColorBetType = 'Red' | 'Yellow' | 'Black' | 'Blue';


// This helper function is now local to this file.
const serializeObject = (obj: any): any => {
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

interface AppContextType {
  user: User | null;
  userData: UserData | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  walletBalance: number;
  bets: Bet[];
  transactions: Transaction[];
  pendingTransactions: Transaction[]; // For admin
  liveGameRound: LiveGameRound | null;
  userLiveBets: LiveBet[];
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isUserAdmin: boolean;
  viewAsAdmin: boolean;
  setViewAsAdmin: (viewAsAdmin: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, referralCode?: string) => Promise<void>;
  logout: () => void;
  placeBet: (amount: number, betType: ColorCashBetType, betValue: string | number) => Promise<any>;
  placeOddEvenBet: (amount: number, betValue: OddEvenBetType) => Promise<any>;
  placeFourColorBet: (amount: number, betOnColor: FourColorBetType) => Promise<any>;
  requestDeposit: (amount: number, utr: string) => Promise<void>;
  requestWithdrawal: (amount: number, upi: string) => Promise<void>;
  handleTransaction: (transactionId: string, newStatus: "approved" | "rejected") => Promise<void>;
  getGuruSuggestion: () => Promise<string | undefined>;
  changePassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; message: string; }>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  fetchData: () => Promise<void>; 
  startFourColorRound: () => Promise<void>;
  endFourColorRound: (winningColor: FourColorBetType) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [bets, setBets] = useState<Bet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [liveGameRound, setLiveGameRound] = useState<LiveGameRound | null>(null);
  const [userLiveBets, setUserLiveBets] = useState<LiveBet[]>([]);
  const [theme, setThemeState] = useState<Theme>('dark');
  const [viewAsAdmin, setViewAsAdmin] = useState(true);
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const isUserAdmin = user ? ADMIN_UIDS.includes(user.uid) : false;

  const fetchData = useCallback(async (uid?: string) => {
    const currentUid = uid || user?.uid;
    if (currentUid) {
        const isAdmin = ADMIN_UIDS.includes(currentUid);

        // All users fetch their own data
        const [userDataRes, betsRes, transactionsRes] = await Promise.all([
            getUserData(currentUid),
            getBets(currentUid),
            getTransactions(currentUid),
        ]);
        
        const fullUserData = userDataRes.userData;
        if(fullUserData) {
            setUserData(fullUserData);
            setWalletBalance(fullUserData.walletBalance);
        }

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
  }, [user?.uid]);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    if (storedTheme) {
      setThemeState(storedTheme);
    }
     const storedSound = localStorage.getItem("soundEnabled");
    if (storedSound) {
      setSoundEnabledState(JSON.parse(storedSound));
    }
    
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
      if (currentUser) {
        fetchData(currentUser.uid);
      }
    });
    
    // Set up a real-time listener for the live game status
    const liveStatusRef = doc(db, "liveGameStatus", "current");
    const unsubscribeLiveGame = onSnapshot(liveStatusRef, (doc) => {
        if (doc.exists()) {
            const roundData = serializeObject(doc.data()) as LiveGameRound;
            setLiveGameRound(roundData);
        } else {
            setLiveGameRound(null);
        }
    }, (error) => {
        console.error("Live game listener failed:", error);
        setLiveGameRound(null);
    });


    return () => {
        unsubscribeAuth();
        unsubscribeLiveGame();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listener for user's bets in the current live round
  useEffect(() => {
    if (user && liveGameRound) {
        const betsRef = collection(db, "bets");
        const q = query(betsRef, where("userId", "==", user.uid), where("roundId", "==", liveGameRound.id));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const betsData = querySnapshot.docs.map(doc => serializeObject({ id: doc.id, ...doc.data() }) as LiveBet);
            setUserLiveBets(betsData);
        }, (error) => {
            console.error("Failed to fetch user's live bets:", error);
            setUserLiveBets([]);
        });

        return () => unsubscribe();
    } else {
        // Clear bets if there's no user or no active round
        setUserLiveBets([]);
    }
  }, [user, liveGameRound]);

  const setTheme = (theme: Theme) => {
    setThemeState(theme);
    localStorage.setItem("theme", theme);
  };
  
  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    localStorage.setItem("soundEnabled", JSON.stringify(enabled));
  }

  const isLoggedIn = user !== null;


  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [isLoggedIn, fetchData]);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // Data fetching is handled by onAuthStateChanged, but we show the toast before redirect
      toast({
        variant: "success",
        title: "Login Successful",
        description: "Welcome back!",
      });
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
    } finally {
        setIsLoading(false);
    }
  };

   const signup = async (email: string, pass: string, referralCode?: string) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const newUser = userCredential.user;
      
      const docResult = await ensureUserDocument(newUser.uid, referralCode);

      // Manually fetch data right after signup to ensure context is updated before redirect
      await fetchData(newUser.uid);

       toast({
        variant: "success",
        title: "Account Created!",
        description: docResult.message,
      });
      router.push("/dashboard");

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: error.message,
      });
    } finally {
        setIsLoading(false);
    }
  };


  const logout = async () => {
    await signOut(auth);
    setUserData(null);
    setWalletBalance(0);
    setBets([]);
    setTransactions([]);
    setPendingTransactions([]);
    router.push("/");
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  const placeBet = async (amount: number, betType: ColorCashBetType, betValue: string | number) => {
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
  
  const placeOddEvenBet = async (amount: number, betValue: OddEvenBetType) => {
    if (!user) {
      const failResult = { success: false, message: "User not logged in" };
      toast({ variant: "destructive", title: "Bet Failed", description: failResult.message });
      return failResult;
    };
    const result = await placeOddEvenBetAction(user.uid, amount, betValue);
    
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
  
  const placeFourColorBet = async (amount: number, betOnColor: FourColorBetType) => {
    if (!user) {
      const failResult = { success: false, message: "User not logged in" };
      toast({ variant: "destructive", title: "Bet Failed", description: failResult.message });
      return failResult;
    };
    const result = await placeFourColorBetAction(user.uid, amount, betOnColor);
    
    if (result.success) {
       toast({ title: "Bet Placed!", description: result.message });
    } else {
       toast({ variant: "destructive", title: "Bet Failed", description: result.message });
    }

    // No need to call fetchData() here for wallet balance because the listener on user bets will trigger UI updates
    // And wallet balance is deducted server-side, and user doc changes should also be listened to if needed.
    // However, to keep it simple and ensure other data like all-bets history is updated, we can leave it.
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
            variant: "success",
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
  
  const getGuruSuggestion = async () => {
    if (!user) return;
    const result = await getGuruSuggestionAction(bets);
     if (result.suggestion) {
       return result.suggestion;
    } else {
        toast({
            variant: 'destructive',
            title: 'Guru is Busy',
            description: result.error
        });
        return undefined;
    }
  }
  
  const changePassword = async (currentPass: string, newPass: string) => {
    if (!user || !user.email) {
      const result = { success: false, message: "No user is logged in." };
       toast({ variant: 'destructive', title: 'Error', description: result.message });
      return result;
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPass);
      await reauthenticateWithCredential(user, credential);
      
      await updatePassword(user, newPass);
      
      const result = { success: true, message: "Password updated successfully!" };
      toast({ variant: "success", title: 'Success', description: result.message });
      return result;

    } catch (error: any) {
      let errorMessage = "An unknown error occurred.";
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'The current password you entered is incorrect.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'The new password is too weak.';
      }
      
      const result = { success: false, message: errorMessage };
      toast({ variant: 'destructive', title: 'Password Change Failed', description: result.message });
      return result;
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Password Reset Email Sent',
        description: `A reset link has been sent to ${email}.`,
      });
      return true;
    } catch (error: any) {
      let errorMessage = "An unknown error occurred. Please try again.";
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      }
      toast({
        variant: 'destructive',
        title: 'Reset Failed',
        description: errorMessage,
      });
      return false;
    }
  };

  // Admin actions for the new game
  const startFourColorRound = async () => {
      if (!isUserAdmin) return;
      const result = await startFourColorRoundAction();
      if (result.success) {
          toast({ variant: "success", title: "Success", description: result.message });
      } else {
          toast({ variant: "destructive", title: "Error", description: result.message });
      }
  };

  const endFourColorRound = async (winningColor: FourColorBetType) => {
      if (!isUserAdmin) return;
      const result = await endFourColorRoundAction(winningColor);
      if (result.success) {
          toast({ variant: "success", title: "Round Ended", description: result.message });
      } else {
          toast({ variant: "destructive", title: "Error", description: result.message });
      }
  };


  const value = {
    user,
    userData,
    isLoggedIn,
    isLoading,
    walletBalance,
    bets,
    transactions,
    pendingTransactions,
    liveGameRound,
    userLiveBets,
    login,
    signup,
    logout,
    placeBet,
    placeOddEvenBet,
    placeFourColorBet,
    requestDeposit,
    requestWithdrawal,
    handleTransaction,
    getGuruSuggestion,
    changePassword,
    sendPasswordReset,
    fetchData,
    theme,
    setTheme,
    isUserAdmin,
    viewAsAdmin,
    setViewAsAdmin,
    soundEnabled,
    setSoundEnabled,
    startFourColorRound,
    endFourColorRound,
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
