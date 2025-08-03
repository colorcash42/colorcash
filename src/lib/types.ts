export type Bet = {
  id: string;
  color: string;
  colorHex: string;
  amount: number;
  outcome: "win" | "loss";
  payout: number;
  timestamp: Date;
};

export type Transaction = {
  id: string;
  type: "deposit" | "withdrawal";
  amount: number;
  status: "pending" | "approved" | "rejected";
  utr?: string;
  upi?: string;
  timestamp: Date;
  processedTimestamp?: Date;
};
