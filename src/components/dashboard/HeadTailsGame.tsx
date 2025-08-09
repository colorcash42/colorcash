
"use client";
import React, { useState } from 'react';
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Coins, Gem, Loader2 } from 'lucide-react';
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

    const { isWin, winningSide, payout } = result;
    
    return (        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="text-center">
                <DialogHeader>
                    <DialogTitle className={cn("text-3xl font-bold", isWin ? "text-green-500" : "text-destructive")}>{isWin ? "Congratulations, You Won!" : "Sorry, You Lost"}</DialogTitle>
                    <DialogDescription>The coin landed on...</DialogDescription>
                </DialogHeader>
                <div className="my-6 flex flex-col items-center justify-center">
                    <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center shadow-lg bg-secondary text-4xl font-bold">
                        {winningSide === 'Heads' ? 'H' : 'T'}
                    </div>
                     <p className="font-semibold text-lg mt-2">{winningSide}</p>
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


export function HeadTailsGame({ walletBalance }: { walletBalance: number }) {
  const { placeHeadTailsBet } = useAppContext();
  const [amount, setAmount] = useState('10');
  const [isLoading, setIsLoading] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [betValue, setBetValue] = useState<'Heads' | 'Tails'>('Heads');
  const [finalSide, setFinalSide] = useState<'Heads' | 'Tails' | null>(null);
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
    setIsFlipping(true);
    setFinalSide(null);
    playBetSound();
    
    const response = await placeHeadTailsBet(betAmount, betValue);
    
    setTimeout(() => {
        if (response.success && response.result) {
            setFinalSide(response.result.winningSide);
            setTimeout(() => {
                setLastResult(response.result);
                setLastBetAmount(betAmount);
                setIsResultOpen(true);
                if (response.result.isWin) {
                    playWinSound();
                } else {
                    playLoseSound();
                }
                setIsFlipping(false);
                setIsLoading(false);
                setFinalSide(null);
            }, 1000); // Wait a bit after coin settles
        } else {
           toast({
            variant: "destructive",
            title: "Bet Failed",
            description: response.message,
          });
          setIsFlipping(false);
          setIsLoading(false);
          setFinalSide(null);
        }
    }, 2500); // Duration of the flip animation
  };
  
  const handlePresetAmount = (presetAmount: number) => {
    setAmount(current => (parseFloat(current || '0') + presetAmount).toString());
  };
  
  let animationClass = '';
  if (isFlipping) {
      animationClass = finalSide === 'Heads' ? 'animate-flip-heads' : finalSide === 'Tails' ? 'animate-flip-tails' : 'animate-flip-loop';
  }

  return (
    <>
    <CardContent className="space-y-6">

         <div className="flex justify-center items-center min-h-[120px]">
            <div className="[perspective:1000px]">
                <div className={cn("relative w-24 h-24 coin-container", isFlipping && animationClass)}>
                     {/* Heads Face */}
                     <div className="absolute w-full h-full rounded-full flex items-center justify-center text-5xl font-bold bg-yellow-400 text-yellow-900 border-4 border-yellow-500 coin-face [transform:rotateY(180deg)]">
                        H
                    </div>
                     {/* Tails Face */}
                    <div className="absolute w-full h-full rounded-full flex items-center justify-center text-5xl font-bold bg-gray-400 text-gray-900 border-4 border-gray-500 coin-face">
                        T
                    </div>
                </div>
            </div>
        </div>


        <div className="space-y-2">
             <Label>1. Select your choice:</Label>
             <ToggleGroup type="single" value={betValue} onValueChange={(v) => v && setBetValue(v as any)} className="grid grid-cols-2" disabled={isLoading}>
                <ToggleGroupItem value="Heads" className="data-[state=on]:bg-yellow-500 data-[state=on]:text-white">Heads</ToggleGroupItem>
                <ToggleGroupItem value="Tails" className="data-[state=on]:bg-gray-500 data-[state=on]:text-white">Tails</ToggleGroupItem>
             </ToggleGroup>
        </div>
        
        <div className="space-y-2">
             <Label htmlFor="bet-amount-headtails">2. Enter your bet amount:</Label>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                <Input id="bet-amount-headtails" type="number" value={amount} onChange={e => setAmount(e.target.value)} className="pl-6" disabled={isLoading} />
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs">
                <Button variant="outline" size="sm" onClick={() => handlePresetAmount(10)} disabled={isLoading}>+10</Button>
                <Button variant="outline" size="sm" onClick={() => handlePresetAmount(50)} disabled={isLoading}>+50</Button>
                <Button variant="outline" size="sm" onClick={() => handlePresetAmount(100)} disabled={isLoading}>+100</Button>
                <Button variant="outline" size="sm" onClick={() => handlePresetAmount(500)} disabled={isLoading}>+500</Button>
            </div>
        </div>

        <Button onClick={handleBet} disabled={isLoading} className="w-full text-lg py-6">
            {isLoading ? <Loader2 className="animate-spin" /> : <Coins />}
            {isLoading ? 'Flipping...' : `Bet (₹${amount || 0})`}
        </Button>
    </CardContent>

    <ResultDialog isOpen={isResultOpen} onOpenChange={setIsResultOpen} result={lastResult} betAmount={lastBetAmount} />
    </>
  );
}

