"use server";

import { PageClientAuth } from "@/components/common/PageClientAuth";
import { Header } from "@/components/common/Header";
import { BettingArea } from "@/components/dashboard/BettingArea";
import { BetHistoryTable } from "@/components/dashboard/BetHistoryTable";
import { getBets, getWalletBalance } from "@/app/actions";
import type { Bet } from "@/lib/types";

export default async function DashboardPage() {
  // Fetch data on the server
  const { bets } = await getBets();
  const { balance } = await getWalletBalance();

  return (
    <PageClientAuth>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-8">
          <div className="container mx-auto">
            <div className="mb-8">
                <h1 className="font-headline text-3xl md:text-4xl font-bold">Place Your Bet</h1>
                <p className="text-muted-foreground">Choose a color and an amount to play.</p>
            </div>
            {/* Pass wallet balance to BettingArea */}
            <BettingArea walletBalance={balance} />
            <div className="mt-12">
                <h2 className="font-headline text-2xl md:text-3xl font-bold mb-4">Your Bet History</h2>
                {/* Pass bets to BetHistoryTable */}
                <BetHistoryTable initialBets={bets} />
            </div>
          </div>
        </main>
      </div>
    </PageClientAuth>
  );
}

    