
"use client";

import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import type { Bet } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Dices, Gamepad2, Palette, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";

// Helper function to convert ISO string to Date
const toDate = (timestamp: string | Date): Date => {
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  return timestamp;
};

const getGameDisplay = (bet: Bet) => {
    switch(bet.gameId) {
        case 'colorcash':
            return <><Palette className="h-4 w-4" /> ColorCash</>;
        case 'oddeven':
            return <><Dices className="h-4 w-4" /> Odd/Even</>;
        case 'live-four-color':
            return <><Gamepad2 className="h-4 w-4" /> 4-Color Live</>;
        default:
            return <><Palette className="h-4 w-4" /> ColorCash</>;
    }
}

const getBetDisplayValue = (bet: Bet) => {
    if (bet.gameId === 'live-four-color') {
        const color = bet.betValue.toString().replace('Bet on ', '');
        let colorClass = '';
        if (color === 'Red') colorClass = 'bg-red-500 text-white';
        if (color === 'Yellow') colorClass = 'bg-yellow-400 text-black';
        if (color === 'Black') colorClass = 'bg-black text-white';
        if (color === 'Blue') colorClass = 'bg-blue-500 text-white';
         return 

            
                
            
            {color}
        
    }

    switch (bet.betType) {
        case 'color':
            let colorClass = '';
            if (bet.betValue === 'Red') colorClass = 'bg-red-500 text-white';
            if (bet.betValue === 'Green') colorClass = 'bg-green-500 text-white';
            if (bet.betValue === 'Violet') colorClass = 'bg-violet-500 text-white';
            return 
                {bet.betValue}
            
        case 'number':
             if (bet.betValue === 0) {
                return 0 (Jackpot)
             }
             return {bet.betValue}
        case 'trio':
            const trioMap: { [key: string]: string } = {
                'trio1': 'Trio 1-4-7',
                'trio2': 'Trio 2-5-8',
                'trio3': 'Trio 3-6-9',
            };
            return {trioMap[bet.betValue as string] || bet.betValue}
        case 'size':
             const sizeClass = bet.betValue === 'Small' 
                ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-400' 
                : 'bg-orange-500/20 text-orange-700 dark:text-orange-400';
            return {bet.betValue}
        case 'oddOrEven':
            const oddEvenClass = bet.betValue === 'Odd'
                ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-400'
                : 'bg-purple-500/20 text-purple-700 dark:text-purple-400';
            return {bet.betValue}
        default:
            return {bet.betValue}
    }
}


export function BetHistoryTable({ initialBets }: { initialBets: Bet[] }) {
  const { bets } = useAppContext();
  const [currentPage, setCurrentPage] = useState(1);
  const BETS_PER_PAGE = 5;

  // Use the bets from context if available, otherwise use initialBets from server.
  // This ensures the table updates after a new bet is placed.
  const displayBets = bets.length > 0 ? bets : initialBets;

  const totalPages = Math.ceil(displayBets.length / BETS_PER_PAGE);
  const paginatedBets = displayBets.slice(
    (currentPage - 1) * BETS_PER_PAGE,
    currentPage * BETS_PER_PAGE
  );

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    
      
        
          Recent Bets
        
      
      
        
            
                
                    
                        
                            Game
                            Bet On
                            Type
                            Bet Amount
                            Outcome
                            Payout
                            Time
                        
                    
                    
                        {paginatedBets.length === 0 ? (
                            
                                You haven't placed any bets yet.
                            
                        ) : (
                            paginatedBets.map((bet) => (
                                
                                
                                    
                                        
                                        {getGameDisplay(bet)}
                                    
                                
                                
                                    {getBetDisplayValue(bet)}
                                
                                
                                    {bet.betType}
                                
                                
                                    ₹{bet.amount.toFixed(2)}
                                
                                
                                    {bet.outcome}
                                
                                
                                    {bet.outcome === 'win' ? '+' : bet.outcome === 'loss' ? '-' : ''}₹{bet.outcome === 'win' ? bet.payout.toFixed(2) : bet.amount.toFixed(2)}
                                
                                
                               {bet.timestamp ? formatDistanceToNow(toDate(bet.timestamp), { addSuffix: true }) : 'Just now'}
                                
                            
                        ))
                    )}
                
            
        
      
      {totalPages > 1 && (
         
            
                Page {currentPage} of {totalPages}
            
            
                
                    
                        
                        Previous
                    
                     
                        Next
                        
                    
                
            
        
      )}
    
  );
}
