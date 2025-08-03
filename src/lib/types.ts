import { FieldValue } from "firebase/firestore";

export type Bet = {
  id: string;
  betType: "color" | "number" | "size" | "trio";
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
