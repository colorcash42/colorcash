
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
import { Coins, Gamepad2, Palette, ChevronLeft, ChevronRight } from "lucide-react";
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
            return <div className="flex items-center gap-2"><Palette className="h-4 w-4" /> ColorCash</div>;
        case 'headtails':
            return <div className="flex items-center gap-2"><Coins className="h-4 w-4" /> Head/Tails</div>;
        case 'live-four-color':
            return <div className="flex items-center gap-2"><Gamepad2 className="h-4 w-4" /> 4-Color Live</div>;
        default:
             // Default to ColorCash for older bets without a gameId
            return <div className="flex items-center gap-2"><Palette className="h-4 w-4" /> ColorCash</div>;
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
         return <Badge className={cn(colorClass)}>
            <span className="w-2 h-2 rounded-full mr-2" style={{backgroundColor: 'currentColor'}}></span>
            {color}
        </Badge>
    }

    switch (bet.betType) {
        case 'color':
            let colorClass = '';
            if (bet.betValue === 'Red') colorClass = 'bg-red-500 text-white';
            if (bet.betValue === 'Green') colorClass = 'bg-green-500 text-white';
            if (bet.betValue === 'Violet') colorClass = 'bg-violet-500 text-white';
            return <Badge className={cn(colorClass)}>{bet.betValue}</Badge>
        case 'number':
             if (bet.betValue === 0) {
                return <Badge variant="outline">0 (Jackpot)</Badge>
             }
             return <Badge variant="outline">{bet.betValue}</Badge>
        case 'trio':
            const trioMap: { [key: string]: string } = {
                'trio1': 'Trio 1-4-7',
                'trio2': 'Trio 2-5-8',
                'trio3': 'Trio 3-6-9',
            };
            return <Badge variant="secondary">{trioMap[bet.betValue as string] || bet.betValue}</Badge>
        case 'size':
             const sizeClass = bet.betValue === 'Small' 
                ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-400' 
                : 'bg-orange-500/20 text-orange-700 dark:text-orange-400';
            return <Badge className={sizeClass}>{bet.betValue}</Badge>
        case 'headOrTails':
            const headTailsClass = bet.betValue === 'Heads'
                ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                : 'bg-gray-500/20 text-gray-700 dark:text-gray-400';
            return <Badge className={headTailsClass}>{bet.betValue}</Badge>
        default:
            return <Badge variant="outline">{bet.betValue}</Badge>
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
    <>
      <CardContent className="p-0">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Game</TableHead>
                    <TableHead>Bet On</TableHead>
                    <TableHead className="hidden sm:table-cell">Type</TableHead>
                    <TableHead>Bet Amount</TableHead>
                    <TableHead>Outcome</TableHead>
                    <TableHead>Profit/Loss</TableHead>
                    <TableHead className="hidden sm:table-cell">Time</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {paginatedBets.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                            You haven't placed any bets yet.
                        </TableCell>
                    </TableRow>
                ) : (
                    paginatedBets.map((bet) => (
                        <TableRow key={bet.id}>
                            <TableCell>
                                {getGameDisplay(bet)}
                            </TableCell>
                            <TableCell>{getBetDisplayValue(bet)}</TableCell>
                            <TableCell className="hidden sm:table-cell">{bet.betType}</TableCell>
                            <TableCell>₹{bet.amount.toFixed(2)}</TableCell>
                            <TableCell>
                                <Badge variant={bet.outcome === 'win' ? 'default' : bet.outcome === 'loss' ? 'destructive' : 'secondary'}>{bet.outcome}</Badge>
                            </TableCell>
                            <TableCell className={cn(bet.outcome === 'win' ? 'text-green-500' : bet.outcome === 'loss' ? 'text-red-500' : '')}>
                                {bet.outcome === 'win' ? '+' : bet.outcome === 'loss' ? '-' : ''}₹{bet.outcome === 'win' ? bet.payout.toFixed(2) : bet.amount.toFixed(2)}
                            </TableCell>
                             <TableCell className="hidden sm:table-cell">
                               {bet.timestamp ? formatDistanceToNow(toDate(bet.timestamp), { addSuffix: true }) : 'Just now'}
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
      </CardContent>
      {totalPages > 1 && (
         <CardFooter className="flex items-center justify-between pt-4">
            <div className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>
                    <ChevronLeft />
                    Previous
                </Button>
                 <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages}>
                    Next
                    <ChevronRight />
                </Button>
            </div>
        </CardFooter>
      )}
    </>
  );
}
