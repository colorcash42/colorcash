
"use client";

import { PageClientAuth } from "@/components/common/PageClientAuth";
import { Header } from "@/components/common/Header";
import { BettingArea } from "@/components/dashboard/BettingArea";
import { useAppContext } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Palette } from "lucide-react";

export default function ColorCashPage() {
  const { walletBalance } = useAppContext();

  return (
    <PageClientAuth>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center p-4 md:p-8">
          <Card className="w-full max-w-2xl">
             <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Palette />
                    ColorCash
                </CardTitle>
                <CardDescription>Bet on colors, numbers, or sizes. The result is instant.</CardDescription>
            </CardHeader>
            <BettingArea walletBalance={walletBalance} />
          </Card>
        </main>
      </div>
    </PageClientAuth>
  );
}
