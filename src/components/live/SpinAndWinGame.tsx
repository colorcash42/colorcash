
"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Gem, Loader2, Circle, Clock, CheckCircle } from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Progress } from '../ui/progress';
import { getLiveGameData, placeLiveBetAction } from '@/app/actions';
import { LiveGameRound } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';
import { useSound } from '@/hooks/use-sound';

// Helper to get remaining time in seconds
const getRemainingSeconds = (endTime: string | Date | Timestamp): number => {
    if (!endTime) return 0;
    const end = (endTime as Timestamp).toMillis ? (endTime as Timestamp).toMillis() : new Date(endTime as string).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((end - now) / 1000));
}

function GameTimer({ round, bettingDuration }) {
    const [progress, setProgress] = useState(100);
    const [remaining, setRemaining] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (round?.status === 'betting' && round.spinTime) {
            const updateTimer = () => {
                const remainingSeconds = getRemainingSeconds(round.spinTime);
                const currentProgress = (remainingSeconds / bettingDuration) * 100;
                setProgress(currentProgress);
                setRemaining(remainingSeconds);
            };

            updateTimer(); // Initial call
            interval = setInterval(updateTimer, 1000);
        } else {
            setProgress(0);
            setRemaining(0);
        }
        
        return () => clearInterval(interval);

    }, [round, bettingDuration]);

    if (round?.status !== 'betting') {
        return (
             <div className="text-center text-muted-foreground p-4">
                <p>Betting for this round is closed.</p>
             </div>
        )
    }

    return (
        <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-center text-sm font-medium text-muted-foreground">
                Betting closes in {remaining} seconds
            </p>
        </div>
    );
}

const multipliers = [0, 2, 3, 5, 2, 0, 3, 2, 5, 2, 0];
const WHEEL_STOPS = multipliers.length;
const DEGREES_PER_STOP = 360 / WHEEL_STOPS;

