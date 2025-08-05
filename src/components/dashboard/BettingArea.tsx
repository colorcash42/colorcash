
"use client";
import React, { useState } from 'react';
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Gem, Loader2, Wand2 } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { cn } from '@/lib/utils';
import { useSound } from '@/hooks/use-sound';


type BetType = 'color' | 'number' | 'size' | 'trio';
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
            <DialogContent className="text-center">
                <DialogHeader>
                    <DialogTitle className={cn("text-3xl font-bold", isWin ? "text-green-500" : "text-destructive")}>{isWin ? "Congratulations, You Won!" : "Sorry, You Lost"}</DialogTitle>
                    <DialogDescription>The winning result is below.</DialogDescription>
                </DialogHeader>
                <div className="my-6">
                    <div className={cn("w-24 h-24 mx-auto rounded-full flex flex-col items-center justify-center shadow-lg", getWinningColorClasses(winningColor))}>
                        <span className="text-4xl font-bold">{winningNumber}</span>
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-4">
                        <span className={cn("font-semibold px-3 py-1 rounded-full", getWinningColorClasses(winningColor))}>{winningColor.replace('Violet', 'Violet + ')}</span>
                        <span className="font-semibold px-3 py-1 rounded-full bg-secondary">{winningSize}</span>
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


export function BettingArea({ walletBalance }: { walletBalance: number }) {
  const { placeBet, getGuruSuggestion } = useAppContext();
  const [amount, setAmount] = useState('10');
  const [isLoading, setIsLoading] = useState(false);
  const [isGuruLoading, setIsGuruLoading] = useState(false);
  const [guruSuggestion, setGuruSuggestion] = useState<string | null>(null);
  const [betType, setBetType] = useState<BetType>('color');
  const [betValue, setBetValue] = useState<BetValue>('Green');
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
    const response = await placeBet(betAmount, betType, betValue);
    
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
    // Clear suggestion after betting
    setGuruSuggestion(null);
    setIsLoading(false);
  };
  
  const handlePresetAmount = (presetAmount: number) => {
    setAmount(current => (parseFloat(current || '0') + presetAmount).toString());
  };

  const handleGetSuggestion = async () => {
    setIsGuruLoading(true);
    setGuruSuggestion(null);
    const suggestion = await getGuruSuggestion();
    if (suggestion) {
        setGuruSuggestion(suggestion);
    }
    setIsGuruLoading(false);
  }
  
  const handleBetTypeChange = (value: BetType) => {
    if (!value) return; // Don't allow un-selecting
    setBetType(value);
    // Reset bet value to a default for the new type
    if(value === 'color') setBetValue('Green');
    if(value === 'number') setBetValue('trio1');
    if(value === 'size') setBetValue('Small');
  }

  const buttonAnimation = "transition-transform duration-200 hover:scale-105";

  return (
    <>
    <CardContent className="space-y-6">
        <div className="space-y-2">
            <Label>1. Choose what to bet on:</Label>
            <ToggleGroup type="single" value={betType} onValueChange={handleBetTypeChange} className="grid grid-cols-3">
                <ToggleGroupItem value="color">Color</ToggleGroupItem>
                <ToggleGroupItem value="number">Number</ToggleGroupItem>
                <ToggleGroupItem value="size">Size</ToggleGroupItem>
            </ToggleGroup>
        </div>
        <div className="space-y-2">
            <Label>2. Select your choice:</Label>
            {betType === 'color' && (
                 <ToggleGroup type="single" value={betValue as string} onValueChange={(v) => v && setBetValue(v)} className="grid grid-cols-3">
                     <ToggleGroupItem value="Green" className="data-[state=on]:bg-green-500 data-[state=on]:text-white">Green</ToggleGroupItem>
                     <ToggleGroupItem value="Violet" className="data-[state=on]:bg-violet-500 data-[state=on]:text-white">Violet</ToggleGroupItem>
                     <ToggleGroupItem value="Red" className="data-[state=on]:bg-red-500 data-[state=on]:text-white">Red</ToggleGroupItem>
                 </ToggleGroup>
            )}
             {betType === 'number' && (
                 <ToggleGroup type="single" value={betValue as string} onValueChange={(v) => v && setBetValue(v)} className="grid grid-cols-2 gap-2">
                    <ToggleGroupItem value='trio1'>Trio 1-4-7</ToggleGroupItem>
                    <ToggleGroupItem value='trio2'>Trio 2-5-8</ToggleGroupItem>
                    <ToggleGroupItem value='trio3'>Trio 3-6-9</ToggleGroupItem>
                    <ToggleGroupItem value={0}>0 (Jackpot)</ToggleGroupItem>
                 </ToggleGroup>
            )}
             {betType === 'size' && (
                 <ToggleGroup type="single" value={betValue as string} onValueChange={(v) => v && setBetValue(v)} className="grid grid-cols-2">
                    <ToggleGroupItem value="Small" className="data-[state=on]:bg-indigo-500 data-[state=on]:text-white">Small</ToggleGroupItem>
                    <ToggleGroupItem value="Big" className="data-[state=on]:bg-orange-500 data-[state=on]:text-white">Big</ToggleGroupItem>
             </ToggleGroup>
            )}
        </div>
        <div className="space-y-2">
            <Label htmlFor="bet-amount">3. Enter your bet amount:</Label>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                <Input id="bet-amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} className="pl-6" />
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs">
                <Button variant="outline" size="sm" onClick={() => handlePresetAmount(10)}>+10</Button>
                <Button variant="outline" size="sm" onClick={() => handlePresetAmount(50)}>+50</Button>
                <Button variant="outline" size="sm" onClick={() => handlePresetAmount(100)}>+100</Button>
                <Button variant="outline" size="sm" onClick={() => handlePresetAmount(500)}>+500</Button>
            </div>
        </div>
        
        <div className="space-y-2">
            <Button variant="secondary" onClick={handleGetSuggestion} disabled={isGuruLoading || true} className="w-full">
                {isGuruLoading ? <Loader2 className="animate-spin" /> : <Wand2 />}
                {isGuruLoading ? 'Consulting the Guru...' : 'Get Guru Suggestion (Coming Soon)'}
            </Button>
            {guruSuggestion && (
                 <Alert className="bg-purple-500/10 border-purple-500/50 text-purple-700 dark:text-purple-400 [&>svg]:text-purple-700 dark:[&>svg]:text-purple-400">
                    <Wand2 className="h-4 w-4" />
                    <AlertTitle>The Guru Says:</AlertTitle>
                    <AlertDescription>
                        {guruSuggestion}
                    </AlertDescription>
                </Alert>
            )}
        </div>

        <Button onClick={handleBet} disabled={isLoading} className="w-full text-lg py-6">
            {isLoading ? <Loader2 className="animate-spin" /> : <Gem />}
            {isLoading ? 'Placing Bet...' : `Bet (₹${amount || 0})`}
        </Button>
    </CardContent>

    <ResultDialog isOpen={isResultOpen} onOpenChange={setIsResultOpen} result={lastResult} betAmount={lastBetAmount} />
    </>
  );
}
