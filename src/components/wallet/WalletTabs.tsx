"use client";
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppContext } from "@/context/AppContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowDownCircle, ArrowUpCircle, Copy, Download, Gift, Users, Share2 } from 'lucide-react';
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
        <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="flex flex-col items-center justify-center p-4 border rounded-lg bg-secondary/50">
                 <h3 className="text-lg font-semibold mb-4">Scan to Pay</h3>
                 <div className="relative w-48 h-48 mb-4">
                    <img 
                        src="/qrcode.jpg" 
                        alt="UPI QR Code for 8949956264@kotak" 
                        width="192"
                        height="192"
                        className="object-contain"
                    />
                 </div>
                 <div className="text-center space-y-3">
                    <div>
                        <p className="font-semibold text-sm">Or pay to UPI ID:</p>
                        <div className="flex items-center gap-2 mt-1 bg-background p-2 rounded-md">
                            <span className="font-mono text-sm">{upiId}</span>
                            <Button variant="ghost" size="icon" onClick={handleCopy}>
                                <Copy className="h-4 w-4"/>
                            </Button>
                        </div>
                    </div>
                    <a href="/qrcode.jpg" download="qrcode.jpg" className={cn(buttonVariants({ variant: "outline" }))}>
                        <Download className="mr-2 h-4 w-4" />
                        Download QR
                    </a>
                 </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <h3 className="font-semibold">Step 2: Confirm Deposit</h3>
                    <p className="text-sm text-muted-foreground">After paying, enter the details below to confirm your deposit.</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="deposit-amount">Amount Deposited</Label>
                    <Input id="deposit-amount" type="number" placeholder="e.g., 500" value={amount} onChange={e => setAmount(e.target.value)} required disabled={isLoading} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="utr">UTR / Transaction ID</Label>
                    <Input id="utr" type="text" placeholder="Enter the 12-digit UTR" value={utr} onChange={e => setUtr(e.target.value)} required disabled={isLoading} />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowDownCircle className="mr-2 h-4 w-4" />}
                    {isLoading ? "Submitting..." : "Confirm Deposit"}
                </Button>
            </form>
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
            <div className="space-y-2">
                <Label htmlFor="withdrawal-amount">Amount</Label>
                <Input id="withdrawal-amount" type="number" placeholder="e.g., 200" value={amount} onChange={e => setAmount(e.target.value)} required disabled={isLoading} max={walletBalance} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="upi">Your UPI ID for payment</Label>
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
    );
}

function ReferAndEarn() {
    const { userData } = useAppContext();
    const { toast } = useToast();

    if (!userData) {
        return <Loader2 className="animate-spin" />;
    }

    const handleCopyCode = () => {
        navigator.clipboard.writeText(userData.referralCode);
        toast({ title: "Referral code copied!" });
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
                // If sharing fails (e.g., user cancels or permission is denied),
                // fall back to copying to clipboard.
                navigator.clipboard.writeText(shareText);
                toast({ title: "Copied to clipboard!", description: "Sharing was canceled, so we copied the text for you." });
            }
        } else {
            // Fallback for browsers that don't support the Share API
            navigator.clipboard.writeText(shareText);
            toast({ title: "Copied to clipboard!", description: "Share text copied. You can now paste it." });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className='font-headline'>Refer &amp; Earn</CardTitle>
                <CardDescription>
                    Invite your friends and earn rewards when they sign up.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Alert>
                        <Users className="h-4 w-4" />
                        <AlertTitle>Successful Referrals</AlertTitle>
                        <AlertDescription className="text-2xl font-bold">
                            {userData.successfulReferrals || 0}
                        </AlertDescription>
                    </Alert>
                    <Alert>
                        <Gift className="h-4 w-4" />
                        <AlertTitle>Total Referral Earnings</AlertTitle>
                        <AlertDescription className="text-2xl font-bold">
                            ₹{(userData.referralEarnings || 0).toFixed(2)}
                        </AlertDescription>
                    </Alert>
                </div>

                <div className="text-center p-4 border-2 border-dashed rounded-lg space-y-2">
                    <Label htmlFor="referral-code" className="text-sm text-muted-foreground">Your Referral Code</Label>
                    <div className="flex items-center justify-center gap-2">
                        <Input 
                            id="referral-code"
                            readOnly 
                            value={userData.referralCode}
                            className="text-center text-lg font-bold bg-secondary/50 h-12"
                        />
                         <Button variant="ghost" size="icon" onClick={handleCopyCode}>
                            <Copy className="h-5 w-5"/>
                        </Button>
                    </div>
                </div>

                <Button onClick={handleShare} className="w-full">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share Your Code
                </Button>

                 <Alert variant="default" className="bg-primary/10 border-primary/20">
                    <Gift className="h-4 w-4" />
                    <AlertTitle className="font-semibold">How it Works</AlertTitle>
                    <AlertDescription>
                        When your friend signs up with your code, they get a <span className="font-bold">₹75 bonus</span> and you get <span className="font-bold">₹25</span> in your wallet!
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    )
}

export function WalletTabs() {
  return (
    <Tabs defaultValue="deposit" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="deposit">Deposit</TabsTrigger>
        <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
        <TabsTrigger value="refer">Refer &amp; Earn</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      <TabsContent value="deposit">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className='font-headline'>Deposit Funds</CardTitle>
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
       <TabsContent value="refer">
        <ReferAndEarn />
      </TabsContent>
      <TabsContent value="history">
        <TransactionHistory />
      </TabsContent>
    </Tabs>
  );
}
