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
import { getPendingTransactions } from "@/app/actions";
import { useEffect, useState } from "react";
import { Transaction } from "@/lib/types";

export function RequestsTable() {
  const { handleTransaction } = useAppContext();
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    // Fetch initial data, and re-fetch when context says so
    const fetchPending = async () => {
        const res = await getPendingTransactions();
        setPendingTransactions(res.transactions);
    };
    fetchPending();

    const interval = setInterval(fetchPending, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, []);


  const onHandleTransaction = async (id: string, status: 'approved' | 'rejected') => {
    await handleTransaction(id, status);
    // Optimistically update UI
    setPendingTransactions(prev => prev.filter(t => t.id !== id));
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
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No pending requests.
                  </TableCell>
                </TableRow>
              ) : (
                pendingTransactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs text-muted-foreground">
                        {format(t.timestamp, 'PP')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.type === 'deposit' ? "default" : "secondary"} className={t.type === 'deposit' ? 'bg-blue-500' : ''}>
                        {t.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium tabular-nums">₹{t.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                        {t.type === 'deposit' ? `UTR: ${t.utr}` : `UPI: ${t.upi}`}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700 hover:bg-green-100" onClick={() => onHandleTransaction(t.id, 'approved')}>
                            <CheckCircle className="h-5 w-5" />
                            <span className="sr-only">Approve</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-100" onClick={() => onHandleTransaction(t.id, 'rejected')}>
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
