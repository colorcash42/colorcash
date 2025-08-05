
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
         
            
                Time Remaining
            
            
                {formatTime(remaining)}
            
         
    );
}


export function FourColorGame() {
  const { walletBalance, placeFourColorBet, liveGameRound, userLiveBets } = useAppContext();
  const [amount, setAmount] = useState('10');
  const [betOnColor, setBetOnColor] = useState('Red');
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
    const bets: Record = { Red: 0, Yellow: 0, Black: 0, Blue: 0 };
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
             
                
                    No Active Round
                    Please wait for an admin to start a new round.
                
             
        );
    }
    
    if (liveGameRound.status === 'awarding' && liveGameRound.winningColor) {
         return (
             
                
                    
                        Round Over!
                        The winning color was .
                        
                        Payouts have been processed. A new round will start soon.
                    
                
             
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
             
                
                
                 
                    1. Select a Color
                    
                        {colors.map(color => (
                            
                                
                                    {color}
                                
                                {userBetsByColor[color] > 0 && (
                                     ₹{userBetsByColor[color]}
                                    )}
                            
                        ))}
                    
                 

                 
                    2. Enter your bet amount
                    
                        
                            
                            
                            
                            
                            
                            
                        
                        
                         
                         
                         
                         
                    
                

                
                    {isLoading ?  : }
                    {isLoading ? 'Placing Bet...' : `Place Bet on ${betOnColor} (₹${amount || 0})`}
                
            
        )
    }

     return (
         
            
                
                Syncing with live game...
            
         
    );
  }

  return (
    
        {renderGameContent()}
    
  );
}
