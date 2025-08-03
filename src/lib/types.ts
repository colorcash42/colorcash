export type Bet = {
  id: string;
  color: string;
  colorHex: string;
  amount: number;
  outcome: "win" | "loss";
  payout: number;
  // Timestamps from server actions will be serialized as strings
  timestamp: Date | string; 
};

export type Transaction = {
  id: string;
  type: "deposit" | "withdrawal";
  amount: number;
  status: "pending" | "approved" | "rejected";
  utr?: string;
  upi?: string;
  // Timestamps from server actions will be serialized as strings
  timestamp: Date | string;
  processedTimestamp?: Date | string;
};

    