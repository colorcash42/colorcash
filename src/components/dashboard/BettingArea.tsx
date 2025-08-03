"use client";
import React, { useState } from 'react';
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Gem, Loader2 } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from '@/lib/utils';


type BetType = 'color' | 'number' | 'size';
type BetValue = string | number;

function ResultDialog({ isOpen, onOpenChange, result, betAmount }) {
    if (!result) return null;

    const { isWin, winningNumber, winningColor, winningSize, payout } = result;
    
    const getWinningColorClasses = (color) => {
        if (color === 'Green') return 'bg-green-500 text-white';
        if (color === 'Red') return 'bg-red-500 text-white';
        if (color === 'VioletGreen') return 'bg-gradient-to-r from-violet-500 to-green-500 text-white';
        if (color === 'VioletRed') return 'bg-gradient-to-r from-violet-500 to-red-500 text-white';
        return 'bg-gray-400 text-white';
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md text-center">
                <DialogHeader>
                    <DialogTitle className={`text-3xl font-bold ${isWin ? 'text-primary' : 'text-destructive'}`}>
                        {isWin ? "Congratulations, You Won!" : "Sorry, You Lost"}
                    </DialogTitle>
                     <DialogDescription>
                        The winning result is below.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-center space-x-4 my-6">
                    <div className={cn("p-4 rounded-lg text-4xl font-bold", getWinningColorClasses(winningColor))}>
                        {winningNumber}
                    </div>
                    <div className="text-left">
                        <p className="font-semibold">{winningColor.replace('Violet', 'Violet + ')}</p>
                        <p className="font-semibold">{winningSize}</p>
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


export function BettingArea({ walletBalance }: { walletBalance: number }) {
  const { placeBet } = useAppContext();
  const [amount, setAmount] = useState('10');
  const [isLoading, setIsLoading] = useState(false);
  const [betType, setBetType] = useState<BetType>('color');
  const [betValue, setBetValue] = useState<BetValue>('Green');
  const { toast } = useToast();
  
  const [isResultOpen, setIsResultOpen] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [lastBetAmount, setLastBetAmount] = useState(0);

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
    const response = await placeBet(betAmount, betType, betValue);
    
    if (response.success) {
      setLastResult(response.result);
      setLastBetAmount(betAmount);
      setIsResultOpen(true);
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
    <Card className="shadow-lg">
        <CardContent className="pt-6">
            <div className="space-y-6">
                {/* Bet Type Selection */}
                <div>
                    <Label className="mb-2 block font-semibold">1. Choose what to bet on:</Label>
                    <ToggleGroup type="single" value={betType} onValueChange={(val: BetType) => {
                        if (val) {
                            setBetType(val);
                            // Reset bet value when type changes
                            if (val === 'color') setBetValue('Green');
                            if (val === 'number') setBetValue(0);
                            if (val === 'size') setBetValue('Small');
                        }
                    }} className="w-full">
                        <ToggleGroupItem value="color" className="w-1/3">Color</ToggleGroupItem>
                        <ToggleGroupItem value="number" className="w-1/3">Number</ToggleGroupItem>
                        <ToggleGroupItem value="size" className="w-1/3">Size</ToggleGroupItem>
                    </ToggleGroup>
                </div>

                {/* Bet Value Selection */}
                <div>
                     <Label className="mb-2 block font-semibold">2. Select your choice:</Label>
                    {betType === 'color' && (
                         <ToggleGroup type="single" value={betValue as string} onValueChange={(val) => val && setBetValue(val)} className="grid grid-cols-3 gap-2">
                             <ToggleGroupItem value="Green" className="bg-green-500/20 hover:bg-green-500/40 data-[state=on]:bg-green-500 data-[state=on]:text-white">Green</ToggleGroupItem>
                             <ToggleGroupItem value="Violet" className="bg-violet-500/20 hover:bg-violet-500/40 data-[state=on]:bg-violet-500 data-[state=on]:text-white">Violet</ToggleGroupItem>
                             <ToggleGroupItem value="Red" className="bg-red-500/20 hover:bg-red-500/40 data-[state=on]:bg-red-500 data-[state=on]:text-white">Red</ToggleGroupItem>
                         </ToggleGroup>
                    )}
                     {betType === 'number' && (
                         <ToggleGroup type="single" value={betValue.toString()} onValueChange={(val) => val && setBetValue(Number(val))} className="grid grid-cols-5 gap-2">
                            {Array.from({length: 10}, (_, i) => i).map(num => (
                                <ToggleGroupItem key={num} value={num.toString()}>{num}</ToggleGroupItem>
                            ))}
                         </ToggleGroup>
                    )}
                     {betType === 'size' && (
                         <ToggleGroup type="single" value={betValue as string} onValueChange={(val) => val && setBetValue(val)} className="grid grid-cols-2 gap-2">
                           <ToggleGroupItem value="Small" className="bg-blue-500/20 hover:bg-blue-500/40 data-[state=on]:bg-blue-500 data-[state=on]:text-white">Small</ToggleGroupItem>
                           <ToggleGroupItem value="Big" className="bg-yellow-500/20 hover:bg-yellow-500/40 data-[state=on]:bg-yellow-500 data-[state=on]:text-white">Big</ToggleGroupItem>
                         </ToggleGroup>
                    )}
                </div>
                
                 {/* Amount Input */}
                <div>
                    <Label htmlFor="bet-amount" className="mb-2 block font-semibold">3. Enter your bet amount:</Label>
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
                    <Gem className="mr-2 h-5 w-5" />
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
