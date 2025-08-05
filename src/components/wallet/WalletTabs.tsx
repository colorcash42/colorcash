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
        
            

                 
                 
                    
                        
                        
                    
                 
                 

                        

                        
                            
                                
                            
                        
                        
                            
                                
                                Download QR
                            
                        
                    
                 
            
            

                 
                    
                    
                
                
                    
                    
                    
                
                
                    
                    
                    
                
                 
                    
                    
                
            
        
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
        
            
                Amount
                
            
            
                Your UPI ID for payment
                
            
             
                
                
            
        
    );
}

function TransactionHistory() {
    const { transactions } = useAppContext();
    return (
        
            
                
                    Transaction History
                
                A log of your deposits and withdrawals.
            
            
                
                    
                        
                            Type
                        
                        
                            Amount
                        
                        
                            Status
                        
                        
                            Date
                        
                    
                    
                        
                            No transactions yet.
                        
                        
                            
                                
                                
                                
                                    
                                        
                                    
                                
                                
                                
                            
                        
                    
                
            
        
    );
}

function ReferAndEarn() {
    const { userData } = useAppContext();
    const { toast } = useToast();

    if (!userData) {
        return ;
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

        // The Web Share API is more complex than just checking for navigator.share.
        // It requires a secure context (HTTPS) and a user gesture.
        // In some development environments, it might not work.
        // We will try to use it, and if it fails, we fall back to copying.
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                // This catch block handles cases where the user cancels the share dialog
                // or if the API fails for any reason. We then fall back to copying.
                navigator.clipboard.writeText(shareText);
                toast({ title: "Copied to clipboard!", description: "You can now paste the referral message." });
            }
        } else {
            // Fallback for browsers that don't support the Share API at all
            navigator.clipboard.writeText(shareText);
            toast({ title: "Copied to clipboard!", description: "Share text copied. You can now paste it." });
        }
    };

    return (
        
            
                
                    Refer & Earn
                
                Invite your friends and earn rewards when they sign up.
            
            
                
                    
                        
                            
                                Successful Referrals
                            
                            
                                {userData.successfulReferrals || 0}
                            
                        
                    
                    
                        
                            
                                Total Referral Earnings
                            
                            
                                ₹{(userData.referralEarnings || 0).toFixed(2)}
                            
                        
                    
                

                
                    
                        Your Referral Code
                        
                            
                                
                            
                             
                        
                    
                

                 
                    Share Your Code
                

                 
                    
                        
                        
                            How it Works
                        
                        
                            When your friend signs up with your code, they get a bonus and you get in your wallet!
                        
                    
                
            
        
    )
}

export function WalletTabs() {
  return (
    
      
        
        
        
        
      
      
        
          
            
              Step 1: Pay using the QR code or UPI ID. After paying, submit the transaction details.
            
          
          
        
      
      
        
          
            
              Request a withdrawal to your UPI account.
            
          
          
        
      
       
      
    
  );
}
