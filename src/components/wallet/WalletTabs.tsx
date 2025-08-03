"use client";
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppContext } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';

// Helper function to convert Firestore Timestamp to Date
const toDate = (timestamp: any): Date => {
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  return new Date(timestamp);
};


function DepositForm() {
    const { requestDeposit } = useAppContext();
    const [amount, setAmount] = useState('');
    const [utr, setUtr] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const depositAmount = parseFloat(amount);
        if (isNaN(depositAmount) || depositAmount <= 0) {
            toast({ variant: 'destructive', title: 'Invalid amount' });
            return;
        }
        if (!utr) {
            toast({ variant: 'destructive', title: 'UTR required' });
            return;
        }
        setIsLoading(true);
        await requestDeposit(depositAmount, utr);
        setAmount('');
        setUtr('');
        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="deposit-amount">Amount</Label>
                <Input id="deposit-amount" type="number" placeholder="e.g., 500" value={amount} onChange={e => setAmount(e.target.value)} required disabled={isLoading} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="utr">UTR Number</Label>
                <Input id="utr" type="text" placeholder="Transaction Reference Number" value={utr} onChange={e => setUtr(e.target.value)} required disabled={isLoading} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowDownCircle className="mr-2 h-4 w-4" />}
                {isLoading ? "Submitting..." : "Request Deposit"}
            </Button>
        </form>
    );
}

function WithdrawalForm() {
    const { requestWithdrawal, walletBalance } = useAppContext();
    const [amount, setAmount] = useState('');
    const [upi, setUpi] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const withdrawalAmount = parseFloat(amount);
        if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
            toast({ variant: 'destructive', title: 'Invalid amount' });
            return;
        }
        if (withdrawalAmount > walletBalance) {
            toast({ variant: 'destructive', title: 'Insufficient balance' });
            return;
        }
        if (!upi) {
            toast({ variant: 'destructive', title: 'UPI ID required' });
            return;
        }
        setIsLoading(true);
        await requestWithdrawal(withdrawalAmount, upi);
        setAmount('');
        setUpi('');
        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="withdrawal-amount">Amount</Label>
                <Input id="withdrawal-amount" type="number" placeholder="e.g., 200" value={amount} onChange={e => setAmount(e.target.value)} required disabled={isLoading} max={walletBalance} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="upi">UPI ID</Label>
                <Input id="upi" type="text" placeholder="yourname@bank" value={upi} onChange={e => setUpi(e.target.value)} required disabled={isLoading} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
                 {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowUpCircle className="mr-2 h-4 w-4" />}
                {isLoading ? "Submitting..." : "Request Withdrawal"}
            </Button>
        </form>
    );
}

function TransactionHistory() {
    const { transactions } = useAppContext();
    return (
        <Card>
            <CardHeader>
                <CardTitle className='font-headline'>Transaction History</CardTitle>
                <CardDescription>A log of your deposits and withdrawals.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="w-full overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Type</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className='text-right'>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className='h-24 text-center'>No transactions yet.</TableCell></TableRow>
                            ) : (
                                transactions.map(t => (
                                    <TableRow key={t.id}>
                                        <TableCell className='font-medium capitalize'>{t.type}</TableCell>
                                        <TableCell>₹{t.amount.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Badge variant={t.status === 'approved' ? 'default' : t.status === 'rejected' ? 'destructive' : 'secondary'}>
                                                {t.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className='text-right text-xs text-muted-foreground'>{t.timestamp ? format(toDate(t.timestamp), 'PP pp') : ''}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}

export function WalletTabs() {
  return (
    <Tabs defaultValue="deposit" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="deposit">Deposit</TabsTrigger>
        <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      <TabsContent value="deposit">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className='font-headline'>Deposit Funds</CardTitle>
            <CardDescription>
              Add money to your wallet to start playing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DepositForm />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="withdraw">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className='font-headline'>Withdraw Winnings</CardTitle>
            <CardDescription>
              Request a withdrawal to your UPI account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WithdrawalForm />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="history">
        <TransactionHistory />
      </TabsContent>
    </Tabs>
  );
}
