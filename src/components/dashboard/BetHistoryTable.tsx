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

export function BetHistoryTable() {
  const { bets } = useAppContext();

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
                <TableHead>Color</TableHead>
                <TableHead className="text-right">Bet Amount</TableHead>
                <TableHead className="text-center">Outcome</TableHead>
                <TableHead className="text-right">Payout</TableHead>
                <TableHead className="text-right">Time</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {bets.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">
                            You haven't placed any bets yet.
                        </TableCell>
                    </TableRow>
                ) : (
                    bets.map((bet) => (
                        <TableRow key={bet.id}>
                        <TableCell>
                            <div className="flex items-center gap-2 font-medium">
                                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: bet.colorHex }} />
                                {bet.color}
                            </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">₹{bet.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                            <Badge variant={bet.outcome === 'win' ? "default" : "destructive"} className={bet.outcome === 'win' ? 'bg-green-500' : ''}>
                                {bet.outcome}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-semibold"
                        >
                            <span className={bet.outcome === 'win' ? 'text-green-600' : 'text-red-600'}>
                                {bet.outcome === 'win' ? '+' : '-'}₹{bet.outcome === 'win' ? bet.payout.toFixed(2) : bet.amount.toFixed(2)}
                            </span>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-xs">
                            {formatDistanceToNow(bet.timestamp, { addSuffix: true })}
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
