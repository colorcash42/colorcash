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
                <CardTitle className="font-headline">Live Game Management</CardTitle>
                <CardDescription>Control the 4-Color live game rounds.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {!liveGameRound || liveGameRound.status === 'awarding' ? (
                     <div>
                        <Alert>
                            <AlertTitle>No Active Round</AlertTitle>
                            <AlertDescription>
                                There is no betting round currently active.
                                {liveGameRound?.winningColor && ` The last winning color was ${liveGameRound.winningColor}.`}
                            </AlertDescription>
                        </Alert>
                        <Button onClick={handleStartRound} disabled={isLoading} className="mt-4">
                            {isLoading ? <Loader2 className="animate-spin" /> : <PlayCircle />}
                            {isLoading ? 'Starting...' : 'Start New 10-Min Round'}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <Alert variant="default" className="bg-green-500/10 border-green-500/20 text-green-700">
                             <AlertTitle className="font-bold">Round is Active!</AlertTitle>
                            <AlertDescription>
                                Betting is currently open. The round will end automatically in the timer, or you can end it now.
                            </AlertDescription>
                        </Alert>

                        <Card>
                            <CardHeader>
                                <CardTitle>Live Bet Status</CardTitle>
                                <CardDescription>Total Bet Amount: <span className="font-bold">₹{totalBetAmount.toFixed(2)}</span></CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Color</TableHead>
                                            <TableHead>User Bets</TableHead>
                                            <TableHead className="text-right">Total Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {Object.keys(betAmounts).map((color) => (
                                            <TableRow key={color}>
                                                <TableCell className="font-medium">{color}</TableCell>
                                                <TableCell>{betCounts[color]}</TableCell>
                                                <TableCell className="text-right">₹{betAmounts[color].toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                        
                        <div>
                             <h3 className="mb-2 font-semibold">Select Winner and End Round</h3>
                             <RadioGroup onValueChange={(val) => setSelectedWinner(val as any)} value={selectedWinner || ''} className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
                                 <div>
                                     <RadioGroupItem value="Red" id="r-red" className="sr-only" />
                                     <Label htmlFor="r-red" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-red-500 peer-data-[state=checked]:bg-red-500/20 [&:has([data-state=checked])]:border-red-500">Red</Label>
                                 </div>
                                  <div>
                                     <RadioGroupItem value="Yellow" id="r-yellow" className="sr-only" />
                                     <Label htmlFor="r-yellow" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-yellow-500 peer-data-[state=checked]:bg-yellow-500/20 [&:has([data-state=checked])]:border-yellow-500">Yellow</Label>
                                 </div>
                                 <div>
                                     <RadioGroupItem value="Black" id="r-black" className="sr-only" />
                                     <Label htmlFor="r-black" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-zinc-700 peer-data-[state=checked]:bg-zinc-500/20 [&:has([data-state=checked])]:border-zinc-700">Black</Label>
                                 </div>
                                 <div>
                                     <RadioGroupItem value="Blue" id="r-blue" className="sr-only" />
                                     <Label htmlFor="r-blue" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-500/20 [&:has([data-state=checked])]:border-blue-500">Blue</Label>
                                 </div>
                             </RadioGroup>
                             <Button onClick={handleEndRound} disabled={isEnding || !selectedWinner} className="w-full" variant="destructive">
                                 {isEnding ? <Loader2 className="animate-spin" /> : <Trophy />}
                                 {isEnding ? 'Processing Payouts...' : `End Round & Award ${selectedWinner || ''} Winners`}
                             </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
