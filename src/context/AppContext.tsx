
"use client";

import type { ReactNode } from "react";
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, EmailAuthProvider, reauthenticateWithCredential, updatePassword, sendPasswordResetEmail, sendEmailVerification } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import type { Bet, Transaction, UserData, LiveGameRound, LiveBet } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { ADMIN_UIDS, ADMIN_EMAILS } from "@/lib/admins";
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
  updateUserPresence, // For presence tracking
  getAllUsers, // For admin
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
  allUsers: UserData[]; // For Admin
  isLoggedIn: boolean;
  isLoading: boolean;
  walletBalance: number; // Represents the total balance
  winningsBalance: number; // Represents the withdrawable balance
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
  fetchData: (uid?: string) => Promise<void>;
  fetchAllUsers: () => Promise<void>;
  startFourColorRound: () => Promise<void>;
  endFourColorRound: (winningColor: FourColorBetType) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [winningsBalance, setWinningsBalance] = useState(0);
  const [bets, setBets] = useState<Bet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [liveGameRound, setLiveGameRound] = useState<LiveGameRound | null>(null);
  const [userLiveBets, setUserLiveBets] = useState<LiveBet[]>([]);
  const [theme, setThemeState] = useState<Theme>('light');
  const [viewAsAdmin, setViewAsAdmin] = useState(true);
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const prevRoundStatusRef = useRef<string | null>(null);

  const isUserAdmin = user ? ADMIN_UIDS.includes(user.uid) : false;

  const fetchAllUsers = useCallback(async () => {
    if (isUserAdmin) {
        const { users } = await getAllUsers();
        setAllUsers(users);
    }
  }, [isUserAdmin]);

  const fetchData = useCallback(async (uid?: string) => {
    const currentUid = uid || user?.uid;
    if (currentUid) {
        const isAdmin = ADMIN_UIDS.includes(currentUid);

        const [userDataRes, betsRes, transactionsRes, pendingTransRes] = await Promise.all([
            getUserData(currentUid),
            getBets(currentUid),
            getTransactions(currentUid),
            isAdmin ? getPendingTransactions() : Promise.resolve({ transactions: [] }),
        ]);
        
        const fullUserData = userDataRes.userData;
        if(fullUserData) {
            setUserData(fullUserData);
            const total = (fullUserData.depositBalance || 0) + (fullUserData.winningsBalance || 0) + (fullUserData.bonusBalance || 0);
            setWalletBalance(total);
            setWinningsBalance(fullUserData.winningsBalance || 0);
        }

        setBets(betsRes.bets);
        setTransactions(transactionsRes.transactions);
        setPendingTransactions(pendingTransRes.transactions);

        if (isAdmin) await fetchAllUsers();
    }
  }, [user?.uid, fetchAllUsers]);

  // Presence update effect
  useEffect(() => {
    let presenceInterval: NodeJS.Timeout;
    if (user) {
        updateUserPresence(user.uid);
        presenceInterval = setInterval(() => { updateUserPresence(user.uid); }, 60 * 1000);
    }
    return () => { if (presenceInterval) clearInterval(presenceInterval); };
  }, [user]);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    if (storedTheme) {
      setThemeState(storedTheme);
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(storedTheme);
    } else {
      setThemeState('light');
      document.documentElement.classList.add('light');
    }
    
    const storedSound = localStorage.getItem("soundEnabled");
    if (storedSound !== null) setSoundEnabledState(JSON.parse(storedSound));

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) fetchData(currentUser.uid);
      setIsLoading(false);
    });
    
    const liveStatusRef = doc(db, "liveGameStatus", "current");
    const unsubscribeLiveGame = onSnapshot(liveStatusRef, (doc) => {
        const newRound = doc.exists() ? serializeObject(doc.data()) as LiveGameRound : null;
        if (prevRoundStatusRef.current === 'betting' && newRound?.status === 'awarding' && user) {
            fetchData(user.uid);
        }
        setLiveGameRound(newRound);
        prevRoundStatusRef.current = newRound?.status ?? null;
    }, (error) => {
        console.error("Live game listener failed:", error);
        setLiveGameRound(null);
    });

    return () => {
        unsubscribeAuth();
        unsubscribeLiveGame();
    };
  }, [fetchData, user]);

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
        setUserLiveBets([]);
    }
  }, [user, liveGameRound]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(newTheme);
  };
  
  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    localStorage.setItem("soundEnabled", JSON.stringify(enabled));
  }

  const isLoggedIn = user !== null;

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const loggedInUser = userCredential.user;
      const isExemptAdmin = ADMIN_EMAILS.includes(email);

      if (!loggedInUser.emailVerified && !isExemptAdmin) {
        toast({ variant: "destructive", title: "Email Not Verified", description: "Please check your email and click the verification link before logging in." });
        await signOut(auth);
        setIsLoading(false);
        return;
      }
      toast({ variant: "success", title: "Login Successful", description: "Welcome back!" });
      router.push("/dashboard");
    } catch (error: any) {
      let message = (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential')
        ? "Invalid email or password." : "An unknown error occurred.";
      toast({ variant: "destructive", title: "Login Failed", description: message });
    } finally {
        setIsLoading(false);
    }
  };

   const signup = async (email: string, pass: string, referralCode?: string) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const newUser = userCredential.user;
      await sendEmailVerification(newUser);
      const docResult = await ensureUserDocument(newUser.uid, referralCode);
      await signOut(auth);
      toast({ variant: "success", title: "Verification Email Sent!", description: `Please check your email to verify your account. ${docResult.message}`, duration: 9000 });
    } catch (error: any) {
      let message = "An unknown error occurred.";
      if (error.code === 'auth/email-already-in-use') message = "This email address is already in use.";
      else if (error.code === 'auth/weak-password') message = "Password should be at least 6 characters.";
      else if (error.code === 'auth/invalid-email') message = "Please enter a valid email address.";
      toast({ variant: "destructive", title: "Signup Failed", description: message });
    } finally {
        setIsLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUserData(null);
    setWalletBalance(0);
    setWinningsBalance(0);
    setBets([]);
    setTransactions([]);
    setPendingTransactions([]);
    router.push("/");
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
  };

  const handleBetResponse = async (result: any) => {
    if (result.success) {
      if (user) await fetchData(user.uid);
    } else {
      toast({ variant: "destructive", title: "Bet Failed", description: result.message });
    }
    return result;
  };

  const placeBet = (amount: number, betType: ColorCashBetType, betValue: string | number) => {
    if (!user) return Promise.resolve({ success: false, message: "User not logged in" });
    return placeBetAction(user.uid, amount, betType, betValue).then(handleBetResponse);
  };
  
  const placeOddEvenBet = (amount: number, betValue: OddEvenBetType) => {
    if (!user) return Promise.resolve({ success: false, message: "User not logged in" });
    return placeOddEvenBetAction(user.uid, amount, betValue).then(handleBetResponse);
  };
  
  const placeFourColorBet = async (amount: number, betOnColor: FourColorBetType) => {
    if (!user) {
      toast({ variant: "destructive", title: "Bet Failed", description: "User not logged in" });
      return;
    }
    const result = await placeFourColorBetAction(user.uid, amount, betOnColor);
    if (result.success) {
       toast({ title: "Bet Placed!", description: result.message });
       await fetchData(user.uid);
    } else {
       toast({ variant: "destructive", title: "Bet Failed", description: result.message });
    }
  };

  const requestDeposit = async (amount: number, utr: string) => {
    if (!user) return;
    const result = await requestDepositAction(user.uid, amount, utr);
    if(result.success) {
        toast({ title: 'Deposit Request Submitted', description: result.message });
        await fetchData(user.uid);
    } else {
        toast({ variant: 'destructive', title: 'Request Failed', description: result.message });
    }
  };

  const requestWithdrawal = async (amount: number, upi: string) => {
    if (!user) return;
    const result = await requestWithdrawalAction(user.uid, amount, upi);
     if(result.success) {
        toast({ title: 'Withdrawal Request Submitted', description: result.message });
        await fetchData(user.uid);
    } else {
        toast({ variant: 'destructive', title: 'Request Failed', description: result.message });
    }
  };

  const handleTransaction = async (transactionId: string, newStatus: 'approved' | 'rejected') => {
    if (!isUserAdmin || !user) {
        toast({variant: 'destructive', title: 'Permission Denied'});
        return;
    }
    const result = await handleTransactionAction(transactionId, newStatus);
    if (result.success) {
       toast({ variant: "success", title: `Transaction ${newStatus}`, description: result.message });
       await fetchData(user.uid);
    } else {
        toast({ variant: 'destructive', title: 'Action Failed', description: result.message });
    }
  };
  
  const getGuruSuggestion = async () => {
    if (!user) return;
    const result = await getGuruSuggestionAction(bets);
     if (result.suggestion) return result.suggestion;
     toast({ variant: 'destructive', title: 'Guru is Busy', description: result.error });
     return undefined;
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
      let errorMessage = (error.code === 'auth/wrong-password') 
        ? 'The current password you entered is incorrect.' 
        : (error.code === 'auth/weak-password') ? 'The new password is too weak.' : "An unknown error occurred.";
      const result = { success: false, message: errorMessage };
      toast({ variant: 'destructive', title: 'Password Change Failed', description: result.message });
      return result;
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: 'Password Reset Email Sent', description: `A reset link has been sent to ${email}.` });
      return true;
    } catch (error: any) {
      let errorMessage = (error.code === 'auth/user-not-found') ? 'No account found with this email address.' : "An unknown error occurred. Please try again.";
      toast({ variant: 'destructive', title: 'Reset Failed', description: errorMessage });
      return false;
    }
  };

  const startFourColorRound = async () => {
      if (!isUserAdmin) return;
      const result = await startFourColorRoundAction();
      if (result.success) toast({ variant: "success", title: "Success", description: result.message });
      else toast({ variant: "destructive", title: "Error", description: result.message });
  };

  const endFourColorRound = async (winningColor: FourColorBetType) => {
      if (!isUserAdmin) return;
      const result = await endFourColorRoundAction(winningColor);
      if (result.success) toast({ variant: "success", title: "Round Ended", description: result.message });
      else toast({ variant: "destructive", title: "Error", description: result.message });
  };

  const value = {
    user, userData, allUsers, isLoggedIn, isLoading, walletBalance, winningsBalance,
    bets, transactions, pendingTransactions, liveGameRound, userLiveBets,
    login, signup, logout, placeBet, placeOddEvenBet, placeFourColorBet,
    requestDeposit, requestWithdrawal, handleTransaction, getGuruSuggestion,
    changePassword, sendPasswordReset, fetchData, fetchAllUsers,
    theme, setTheme, isUserAdmin, viewAsAdmin, setViewAsAdmin,
    soundEnabled, setSoundEnabled, startFourColorRound, endFourColorRound,
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
