
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
        
            
                
                    Live Game Management
                
                Control the 4-Color live game rounds.
            
            
                {!liveGameRound || liveGameRound.status === 'awarding' ? (
                     
                        
                            No Active Round
                            There is no betting round currently active.
                            {liveGameRound?.winningColor && ` The last winning color was ${liveGameRound.winningColor}.`}
                        
                         
                            
                                {isLoading ?  : }
                                {isLoading ? 'Starting...' : 'Start New 10-Min Round'}
                            
                        
                    
                ) : (
                    
                        
                            
                                 
                                    Round is Active!
                                
                                Betting is currently open. The round will end automatically in the timer, or you can end it now.
                            
                        

                        
                            
                                
                                    Live Bet Status
                                
                                Total Bet Amount: 
                            
                            
                                
                                    
                                        
                                            Color
                                        
                                        
                                            User Bets
                                        
                                        
                                            Total Amount
                                        
                                    
                                    
                                        {Object.keys(betAmounts).map((color) => (
                                            
                                                
                                                    {color}
                                                
                                                
                                                    {betCounts[color]}
                                                
                                                
                                                    ₹{betAmounts[color].toFixed(2)}
                                                
                                            
                                        ))}
                                    
                                
                            
                        
                        
                         
                             
                             
                                  
                                      
                                          
                                              
                                      
                                  
                                  
                                      
                                          
                                              
                                      
                                  
                                  
                                      
                                          
                                              
                                      
                                  
                                  
                                      
                                          
                                              
                                      
                                  
                             
                             
                                 
                                     
                                         
                                            
                                         
                                     
                                      
                                          
                                              Processing Payouts...
                                          
                                          
                                              End Round & Award {selectedWinner || ''} Winners
                                          
                                     
                                  
                             
                        
                    
                )}
            
        
    );
}
