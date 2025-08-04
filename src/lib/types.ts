import { FieldValue, Timestamp } from "firebase/firestore";

export type Bet = {
  id: string;
  gameId: 'colorcash' | 'oddeven' | 'live-four-color';
  betType: "color" | "number" | "size" | "trio" | "oddOrEven" | "live";
  betValue: string | number;
  amount: number;
  outcome: "win" | "loss" | "pending";
  payout: number;
  timestamp: string; // Changed from Date | FieldValue to string for serialization
};

export type Transaction = {
  id: string;
  type: "deposit" | "withdrawal";
  amount: number;
  status: "pending" | "approved" | "rejected";
  utr?: string;
  upi?: string;
  userId: string;
  timestamp: string; // Changed from Date | FieldValue to string for serialization
  userTransactionId?: string; // ID of the transaction doc in the user's subcollection
};


// Types for the new Live 4-Color Game
export type LiveGameRound = {
  id: string; // e.g., "round-202407281200"
  status: 'betting' | 'awarding'; // betting: users can bet, awarding: betting closed, admin selects winner
  startTime: string | Timestamp;
  endTime: string | Timestamp; // When the 10-min betting window closes
  winningColor: 'Red' | 'Yellow' | 'Black' | 'Blue' | null;
  resultTimestamp: string | Timestamp | null;
  betCounts: {
    Red: number;
    Yellow: number;
    Black: number;
    Blue: number;
  };
   betAmounts: {
    Red: number;
    Yellow: number;
    Black: number;
    Blue: number;
  };
}

export type LiveBet = {
  id?: string; // Optional because we create it on the client first
  userId: string;
  roundId: string;
  gameId: 'live-four-color';
  betOnColor: 'Red' | 'Yellow' | 'Black' | 'Blue';
  amount: number;
  payout: number | null;
  status: 'pending' | 'won' | 'lost';
  outcome: 'pending' | 'win' | 'loss';
  timestamp: string | FieldValue;
}

// User data, including referral information
export type UserData = {
    uid: string;
    walletBalance: number;
    referralCode: string;
    referredBy: string | null;
    successfulReferrals: number;
    referralEarnings: number;
}
