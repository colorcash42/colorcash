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
      <div className="flex flex-col min-h-screen">
        <Header />
         <main className="flex-1 flex flex-col items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                 <div className="mx-auto mb-2 bg-primary/10 p-3 rounded-full w-fit">
                    <Palette className="h-8 w-8 text-primary" />
                 </div>
                <CardTitle className="text-3xl font-bold">
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
