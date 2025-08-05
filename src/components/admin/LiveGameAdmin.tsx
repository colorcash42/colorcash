
"use client";

import { useState } from 'react';
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PlayCircle, StopCircle, Trophy } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';

export function LiveGameAdmin() {
    const { liveGameRound, startFourColorRound, endFourColorRound } = useAppContext();
    const [isLoading, setIsLoading] = useState(false);
    const [isEnding, setIsEnding] = useState(false);
    const [selectedWinner, setSelectedWinner] = useState<'Red' | 'Yellow' | 'Black' | 'Blue' | null>(null);

    const handleStartRound = async () => {
        setIsLoading(true);
        await startFourColorRound();
        setIsLoading(false);
    }
    
    const handleEndRound = async () => {
        if (!selectedWinner) {
            alert("Please select a winning color.");
            return;
        }
        setIsEnding(true);
        await endFourColorRound(selectedWinner);
        setSelectedWinner(null);
        setIsEnding(false);
    }

    const betAmounts = liveGameRound?.betAmounts || { Red: 0, Yellow: 0, Black: 0, Blue: 0 };
    const betCounts = liveGameRound?.betCounts || { Red: 0, Yellow: 0, Black: 0, Blue: 0 };
    const totalBetAmount = Object.values(betAmounts).reduce((a, b) => a + b, 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    Live Game Management
                </CardTitle>
                <CardDescription>Control the 4-Color live game rounds.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {!liveGameRound || liveGameRound.status === 'awarding' ? (
                     <div className="flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg">
                        <Trophy className="w-12 h-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">
                            No Active Round
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            There is no betting round currently active.
                            {liveGameRound?.winningColor && ` The last winning color was ${liveGameRound.winningColor}.`}
                        </p>
                        <Button onClick={handleStartRound} disabled={isLoading} className="mt-4">
                            {isLoading ? <Loader2 className="animate-spin" /> : <PlayCircle />}
                            {isLoading ? 'Starting...' : 'Start New 10-Min Round'}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <Alert>
                             <PlayCircle className="h-4 w-4" />
                                 <AlertTitle>
                                    Round is Active!
                                </AlertTitle>
                                <AlertDescription>
                                Betting is currently open. The round will end automatically in the timer, or you can end it now.
                                </AlertDescription>
                        </Alert>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Live Bet Status
                                </CardTitle>
                                <CardDescription>Total Bet Amount: <strong>₹{totalBetAmount.toFixed(2)}</strong></CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Color</TableHead>
                                            <TableHead>User Bets</TableHead>
                                            <TableHead>Total Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {Object.keys(betAmounts).map((color) => (
                                            <TableRow key={color}>
                                                <TableCell>{color}</TableCell>
                                                <TableCell>{betCounts[color]}</TableCell>
                                                <TableCell>₹{betAmounts[color].toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                        
                        <div className="space-y-4 p-4 border rounded-lg">
                             <h4 className="font-semibold">End Round Manually</h4>
                             <p className="text-sm text-muted-foreground">Select the winning color and end the round to distribute payouts.</p>
                             <RadioGroup value={selectedWinner ?? undefined} onValueChange={(val) => setSelectedWinner(val as any)} className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  <Label className="p-2 border rounded-md has-[:checked]:border-primary has-[:checked]:bg-primary/10 flex items-center gap-2 cursor-pointer">
                                      <RadioGroupItem value="Red" id="r-red" /> Red
                                  </Label>
                                  <Label className="p-2 border rounded-md has-[:checked]:border-primary has-[:checked]:bg-primary/10 flex items-center gap-2 cursor-pointer">
                                      <RadioGroupItem value="Yellow" id="r-yellow" /> Yellow
                                  </Label>
                                  <Label className="p-2 border rounded-md has-[:checked]:border-primary has-[:checked]:bg-primary/10 flex items-center gap-2 cursor-pointer">
                                      <RadioGroupItem value="Black" id="r-black" /> Black
                                  </Label>
                                  <Label className="p-2 border rounded-md has-[:checked]:border-primary has-[:checked]:bg-primary/10 flex items-center gap-2 cursor-pointer">
                                      <RadioGroupItem value="Blue" id="r-blue" /> Blue
                                  </Label>
                             </RadioGroup>
                             <Button onClick={handleEndRound} disabled={!selectedWinner || isEnding} variant="destructive" className="w-full">
                                     {isEnding ? (
                                          <Loader2 className="animate-spin" />
                                     ) : (
                                         <StopCircle />
                                     )}
                                     {isEnding ? (
                                          `Processing Payouts...`
                                          ) : (
                                          `End Round & Award ${selectedWinner || ''} Winners`
                                          )
                                     }
                                  </Button>
                             </div>
                        </div>
                )}
            </CardContent>
        </Card>
    );
}
