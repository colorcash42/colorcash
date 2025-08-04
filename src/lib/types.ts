import { FieldValue, Timestamp } from "firebase/firestore";

export type Bet = {
  id: string;
  gameId: 'colorcash' | 'oddeven'; // identify the game
  betType: "color" | "number" | "size" | "trio" | "oddOrEven";
  betValue: string | number;
  amount: number;
  outcome: "win" | "loss";
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

// Types for the new Live "Spin & Win" Game
export type LiveGameRound = {
  id: string; // e.g., "round-202407281200"
  status: 'betting' | 'spinning' | 'finished';
  startTime: string | Timestamp;
  spinTime: string | Timestamp; // When the betting phase ends and wheel starts spinning
  endTime: string | Timestamp; // When the round is completely over and results are shown
  winningMultiplier: number | null; // e.g., 2, 3, 5, or 0 for BUST
  resultTimestamp: string | Timestamp | null;
}

export type LiveBet = {
  id?: string; // Optional because we create it on the client first
  userId: string;
  roundId: string;
  gameId: 'spin-and-win';
  amount: number;
  payout: number | null;
  status: 'pending' | 'won' | 'lost';
  timestamp: string | FieldValue;
}