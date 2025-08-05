
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
        
            
                
                    
                        {isWin ? "Congratulations, You Won!" : "Sorry, You Lost"}
                        The die rolled...
                    
                
                
                    
                        {winningNumber}
                    
                

                
                    {isWin ? (
                        You won ₹{payout.toFixed(2)}
                    ) : (
                        You lost ₹{betAmount.toFixed(2)}
                    )}
                
                 
                    Play Again
                
            
        
    )
}


export function OddEvenGame({ walletBalance }: { walletBalance: number }) {
  const { placeOddEvenBet } = useAppContext();
  const [amount, setAmount] = useState('10');
  const [isLoading, setIsLoading] = useState(false);
  const [betValue, setBetValue] = useState('Odd');
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
    
        
            
            
                 1. Select your choice:
                 
                    
                        
                            Odd
                        
                        
                            Even
                        
                     
            
            
             2. Enter your bet amount:
            
                
                     
                    
                    
                    
                     
                     
                    
                     
                     
                    
                
            

             

            
                {isLoading ? 
                 : 
                }
                {isLoading ? 'Placing Bet...' : `Bet (₹${amount || 0})`}
            
        
    

    
        
    
    </>
  );
}
