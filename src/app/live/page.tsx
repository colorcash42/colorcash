"use client";

import { useState, useEffect } from "react";
import { PageClientAuth } from "@/components/common/PageClientAuth";
import { Header } from "@/components/common/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Gamepad2, Zap } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import type { LiveGameRound } from "@/lib/types";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { placeLiveBetAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

const BETTING_DURATION_SECONDS = 105;

function CountdownCircle({ duration, targetTime }) {
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        if (!targetTime) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const target = new Date(targetTime).getTime();
            const totalDuration = duration * 1000;
            const remaining = Math.max(0, target - now);
            const newProgress = (remaining / totalDuration) * 100;
            setProgress(newProgress);
        }, 100);

        return () => clearInterval(interval);
    }, [targetTime, duration]);

    return (
        <div className="relative h-48 w-48">
            <svg className="h-full w-full" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                    className="stroke-current text-muted"
                    strokeWidth="10"
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                ></circle>
                {/* Progress circle */}
                <circle
                    className="stroke-current text-primary transition-all duration-100 ease-linear"
                    strokeWidth="10"
                    strokeDasharray="283"
                    strokeDashoffset={283 - (progress / 100) * 283}
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    transform="rotate(-90 50 50)"
                ></circle>
            </svg>
        </div>
    );
}

export default function LiveGamePage() {
    const { user, walletBalance, fetchData } = useAppContext();
    const { toast } = useToast();
    const [currentRound, setCurrentRound] = useState<LiveGameRound | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isBetting, setIsBetting] = useState(false);
    const [betAmount, setBetAmount] = useState('10');
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        // We use a known document ID for the single, ongoing live game status.
        const liveStatusDocRef = doc(db, "liveGameStatus", "current");

        const unsubscribe = onSnapshot(liveStatusDocRef, (doc) => {
            if (doc.exists()) {
                const roundData = doc.data();
                // Firestore Timestamps need to be converted to JS Dates for serialization
                const round: LiveGameRound = {
                    id: roundData.id,
                    status: roundData.status,
                    startTime: roundData.startTime.toDate().toISOString(),
                    spinTime: roundData.spinTime.toDate().toISOString(),
                    endTime: roundData.endTime.toDate().toISOString(),
                    winningMultiplier: roundData.winningMultiplier,
                    resultTimestamp: roundData.resultTimestamp ? roundData.resultTimestamp.toDate().toISOString() : null,
                };
                setCurrentRound(round);
                setIsLoading(false);
            } else {
                console.log("No live game status document!");
                setIsLoading(false);
                setCurrentRound(null);
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!currentRound || currentRound.status !== 'betting') {
            setTimeLeft(0);
            return;
        }

        const interval = setInterval(() => {
            const now = Date.now();
            const endTime = new Date(currentRound.spinTime).getTime();
            const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
            setTimeLeft(remaining);
        }, 1000);

        return () => clearInterval(interval);
    }, [currentRound]);

    useEffect(() => {
        // Refetch user data when round is finished to update balance
        if (currentRound?.status === 'finished') {
            fetchData();
        }
    }, [currentRound?.status, fetchData]);


    const handlePlaceBet = async () => {
        if (!user || !currentRound) return;
        
        const amount = parseFloat(betAmount);
        if (isNaN(amount) || amount <= 0) {
            toast({ variant: 'destructive', title: 'Invalid amount' });
            return;
        }
        if (amount > walletBalance) {
             toast({ variant: 'destructive', title: 'Insufficient balance' });
            return;
        }

        setIsBetting(true);
        const result = await placeLiveBetAction(user.uid, amount, currentRound.id);
        if(result.success) {
            toast({ title: 'Bet Placed!', description: `You bet ₹${amount.toFixed(2)}` });
        } else {
            toast({ variant: 'destructive', title: 'Bet Failed', description: result.message });
        }
        setIsBetting(false);
    };

    const getStatusText = () => {
        if (!currentRound) return "Connecting to Live Game...";
        switch(currentRound.status) {
            case 'betting':
                return `Betting Ends in ${timeLeft}s`;
            case 'spinning':
                return 'Spinning... Good luck!';
            case 'finished':
                return `Round Finished! Multiplier: ${currentRound.winningMultiplier === 0 ? 'BUST' : `${currentRound.winningMultiplier}x`}`;
            default:
                return "Waiting for next round...";
        }
    }

    if (isLoading) {
        return (
            <PageClientAuth>
                 <div className="flex min-h-screen w-full flex-col">
                    <Header />
                     <main className="flex flex-1 items-center justify-center p-4 md:p-8">
                        <Loader2 className="h-16 w-16 animate-spin text-primary" />
                    </main>
                </div>
            </PageClientAuth>
        );
    }
    
  return (
    <PageClientAuth>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-8">
          <div className="container mx-auto">
             <div className="mb-8 text-center">
                <h1 className="font-headline text-3xl md:text-4xl font-bold">Live Game: Spin & Win</h1>
                <p className="text-muted-foreground">A shared game experience for all players.</p>
            </div>
            
            <Card className="max-w-2xl mx-auto flex flex-col items-center justify-center text-center p-6 md:p-12 min-h-[450px]">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold tracking-tighter">
                        {getStatusText()}
                    </CardTitle>
                    <CardDescription className="mt-2 text-base">
                        {currentRound?.status === 'betting' && "Place your bet before the time runs out!"}
                        {currentRound?.status === 'spinning' && "The wheel is in motion. No more bets!"}
                        {currentRound?.status === 'finished' && "Waiting for the next round to begin..."}
                         {!currentRound && "Connecting..."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="w-full">
                    <div className="flex justify-center items-center my-6">
                       {currentRound && currentRound.status === 'betting' ? (
                          <div className="relative flex items-center justify-center">
                            <CountdownCircle duration={BETTING_DURATION_SECONDS} targetTime={currentRound.spinTime} />
                            <span className="absolute text-5xl font-bold font-headline">{timeLeft}</span>
                          </div>
                       ) : (
                           <div className="relative flex items-center justify-center h-48 w-48">
                                <Zap className="h-24 w-24 text-yellow-400 animate-pulse" />
                           </div>
                       )}
                    </div>
                   
                    {currentRound?.status === 'betting' ? (
                        <div className="w-full max-w-sm mx-auto space-y-4">
                             <div className="grid gap-2">
                                <Label htmlFor="bet-amount-live">Bet Amount</Label>
                                <Input 
                                    id="bet-amount-live"
                                    type="number"
                                    placeholder="Enter amount"
                                    value={betAmount}
                                    onChange={e => setBetAmount(e.target.value)}
                                    disabled={isBetting}
                                />
                             </div>
                             <Button onClick={handlePlaceBet} disabled={isBetting} className="w-full" size="lg">
                                {isBetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Gamepad2 className="mr-2 h-4 w-4"/>}
                                {isBetting ? "Placing Bet..." : "Place Bet"}
                             </Button>
                        </div>
                    ) : (
                         <div className="w-full max-w-sm mx-auto text-center">
                            <p className="font-semibold text-lg">Next round is starting soon...</p>
                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mt-4"/>
                        </div>
                    )}
                </CardContent>
            </Card>

          </div>
        </main>
      </div>
    </PageClientAuth>
  );
}