"use client";

import { useAppContext } from "@/context/AppContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import type { Bet } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Dices, Gamepad2, Palette } from "lucide-react";

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
        if (color === 'Red') colorClass = 'bg-red-500';
        if (color === 'Yellow') colorClass = 'bg-yellow-400';
        if (color === 'Black') colorClass = 'bg-black';
        if (color === 'Blue') colorClass = 'bg-blue-500';
         return <div className="flex items-center gap-2 font-medium">
            <div className={cn("h-4 w-4 rounded-full", colorClass)} />
            {color}
        </div>
    }

    switch (bet.betType) {
        case 'color':
            let colorClass = '';
            if (bet.betValue === 'Red') colorClass = 'bg-red-500';
            if (bet.betValue === 'Green') colorClass = 'bg-green-500';
            if (bet.betValue === 'Violet') colorClass = 'bg-violet-500';
            return <div className="flex items-center gap-2 font-medium">
                <div className={cn("h-4 w-4 rounded-full", colorClass)} />
                {bet.betValue}
            </div>
        case 'number':
             if (bet.betValue === 0) {
                return <span className="font-mono font-medium bg-yellow-500/20 px-2 py-1 rounded">0 (Jackpot)</span>
             }
             return <span className="font-mono font-medium">{bet.betValue}</span>
        case 'trio':
            const trioMap: { [key: string]: string } = {
                'trio1': 'Trio 1-4-7',
                'trio2': 'Trio 2-5-8',
                'trio3': 'Trio 3-6-9',
            };
            return <span className="font-medium">{trioMap[bet.betValue as string] || bet.betValue}</span>
        case 'size':
            return <span className="font-medium">{bet.betValue}</span>
        case 'oddOrEven':
            return <span className="font-medium">{bet.betValue}</span>
        default:
            return <span className="font-medium">{bet.betValue}</span>
    }
}


export function BetHistoryTable({ initialBets }: { initialBets: Bet[] }) {
  const { bets } = useAppContext();

  // Use the bets from context if available, otherwise use initialBets from server.
  // This ensures the table updates after a new bet is placed.
  const displayBets = bets.length > 0 ? bets : initialBets;

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
                {displayBets.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center h-24">
                            You haven't placed any bets yet.
                        </TableCell>
                    </TableRow>
                ) : (
                    displayBets.map((bet) => (
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
    </Card>
  );
}
