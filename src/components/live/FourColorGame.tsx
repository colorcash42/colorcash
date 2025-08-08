
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
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';


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

function GameTimer({ round }: { round: any }) {
    const [remaining, setRemaining] = useState(0);

    useEffect(() => {
        if (round?.status === 'betting' && round.endTime) {
            const updateTimer = () => {
                const secs = getRemainingSeconds(round.endTime);
                setRemaining(secs);
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

    const isLowTime = remaining <= 30;

    return (
         <div className={cn("text-center p-3 rounded-lg border", isLowTime ? "bg-destructive/10 border-destructive text-destructive" : "bg-secondary")}>
            <div className="text-sm font-medium">
                Time Remaining
            </div>
            <div className="text-3xl font-bold font-mono tracking-widest">
                {formatTime(remaining)}
            </div>
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
             <CardContent>
                <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertTitle>No Active Round</AlertTitle>
                    <AlertDescription>Please wait for an admin to start a new round.</AlertDescription>
                </Alert>
             </CardContent>
        );
    }
    
    if (liveGameRound.status === 'awarding' && liveGameRound.winningColor) {
         return (
             <CardContent>
                <Alert className="bg-green-500/10 border-green-500 text-green-700 dark:text-green-400 [&>svg]:text-green-700 dark:[&>svg]:text-green-400">
                    <PartyPopper className="h-4 w-4" />
                    <AlertTitle>
                        Round Over! The winning color was {liveGameRound.winningColor}.
                    </AlertTitle>
                    <AlertDescription>
                        Payouts have been processed. A new round will start soon.
                    </AlertDescription>
                </Alert>
             </CardContent>
         )
    }

    if (liveGameRound.status === 'betting') {
        const colors: Array<'Red' | 'Yellow' | 'Black' | 'Blue'> = ['Red', 'Yellow', 'Black', 'Blue'];
        const colorClasses = {
            Red: "data-[state=on]:bg-red-500 data-[state=on]:text-white",
            Yellow: "data-[state=on]:bg-yellow-400 data-[state=on]:text-black",
            Black: "data-[state=on]:bg-black data-[state=on]:text-white",
            Blue: "data-[state=on]:bg-blue-500 data-[state=on]:text-white"
        };
        
        return (
             <CardContent className="space-y-6">
                <GameTimer round={liveGameRound} />
                <div className="space-y-2">
                    <Label>1. Select a Color</Label>
                    <ToggleGroup type="single" value={betOnColor} onValueChange={(v) => v && setBetOnColor(v as any)} className="grid grid-cols-2 gap-2">
                        {colors.map(color => (
                            <ToggleGroupItem key={color} value={color} className={cn("flex flex-col h-auto py-2", colorClasses[color])}>
                                    <span>{color}</span>
                                {userBetsByColor[color] > 0 && (
                                     <Badge variant="secondary" className="mt-1">Bet: ₹{userBetsByColor[color]}</Badge>
                                    )}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                 </div>

                 <div className="space-y-2">
                    <Label htmlFor="live-bet-amount">2. Enter your bet amount</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                        <Input id="live-bet-amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} className="pl-6" />
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                        <Button variant="outline" size="sm" onClick={() => handlePresetAmount(10)}>+10</Button>
                        <Button variant="outline" size="sm" onClick={() => handlePresetAmount(50)}>+50</Button>
                        <Button variant="outline" size="sm" onClick={() => handlePresetAmount(100)}>+100</Button>
                        <Button variant="outline" size="sm" onClick={() => handlePresetAmount(500)}>+500</Button>
                    </div>
                </div>

                <Button onClick={handleBet} disabled={isLoading} className="w-full text-lg py-6">
                    {isLoading ? <Loader2 className="animate-spin" /> : <Gem />}
                    {isLoading ? 'Placing Bet...' : `Place Bet on ${betOnColor} (₹${amount || 0})`}
                </Button>
            </CardContent>
        )
    }

     return (
         <CardContent>
            <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertTitle>Syncing with live game...</AlertTitle>
            </Alert>
         </CardContent>
    );
  }

  return (
    <>
        {renderGameContent()}
    </>
  );
}
