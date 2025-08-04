"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Gem, Loader2, Clock, PartyPopper } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Timestamp } from 'firebase/firestore';
import { useSound } from '@/hooks/use-sound';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import type { LiveBet } from '@/lib/types';


const getRemainingSeconds = (endTime: string | Date | Timestamp | null): number => {
    if (!endTime) return 0;
    const end = endTime instanceof Timestamp ? endTime.toMillis() : new Date(endTime as string).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((end - now) / 1000));
}

function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function GameTimer({ round }) {
    const [remaining, setRemaining] = useState(0);

    useEffect(() => {
        if (round?.status === 'betting' && round.endTime) {
            const updateTimer = () => {
                setRemaining(getRemainingSeconds(round.endTime));
            };
            updateTimer();
            const interval = setInterval(updateTimer, 1000);
            return () => clearInterval(interval);
        } else {
            setRemaining(0);
        }
    }, [round]);

    if (round?.status !== 'betting') {
        return null;
    }

    return (
        <div className="text-center font-mono text-2xl md:text-4xl p-4 my-4 bg-secondary rounded-lg tabular-nums">
            <p>Time Remaining</p>
            <p>{formatTime(remaining)}</p>
        </div>
    );
}


export function FourColorGame() {
  const { walletBalance, placeFourColorBet, liveGameRound, userLiveBets } = useAppContext();
  const [amount, setAmount] = useState('10');
  const [betOnColor, setBetOnColor] = useState<'Red' | 'Yellow' | 'Black' | 'Blue'>('Red');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const playBetSound = useSound('https://firebasestorage.googleapis.com/v0/b/trivium-clash.appspot.com/o/sounds%2Fbet.mp3?alt=media&token=1434c114-53c7-4df3-92f7-234f59846114');

  const handleBet = async () => {
    setIsLoading(true);
    const betAmount = parseFloat(amount);
    
    // Validations
    if (isNaN(betAmount) || betAmount <= 0) {
      toast({ variant: "destructive", title: "Invalid Amount" });
      setIsLoading(false);
      return;
    }
    if (betAmount > walletBalance) {
      toast({ variant: "destructive", title: "Insufficient Balance" });
      setIsLoading(false);
      return;
    }
    if (!liveGameRound || liveGameRound.status !== 'betting') {
        toast({ variant: "destructive", title: "Betting Closed" });
        setIsLoading(false);
        return;
    }
    
    playBetSound();
    await placeFourColorBet(betAmount, betOnColor);
    setIsLoading(false);
  };
  
  const handlePresetAmount = (presetAmount: number) => {
    setAmount(current => (parseFloat(current || '0') + presetAmount).toString());
  };

  const userBetsByColor = useMemo(() => {
    const bets: Record<string, number> = { Red: 0, Yellow: 0, Black: 0, Blue: 0 };
    userLiveBets.forEach((bet: LiveBet) => {
        if (bet.betOnColor) {
            bets[bet.betOnColor] += bet.amount;
        }
    });
    return bets;
  }, [userLiveBets]);

  const renderGameContent = () => {
    if (!liveGameRound) {
        return (
            <Alert>
                <Clock className="h-4 w-4" />
                <AlertTitle>No Active Round</AlertTitle>
                <AlertDescription>
                    Please wait for an admin to start a new round.
                </AlertDescription>
            </Alert>
        );
    }
    
    if (liveGameRound.status === 'awarding' && liveGameRound.winningColor) {
         return (
             <Alert className="bg-primary/10 border-primary/20 text-center p-6 space-y-4">
                <PartyPopper className="h-8 w-8 mx-auto text-primary" />
                <AlertTitle className="text-2xl font-bold">Round Over!</AlertTitle>
                <AlertDescription className="text-lg">
                    The winning color was <span className="font-bold">{liveGameRound.winningColor}</span>.
                    <br />
                    Payouts have been processed. A new round will start soon.
                </AlertDescription>
            </Alert>
         )
    }

    if (liveGameRound.status === 'betting') {
        const colors: Array<'Red' | 'Yellow' | 'Black' | 'Blue'> = ['Red', 'Yellow', 'Black', 'Blue'];
        const colorClasses = {
            Red: "bg-red-500/20 hover:bg-red-500/40 data-[state=on]:bg-red-500 data-[state=on]:text-white",
            Yellow: "bg-yellow-400/20 hover:bg-yellow-400/40 data-[state=on]:bg-yellow-400 data-[state=on]:text-black",
            Black: "bg-zinc-700/20 hover:bg-zinc-700/40 data-[state=on]:bg-black data-[state=on]:text-white",
            Blue: "bg-blue-500/20 hover:bg-blue-500/40 data-[state=on]:bg-blue-500 data-[state=on]:text-white"
        };
        
        return (
             <div className="animate-fade-in space-y-4">
                <GameTimer round={liveGameRound} />
                
                 <div>
                    <Label className="mb-2 block font-semibold">1. Select a Color</Label>
                    <ToggleGroup type="single" value={betOnColor} onValueChange={(val: any) => val && setBetOnColor(val)} className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {colors.map(color => (
                            <div key={color} className="relative">
                                <ToggleGroupItem value={color} aria-label={`Bet on ${color}`} className={`w-full h-20 text-xl ${colorClasses[color]}`}>
                                    {color}
                                </ToggleGroupItem>
                                {userBetsByColor[color] > 0 && (
                                    <div className="absolute top-1 right-1 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                                        ₹{userBetsByColor[color]}
                                    </div>
                                )}
                            </div>
                        ))}
                    </ToggleGroup>
                 </div>

                 <div>
                    <Label htmlFor="bet-amount" className="mb-2 block font-semibold">2. Enter your bet amount</Label>
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

                <Button onClick={handleBet} className="w-full text-lg py-6" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Gem className="mr-2 h-5 w-5" />}
                    {isLoading ? 'Placing Bet...' : `Place Bet on ${betOnColor} (₹${amount || 0})`}
                </Button>
            </div>
        )
    }

     return (
        <div className="text-center p-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Syncing with live game...</p>
        </div>
    );
  }

  return (
    <CardContent className="pt-6 flex-1 flex flex-col justify-center">
        {renderGameContent()}
    </CardContent>
  );
}
