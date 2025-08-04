"use client";

import { PageClientAuth } from "@/components/common/PageClientAuth";
import { Header } from "@/components/common/Header";
import { BettingArea } from "@/components/dashboard/BettingArea";
import { BetHistoryTable } from "@/components/dashboard/BetHistoryTable";
import { useAppContext } from "@/context/AppContext";
import { OddEvenGame } from "@/components/dashboard/OddEvenGame";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dices, Palette } from "lucide-react";

export default function DashboardPage() {
  const { bets, walletBalance } = useAppContext();

  return (
    <PageClientAuth>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-8">
          <div className="container mx-auto">
            <div className="mb-8">
                <h1 className="font-headline text-3xl md:text-4xl font-bold">Place Your Bet</h1>
                <p className="text-muted-foreground">Choose a game and an amount to play.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 md:gap-8">
              {/* ColorCash Game */}
              <Card className="flex flex-col">
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Palette />
                        ColorCash
                    </CardTitle>
                    <CardDescription>Bet on colors, numbers, or sizes.</CardDescription>
                </CardHeader>
                <BettingArea walletBalance={walletBalance} />
              </Card>

              {/* Odd or Even Game */}
              <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Dices />
                        Odd or Even
                    </CardTitle>
                    <CardDescription>Guess if the die roll is odd or even.</CardDescription>
                </CardHeader>
                <OddEvenGame walletBalance={walletBalance} />
              </Card>
            </div>

            <div className="mt-12">
                <h2 className="font-headline text-2xl md:text-3xl font-bold mb-4">Your Bet History</h2>
                <BetHistoryTable initialBets={bets} />
            </div>
          </div>
        </main>
      </div>
    </PageClientAuth>
  );
}
