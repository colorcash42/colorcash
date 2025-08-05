
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


export function RequestsTable() {
  const { handleTransaction, pendingTransactions } = useAppContext();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const sortedPendingTransactions = useMemo(() => {
    if (!pendingTransactions) return [];
    return [...pendingTransactions].sort((a, b) => toDate(b.timestamp).getTime() - toDate(a.timestamp).getTime());
  }, [pendingTransactions]);


  const onHandleTransaction = async (id: string, status: 'approved' | 'rejected') => {
    setProcessingId(id);
    await handleTransaction(id, status);
    setProcessingId(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Requests</CardTitle>
        <CardDescription>Review deposit and withdrawal requests from users.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="hidden md:table-cell">User ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Details</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPendingTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No pending requests.
                </TableCell>
              </TableRow>
            ) : (
              sortedPendingTransactions.map((t: Transaction) => (
                <TableRow key={t.id}>
                  <TableCell>{t.timestamp ? format(toDate(t.timestamp), 'PP pp') : 'No date'}</TableCell>
                  <TableCell className="hidden md:table-cell truncate max-w-xs">{t.userId}</TableCell>
                  <TableCell>
                    <Badge variant={t.type === 'deposit' ? 'default' : 'secondary'}>{t.type}</Badge>
                  </TableCell>
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
