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
} from "@/components/ui/dialog"
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/use-sound';

function ResultDialog({ isOpen, onOpenChange, result, betAmount }) {
    if (!result) return null;

    const { isWin, winningNumber, payout } = result;
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md text-center">
                <DialogHeader>
                    <DialogTitle className={`text-3xl font-bold ${isWin ? 'text-primary' : 'text-destructive'}`}>
                        {isWin ? "Congratulations, You Won!" : "Sorry, You Lost"}
                    </DialogTitle>
                     <DialogDescription>
                        The die rolled...
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-center space-x-4 my-6">
                    <div className={cn("p-4 rounded-lg text-6xl font-bold animate-pop-in bg-secondary")}>
                        {winningNumber}
                    </div>
                </div>

                <div className="text-lg">
                    {isWin ? (
                        <p>You won <span className="font-bold text-primary">₹{payout.toFixed(2)}</span></p>
                    ) : (
                        <p>You lost <span className="font-bold text-destructive">₹{betAmount.toFixed(2)}</span></p>
                    )}
                </div>
                 <Button onClick={() => onOpenChange(false)} className="mt-4">
                    Play Again
                </Button>
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
  const buttonAnimation = "transition-transform duration-200 hover:scale-105";

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
    
    if (response.success) {
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
    <Card className="shadow-lg animate-fade-in">
        <CardContent className="pt-6">
            <div className="space-y-6">
                
                {/* Bet Value Selection */}
                <div>
                     <Label className="mb-2 block font-semibold">1. Select your choice:</Label>
                     <ToggleGroup type="single" value={betValue} onValueChange={(val: 'Odd' | 'Even') => val && setBetValue(val)} className="grid grid-cols-2 gap-2">
                        <ToggleGroupItem value="Odd" className={cn("bg-blue-500/20 hover:bg-blue-500/40 data-[state=on]:bg-blue-500 data-[state=on]:text-white", buttonAnimation)}>Odd</ToggleGroupItem>
                        <ToggleGroupItem value="Even" className={cn("bg-purple-500/20 hover:bg-purple-500/40 data-[state=on]:bg-purple-500 data-[state=on]:text-white", buttonAnimation)}>Even</ToggleGroupItem>
                     </ToggleGroup>
                </div>
                
                 {/* Amount Input */}
                <div>
                    <Label htmlFor="bet-amount" className="mb-2 block font-semibold">2. Enter your bet amount:</Label>
                    <div className="flex gap-2">
                        <Input 
                            id="bet-amount" 
                            type="number" 
                            placeholder="Bet Amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min="1"
                            step="any"
                            required
                            disabled={isLoading}
                            className="text-lg h-12"
                        />
                         <Button type="button" variant="outline" className="h-12" onClick={() => handlePresetAmount(10)}>+10</Button>
                         <Button type="button" variant="outline" className="h-12" onClick={() => handlePresetAmount(50)}>+50</Button>
                         <Button type="button" variant="outline" className="h-12" onClick={() => handlePresetAmount(100)}>+100</Button>
                    </div>
                </div>

                {/* Submit Button */}
                <Button onClick={handleBet} className="w-full text-lg py-6" disabled={isLoading}>
                    {isLoading ? 
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 
                    <Dices className="mr-2 h-5 w-5" />
                    }
                    {isLoading ? 'Placing Bet...' : `Bet (₹${amount || 0})`}
                </Button>
            </div>
        </CardContent>
    </Card>

    <ResultDialog 
        isOpen={isResultOpen}
        onOpenChange={setIsResultOpen}
        result={lastResult}
        betAmount={lastBetAmount}
    />
    </>
  );
}
