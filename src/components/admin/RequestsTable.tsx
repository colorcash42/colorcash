
"use client";

import { useAppContext } from "@/context/AppContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "../ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import type { Transaction } from "@/lib/types";

// Helper function to convert ISO string to Date
const toDate = (timestamp: string | Date): Date => {
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  return timestamp;
};


export function RequestsTable({ type }: { type: 'deposit' | 'withdrawal' }) {
  const { handleTransaction, pendingTransactions } = useAppContext();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const sortedTransactions = useMemo(() => {
    if (!pendingTransactions) return [];
    return pendingTransactions
      .filter(t => t.type === type && t.status === 'pending')
      .sort((a, b) => toDate(b.timestamp).getTime() - toDate(a.timestamp).getTime());
  }, [pendingTransactions, type]);


  const onHandleTransaction = async (id: string, status: 'approved' | 'rejected') => {
    setProcessingId(id);
    await handleTransaction(id, status);
    setProcessingId(null);
  }

  const title = type === 'deposit' ? 'Pending Deposits' : 'Pending Withdrawals';
  const description = type === 'deposit' 
    ? "Review and approve deposit requests from users." 
    : "Review and approve withdrawal requests from users.";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>User Email</TableHead>
              <TableHead className="hidden md:table-cell">User ID</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No pending {type} requests.
                </TableCell>
              </TableRow>
            ) : (
              sortedTransactions.map((t: Transaction) => (
                <TableRow key={t.id}>
                  <TableCell>{t.timestamp ? format(toDate(t.timestamp), 'PP pp') : 'No date'}</TableCell>
                  <TableCell className="font-medium">{t.email || 'N/A'}</TableCell>
                  <TableCell className="hidden md:table-cell truncate max-w-xs">{t.userId}</TableCell>
                  <TableCell>₹{t.amount.toFixed(2)}</TableCell>
                  <TableCell className="truncate max-w-xs">
                    {t.type === 'deposit' ? `UTR: ${t.utr}` : `UPI: ${t.upi}`}
                  </TableCell>
                  <TableCell className="text-right">
                    {processingId === t.id ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => onHandleTransaction(t.id, 'approved')}>
                            <CheckCircle className="text-green-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onHandleTransaction(t.id, 'rejected')}>
                            <XCircle className="text-destructive" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
