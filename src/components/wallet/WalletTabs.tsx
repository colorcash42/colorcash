"use client";
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppContext } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowDownCircle, ArrowUpCircle, Copy, Download, Gift, Users, Share2, QrCode } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { buttonVariants } from '../ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Helper function to convert ISO string to Date
const toDate = (timestamp: string | Date): Date => {
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  return timestamp;
};


function DepositForm() {
    const { requestDeposit } = useAppContext();
    const [amount, setAmount] = useState('');
    const [utr, setUtr] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const upiId = "8949956264@kotak";
    const qrCodeUrl = "/qrcode.png"; // Use local public folder image

    const handleCopy = () => {
        navigator.clipboard.writeText(upiId);
        toast({
            title: "Copied!",
            description: "UPI ID copied to clipboard.",
        });
    }

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
        <div className="space-y-6">
            <Card>
                 <CardHeader>
                    <CardTitle>Pay to this UPI</CardTitle>
                 </CardHeader>
                 <CardContent className="flex flex-col items-center gap-4">
                        <div className="bg-white p-2 rounded-lg border">
                           <img src={qrCodeUrl} data-ai-hint="QR code" alt="QR Code for UPI Payment" width={200} height={200} />
                        </div>
                        <div className="w-full space-y-2">
                           <Button onClick={handleCopy} variant="outline" className="w-full">
                                <span>{upiId}</span>
                                <Copy className="ml-auto" />
                            </Button>
                           <Button asChild variant="outline" className="w-full">
                                <a href={qrCodeUrl} download="colorcash-qr.png">
                                    <Download /> Download QR
                                </a>
                            </Button>
                        </div>
                 </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                    <CardTitle>Submit Deposit Details</CardTitle>
                    <CardDescription>After paying, enter the amount and UTR/Transaction ID to confirm your deposit.</CardDescription>
                 </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="deposit-amount">Amount Deposited</Label>
                            <Input id="deposit-amount" type="number" placeholder="e.g., 500" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                        </div>
                        <div>
                            <Label htmlFor="deposit-utr">UTR / Transaction ID</Label>
                            <Input id="deposit-utr" type="text" placeholder="Enter the 12-digit ID" value={utr} onChange={(e) => setUtr(e.target.value)} required />
                        </div>
                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? <Loader2 className="animate-spin" /> : null}
                            {isLoading ? "Submitting..." : "Submit Deposit Request"}
                        </Button>
                    </CardContent>
                </form>
            </Card>
        </div>
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
            <div>
                <Label htmlFor="withdrawal-amount">Amount</Label>
                <Input id="withdrawal-amount" type="number" placeholder="Enter amount to withdraw" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div>
                <Label htmlFor="withdrawal-upi">Your UPI ID for payment</Label>
                <Input id="withdrawal-upi" type="text" placeholder="e.g., yourname@upi" value={upi} onChange={(e) => setUpi(e.target.value)} required />
            </div>
             <Button type="submit" disabled={isLoading} className="w-full">
                 {isLoading ? <Loader2 className="animate-spin" /> : null}
                {isLoading ? "Requesting..." : "Request Withdrawal"}
            </Button>
        </form>
    );
}

function TransactionHistory() {
    const { transactions } = useAppContext();
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    Transaction History
                </CardTitle>
                <CardDescription>A log of your deposits and withdrawals.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.length > 0 ? (
                            transactions.map(t => (
                                <TableRow key={t.id}>
                                    <TableCell className="capitalize">{t.type}</TableCell>
                                    <TableCell>₹{t.amount.toFixed(2)}</TableCell>
                                    <TableCell><Badge variant={t.status === 'approved' ? 'default' : t.status === 'rejected' ? 'destructive' : 'secondary'}>{t.status}</Badge></TableCell>
                                    <TableCell>{format(toDate(t.timestamp), 'PP pp')}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">No transactions yet.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function ReferAndEarn() {
    const { userData } = useAppContext();
    const { toast } = useToast();

    if (!userData) {
        return <Loader2 className="animate-spin" />;
    }

    const handleCopyCode = () => {
        if (userData.referralCode) {
            navigator.clipboard.writeText(userData.referralCode);
            toast({ title: "Referral code copied!" });
        }
    };

    const handleShare = async () => {
        const shareText = `Join me on ColorCash and get a ₹75 bonus! Use my referral code: ${userData.referralCode}`;
        const shareData = {
            title: 'Join ColorCash',
            text: shareText,
            url: window.location.origin,
        };
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                navigator.clipboard.writeText(shareText);
                toast({ title: "Copied to clipboard!", description: "You can now paste the referral message." });
            }
        } else {
            navigator.clipboard.writeText(shareText);
            toast({ title: "Copied to clipboard!", description: "Share text copied. You can now paste it." });
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Refer & Earn</CardTitle>
                    <CardDescription>Invite your friends and earn rewards when they sign up.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 bg-secondary rounded-lg">
                        <h4 className="text-sm text-muted-foreground">Successful Referrals</h4>
                        <p className="text-2xl font-bold">{userData.successfulReferrals || 0}</p>
                    </div>
                    <div className="p-4 bg-secondary rounded-lg">
                        <h4 className="text-sm text-muted-foreground">Total Referral Earnings</h4>
                        <p className="text-2xl font-bold">₹{(userData.referralEarnings || 0).toFixed(2)}</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="pt-6 space-y-4">
                    <Label htmlFor="referral-code">Your Referral Code</Label>
                    <div className="flex gap-2">
                        <Input id="referral-code" value={userData.referralCode || ''} readOnly />
                        <Button onClick={handleCopyCode} variant="outline" size="icon"><Copy /></Button>
                    </div>

                    <Button onClick={handleShare} className="w-full"><Share2 /> Share Your Code</Button>
                </CardContent>
            </Card>

             <Alert>
                <Gift className="h-4 w-4" />
                <AlertTitle>How it Works</AlertTitle>
                <AlertDescription>
                    When your friend signs up with your code, they get a <strong className="text-foreground">₹75 bonus</strong> and you get <strong className="text-foreground">₹25</strong> in your wallet!
                </AlertDescription>
            </Alert>
        </div>
    )
}

export function WalletTabs() {
  return (
    <Tabs defaultValue="deposit" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="deposit"><ArrowDownCircle/> Deposit</TabsTrigger>
        <TabsTrigger value="withdraw"><ArrowUpCircle/> Withdraw</TabsTrigger>
        <TabsTrigger value="referrals"><Users/> Referrals</TabsTrigger>
        <TabsTrigger value="history"><Gift/> History</TabsTrigger>
      </TabsList>
      <TabsContent value="deposit">
        <Card>
          <CardHeader>
            <CardTitle>Deposit</CardTitle>
            <CardDescription>
              Step 1: Pay using the QR code or UPI ID. After paying, submit the transaction details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DepositForm />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="withdraw">
        <Card>
          <CardHeader>
            <CardTitle>Withdraw</CardTitle>
            <CardDescription>
              Request a withdrawal to your UPI account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WithdrawalForm />
          </CardContent>
        </Card>
      </TabsContent>
       <TabsContent value="referrals">
          <ReferAndEarn />
      </TabsContent>
      <TabsContent value="history">
          <TransactionHistory />
      </TabsContent>
    </Tabs>
  );
}

    