function SpinningWheel({ winningMultiplier }: { winningMultiplier: number | null }) {
    const [rotation, setRotation] = useState(0);

    useEffect(() => {
        if (winningMultiplier !== null) {
            // Find the first index of the winning multiplier
            const winningIndex = multipliers.findIndex(m => m === winningMultiplier);
            
            if (winningIndex !== -1) {
                // Calculate the target rotation
                // Add multiple full rotations for effect
                const fullRotations = 5 * 360;
                // Position so the pointer (at top) points to the correct segment
                const targetAngle = - (winningIndex * DEGREES_PER_STOP);
                
                // Add a small random offset for variability
                const randomOffset = (Math.random() - 0.5) * (DEGREES_PER_STOP * 0.8);
                
                setRotation(fullRotations + targetAngle + randomOffset);
            }
        }
    }, [winningMultiplier]);


    return (
        <div className="relative w-64 h-64 md:w-80 md:h-80 mx-auto my-4">
             {/* Pointer */}
            <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 z-10" style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))' }}>
                 <div className="w-0 h-0 
                    border-l-[15px] border-l-transparent
                    border-r-[15px] border-r-transparent
                    border-t-[25px] border-t-primary">
                </div>
            </div>

            <div className="relative w-full h-full rounded-full border-8 border-secondary shadow-2xl transition-transform duration-[5000ms] ease-out" style={{ transform: `rotate(${rotation}deg)` }}>
                {multipliers.map((multiplier, index) => {
                    const angle = index * DEGREES_PER_STOP;
                    const isBust = multiplier === 0;
                    return (
                        <div
                            key={index}
                            className="absolute w-1/2 h-1/2 origin-bottom-right"
                            style={{ transform: `rotate(${angle}deg)` }}
                        >
                            <div
                                className={`flex items-center justify-center h-[200%] w-[200%] rounded-full ${isBust ? 'bg-destructive/20' : 'bg-primary/20'}`}
                                style={{
                                    clipPath: `polygon(50% 50%, 100% 0, 100% 100%)`, // Creates a wedge slice
                                    transform: `translateX(-50%) translateY(-50%) rotate(${-DEGREES_PER_STOP / 2}deg)` // Centers and aligns the wedge
                                }}
                            >
                                <span className="absolute text-lg md:text-xl font-bold" style={{ transform: `translate(60px, 0px) rotate(${DEGREES_PER_STOP / 2}deg)`}}>
                                    {isBust ? 'BUST' : `x${multiplier}`}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}



export function SpinAndWinGame() {
  const { walletBalance, fetchData } = useAppContext();
  const [currentRound, setCurrentRound] = useState<LiveGameRound | null>(null);
  const [amount, setAmount] = useState('10');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const playBetSound = useSound('https://firebasestorage.googleapis.com/v0/b/trivium-clash.appspot.com/o/sounds%2Fbet.mp3?alt=media&token=1434c114-53c7-4df3-92f7-234f59846114');
  
  // Fetch initial game data and set up a poller
  useEffect(() => {
    const fetchGameData = async () => {
      const { currentRound } = await getLiveGameData();
      setCurrentRound(currentRound);
    };

    fetchGameData(); // Initial fetch
    const interval = setInterval(fetchGameData, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleBet = async () => {
    const betAmount = parseFloat(amount);
    if (isNaN(betAmount) || betAmount <= 0) {
      toast({ variant: "destructive", title: "Invalid Amount" });
      return;
    }
     if (betAmount > walletBalance) {
      toast({ variant: "destructive", title: "Insufficient Balance" });
      return;
    }
    if (!currentRound || currentRound.status !== 'betting') {
        toast({ variant: "destructive", title: "Betting Closed", description: "The betting window for this round is over." });
        return;
    }
    
    setIsLoading(true);
    playBetSound();
    const response = await placeLiveBetAction(amount, currentRound.id);
    
    if (response.success) {
        toast({ title: "Bet Placed!", description: "Your bet has been accepted. Good luck!" });
    } else {
       toast({
        variant: "destructive",
        title: "Bet Failed",
        description: response.message,
      });
    }
    await fetchData(); // Refresh wallet balance
    setIsLoading(false);
  };
  
  const handlePresetAmount = (presetAmount: number) => {
    setAmount(current => (parseFloat(current || '0') + presetAmount).toString());
  };
  
  const bettingDurationSeconds = useMemo(() => {
      if (!currentRound?.startTime || !currentRound?.spinTime) return 105;
      const start = (currentRound.startTime as Timestamp).toMillis();
      const spin = (currentRound.spinTime as Timestamp).toMillis();
      return (spin - start) / 1000;
  }, [currentRound])

  return (
    <>
    <CardContent className="pt-0 flex-1 flex flex-col">
        <div className="space-y-6 flex-1 flex flex-col justify-center">

            {/* Game State Display */}
            {currentRound ? (
                <>
                    <SpinningWheel winningMultiplier={currentRound.winningMultiplier} />
                    <GameTimer round={currentRound} bettingDuration={bettingDurationSeconds} />
                </>
            ) : (
                <div className="text-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-4 text-muted-foreground">Loading current game...</p>
                </div>
            )}
            
            {/* Last Round Result */}
            {currentRound?.status === 'finished' && currentRound.winningMultiplier !== null && (
                 <Alert className="bg-accent/50 border-primary/50 animate-fade-in">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle className="font-headline">Previous Round Result</AlertTitle>
                    <AlertDescription>
                        The winning multiplier was <span className="font-bold">{currentRound.winningMultiplier > 0 ? `x${currentRound.winningMultiplier}` : 'BUST'}</span>.
                    </AlertDescription>
                </Alert>
            )}

            {currentRound?.status === 'betting' && (
                <div className="animate-fade-in space-y-4">
                     {/* Amount Input */}
                    <div>
                        <Label htmlFor="bet-amount" className="mb-2 block font-semibold">Enter your bet amount:</Label>
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
                        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Gem className="mr-2 h-5 w-5" />}
                        {isLoading ? 'Placing Bet...' : `Place Bet (₹${amount || 0})`}
                    </Button>
                </div>
            )}

             {currentRound?.status === 'spinning' && (
                 <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertTitle>Spinning!</AlertTitle>
                    <AlertDescription>
                       The wheel is spinning. Results for this round will be available shortly.
                    </AlertDescription>
                </Alert>
            )}
        </div>
    </CardContent>
    </>
  );
}

