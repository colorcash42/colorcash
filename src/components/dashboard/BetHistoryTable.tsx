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
         return <div className="inline-flex items-center gap-2 font-medium px-2 py-1 rounded-md" style={{ backgroundColor: colorClass.split(' ')[0] }}>
            <div className={cn("h-3 w-3 rounded-full border border-white/50", colorClass)} />
            {color}
        </div>
    }

    switch (bet.betType) {
        case 'color':
            let colorClass = '';
            if (bet.betValue === 'Red') colorClass = 'bg-red-500 text-white';
            if (bet.betValue === 'Green') colorClass = 'bg-green-500 text-white';
            if (bet.betValue === 'Violet') colorClass = 'bg-violet-500 text-white';
            return <div className={cn("inline-flex items-center gap-2 font-medium px-2 py-1 rounded-md text-white", colorClass)}>
                {bet.betValue}
            </div>
        case 'number':
             if (bet.betValue === 0) {
                return <span className="font-mono font-medium bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded">0 (Jackpot)</span>
             }
             return <span className="font-mono font-medium bg-secondary text-secondary-foreground px-2 py-1 rounded">{bet.betValue}</span>
        case 'trio':
            const trioMap: { [key: string]: string } = {
                'trio1': 'Trio 1-4-7',
                'trio2': 'Trio 2-5-8',
                'trio3': 'Trio 3-6-9',
            };
            return <span className="font-medium bg-blue-500/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded">{trioMap[bet.betValue as string] || bet.betValue}</span>
        case 'size':
             const sizeClass = bet.betValue === 'Small' 
                ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-400' 
                : 'bg-orange-500/20 text-orange-700 dark:text-orange-400';
            return <span className={cn("font-medium px-2 py-1 rounded", sizeClass)}>{bet.betValue}</span>
        case 'oddOrEven':
            const oddEvenClass = bet.betValue === 'Odd'
                ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-400'
                : 'bg-purple-500/20 text-purple-700 dark:text-purple-400';
            return <span className={cn("font-medium px-2 py-1 rounded", oddEvenClass)}>{bet.betValue}</span>
        default:
            return <span className="font-medium">{bet.betValue}</span>
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
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">Recent Bets</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-auto">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Game</TableHead>
                <TableHead>Bet On</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Bet Amount</TableHead>
                <TableHead className="text-center">Outcome</TableHead>
                <TableHead className="text-right">Payout</TableHead>
                <TableHead className="text-right">Time</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {paginatedBets.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center h-24">
                            You haven't placed any bets yet.
                        </TableCell>
                    </TableRow>
                ) : (
                    paginatedBets.map((bet) => (
                        <TableRow key={bet.id}>
                        <TableCell>
                             <div className="flex items-center gap-2 text-muted-foreground font-medium">
                                {getGameDisplay(bet)}
                            </div>
                        </TableCell>
                        <TableCell>
                            {getBetDisplayValue(bet)}
                        </TableCell>
                        <TableCell className="capitalize text-muted-foreground">{bet.betType}</TableCell>
                        <TableCell className="text-right tabular-nums">₹{bet.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                            <Badge variant={bet.outcome === 'win' ? "default" : bet.outcome === 'loss' ? "destructive" : 'secondary'}>
                                {bet.outcome}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-semibold"
                        >
                            <span className={bet.outcome === 'win' ? 'text-primary' : bet.outcome === 'loss' ? 'text-destructive' : 'text-muted-foreground'}>
                                {bet.outcome === 'win' ? '+' : bet.outcome === 'loss' ? '-' : ''}₹{bet.outcome === 'win' ? bet.payout.toFixed(2) : bet.amount.toFixed(2)}
                            </span>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-xs">
                           {bet.timestamp ? formatDistanceToNow(toDate(bet.timestamp), { addSuffix: true }) : 'Just now'}
                        </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
            </Table>
        </div>
      </CardContent>
      {totalPages > 1 && (
         <CardFooter className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePreviousPage} disabled={currentPage === 1}>
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                </Button>
                 <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages}>
                    Next
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </CardFooter>
      )}
    </Card>
  );
}
