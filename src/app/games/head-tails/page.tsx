
"use client";

import { PageClientAuth } from "@/components/common/PageClientAuth";
import { Header } from "@/components/common/Header";
import { HeadTailsGame } from "@/components/dashboard/HeadTailsGame";
import { useAppContext } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Coins } from "lucide-react";

export default function HeadTailsPage() {
  const { walletBalance } = useAppContext();

  return (
    <PageClientAuth>
      <div className="flex flex-col min-h-screen">
        <Header />
         <main className="flex-1 flex flex-col items-center justify-center p-4">
            <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <div className="mx-auto mb-2 bg-primary/10 p-3 rounded-full w-fit">
                    <Coins className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold">Heads or Tails</CardTitle>
                <CardDescription>Flip a coin. Guess the outcome. It's that simple.</CardDescription>
            </CardHeader>
            <HeadTailsGame walletBalance={walletBalance} />
            </Card>
         </main>
      </div>
    </PageClientAuth>
  );
}

    