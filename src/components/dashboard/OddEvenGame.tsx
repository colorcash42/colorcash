"use client";
import React, { useState } from 'react';
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Dices, Gem, Loader2 } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/use-sound';

function ResultDialog({ isOpen, onOpenChange, result, betAmount }: { isOpen: boolean, onOpenChange: (isOpen: boolean) => void, result: any, betAmount: number }) {
    if (!result) return null;

    const { isWin, winningNumber, payout } = result;
    
    return (        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="text-center">
                <DialogHeader>
                    <DialogTitle className={cn("text-3xl font-bold", isWin ? "text-green-500" : "text-destructive")}>{isWin ? "Congratulations, You Won!" : "Sorry, You Lost"}</DialogTitle>
                    <DialogDescription>The die rolled...</DialogDescription>
                </DialogHeader>
                <div className="my-6">
                    <div className="w-24 h-24 mx-auto rounded-lg flex items-center justify-center shadow-lg bg-secondary">
                        <span className="text-5xl font-bold">{winningNumber}</span>
                    </div>
                </div>
                <p className="text-lg font-medium">
                    {isWin ? (
                        `You won ₹${payout.toFixed(2)}`
                    ) : (
                        `You lost ₹${betAmount.toFixed(2)}`
                    )}
                </p>
                <DialogClose asChild>
                    <Button className="w-full mt-4">Play Again</Button>
                </DialogClose>
            </DialogContent>
        </Dialog>
    )
}


export function OddEvenGame({ walletBalance }: { walletBalance: number }) {
  const { placeOddEvenBet } = useAppContext();
  const [amount, setAmount] = useState('10');
  const [isLoading, setIsLoading] = useState(false);
  const [betValue, setBetValue] = useState<'Odd' | 'Even'>('Odd');
  const { toast } = useToast();
  
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [lastBetAmount, setLastBetAmount] = useState(0);
  
  const playBetSound = useSound('https://firebasestorage.googleapis.com/v0/b/trivium-clash.appspot.com/o/sounds%2Fbet.mp3?alt=media&token=1434c114-53c7-4df3-92f7-234f59846114');
  const playWinSound = useSound('https://firebasestorage.googleapis.com/v0/b/trivium-clash.appspot.com/o/sounds%2Fwin.mp3?alt=media&token=1a80c655-5231-4122-8356-55447a166943');
  const playLoseSound = useSound('https://firebasestorage.googleapis.com/v0/b/trivium-clash.appspot.com/o/sounds%2Flose.mp3?alt=media&token=e62925f4-3d0b-402a-9e12-07751910e53a');

  const handleBet = async () => {
    const betAmount = parseFloat(amount);
    if (isNaN(betAmount) || betAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid positive amount to bet.",
      });
      return;
    }
     if (betAmount > walletBalance) {
      toast({
        variant: "destructive",
        title: "Insufficient Balance",
        description: "You cannot bet more than your wallet balance.",
      });
      return;
    }
    
    setIsLoading(true);
    playBetSound();
    const response = await placeOddEvenBet(betAmount, betValue);
    
    if (response.success && response.result) {
      setLastResult(response.result);
      setLastBetAmount(betAmount);
      setIsResultOpen(true);
      if (response.result.isWin) {
        playWinSound();
      } else {
        playLoseSound();
      }
    } else {
       toast({
        variant: "destructive",
        title: "Bet Failed",
        description: response.message,
      });
    }
    setIsLoading(false);
  };
  
  const handlePresetAmount = (presetAmount: number) => {
    setAmount(current => (parseFloat(current || '0') + presetAmount).toString());
  };
  
  return (
    <>
    <CardContent className="space-y-6">
        <div className="space-y-2">
             <Label>1. Select your choice:</Label>
             <ToggleGroup type="single" value={betValue} onValueChange={(v) => v && setBetValue(v as any)} className="grid grid-cols-2">
                <ToggleGroupItem value="Odd" className="data-[state=on]:bg-cyan-500 data-[state=on]:text-white">Odd</ToggleGroupItem>
                <ToggleGroupItem value="Even" className="data-[state=on]:bg-purple-500 data-[state=on]:text-white">Even</ToggleGroupItem>
             </ToggleGroup>
        </div>
        
        <div className="space-y-2">
             <Label htmlFor="bet-amount-oddeven">2. Enter your bet amount:</Label>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                <Input id="bet-amount-oddeven" type="number" value={amount} onChange={e => setAmount(e.target.value)} className="pl-6" />
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs">
                <Button variant="outline" size="sm" onClick={() => handlePresetAmount(10)}>+10</Button>
                <Button variant="outline" size="sm" onClick={() => handlePresetAmount(50)}>+50</Button>
                <Button variant="outline" size="sm" onClick={() => handlePresetAmount(100)}>+100</Button>
                <Button variant="outline" size="sm" onClick={() => handlePresetAmount(500)}>+500</Button>
            </div>
        </div>

        <Button onClick={handleBet} disabled={isLoading} className="w-full text-lg py-6">
            {isLoading ? <Loader2 className="animate-spin" /> : <Dices />}
            {isLoading ? 'Placing Bet...' : `Bet (₹${amount || 0})`}
        </Button>
    </CardContent>

    <ResultDialog isOpen={isResultOpen} onOpenChange={setIsResultOpen} result={lastResult} betAmount={lastBetAmount} />
    </>
  );
}
