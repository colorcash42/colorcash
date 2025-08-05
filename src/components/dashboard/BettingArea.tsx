
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
        
            
                
                    
                        {isWin ? "Congratulations, You Won!" : "Sorry, You Lost"}
                        The winning result is below.
                    
                
                
                    
                        
                            {winningNumber}
                        
                        
                            
                                {winningColor.replace('Violet', 'Violet + ')}
                            
                            {winningSize}
                        
                    
                

                
                    {isWin ? (
                        You won ₹{payout.toFixed(2)}
                    ) : (
                        You lost ₹{betAmount.toFixed(2)}
                    )}
                
                 
                    Play Again
                
            
        
    )
}


export function BettingArea({ walletBalance }: { walletBalance: number }) {
  const { placeBet, getGuruSuggestion } = useAppContext();
  const [amount, setAmount] = useState('10');
  const [isLoading, setIsLoading] = useState(false);
  const [isGuruLoading, setIsGuruLoading] = useState(false);
  const [guruSuggestion, setGuruSuggestion] = useState(null);
  const [betType, setBetType] = useState('color');
  const [betValue, setBetValue] = useState('Green');
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
  
  const buttonAnimation = "transition-transform duration-200 hover:scale-105";

  return (
    <>
    
        
            
                
                     1. Choose what to bet on:
                    
                        
                            Color
                        
                        
                            Number
                        
                        
                            Size
                        
                    
                
                
                     2. Select your choice:
                    {betType === 'color' && (
                         
                             
                                 Green
                             
                             
                                 Violet
                             
                             
                                 Red
                             
                         
                    )}
                     {betType === 'number' && (
                         
                            
                                Trio 1-4-7
                            
                            
                                Trio 2-5-8
                            
                            
                                Trio 3-6-9
                            
                            
                                0 (Jackpot)
                            
                         
                    )}
                     {betType === 'size' && (
                         
                       
                            Small
                       
                       
                            Big
                       
                     
                    )}
                
                
                 3. Enter your bet amount:
                
                    
                         
                        
                         
                        
                         
                         
                         
                        
                         
                         
                        
                         
                        
                         
                    
                
                
                 
                    
                        {isGuruLoading ?  : }
                        {isGuruLoading ? 'Consulting the Guru...' : 'Get Guru Suggestion'}
                    
                    {guruSuggestion && (
                         
                            
                                The Guru Says:
                            
                            
                                {guruSuggestion}
                            
                        
                    )}
                

                 
                    {isLoading ? 
                     : 
                    }
                    {isLoading ? 'Placing Bet...' : `Bet (₹${amount || 0})`}
                
            
        
    

    
        
    
    </>
  );
}
