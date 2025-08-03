import { FieldValue } from "firebase/firestore";

export type Bet = {
  id: string;
  color: string;
  colorHex: string;
  amount: number;
  outcome: "win" | "loss";
  payout: number;
  // Firestore timestamps can be Date or FieldValue
  timestamp: Date | FieldValue; 
};

export type Transaction = {
  id: string;
  type: "deposit" | "withdrawal";
  amount: number;
  status: "pending" | "approved" | "rejected";
  utr?: string;
  upi?: string;
  userId: string;
  // Firestore timestamps can be Date or FieldValue
  timestamp: Date | FieldValue;
  processedTimestamp?: Date | FieldValue;
};
