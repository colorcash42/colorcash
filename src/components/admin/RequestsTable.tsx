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
import { CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useMemo } from "react";
import { Transaction } from "@/lib/types";

// Helper function to convert ISO string to Date
const toDate = (timestamp: string | Date): Date => {
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  return timestamp;
};


export function RequestsTable() {
  const { handleTransaction, transactions, pendingTransactions } = useAppContext();

  // We will now receive pending transactions from context directly to improve consistency
  const sortedPendingTransactions = useMemo(() => {
    if (!pendingTransactions) return [];
    return [...pendingTransactions].sort((a, b) => toDate(b.timestamp).getTime() - toDate(a.timestamp).getTime());
  }, [pendingTransactions]);


  const onHandleTransaction = async (id: string, status: 'approved' | 'rejected') => {
    await handleTransaction(id, status);
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">Pending Requests</CardTitle>
        <CardDescription>
          Review deposit and withdrawal requests from users.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User ID</TableHead>
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
                sortedPendingTransactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs text-muted-foreground">
                        {t.timestamp ? format(toDate(t.timestamp), 'PP') : 'No date'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                        {t.userId}
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.type === 'deposit' ? "default" : "secondary"}>
                        {t.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium tabular-nums">₹{t.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                        {t.type === 'deposit' ? `UTR: ${t.utr}` : `UPI: ${t.upi}`}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" className="text-green-500 hover:text-green-600 hover:bg-green-500/10" onClick={() => onHandleTransaction(t.id, 'approved')}>
                            <CheckCircle className="h-5 w-5" />
                            <span className="sr-only">Approve</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => onHandleTransaction(t.id, 'rejected')}>
                            <XCircle className="h-5 w-5" />
                            <span className="sr-only">Reject</span>
                        </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
