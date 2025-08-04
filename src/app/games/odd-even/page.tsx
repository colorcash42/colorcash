
"use client";

import { PageClientAuth } from "@/components/common/PageClientAuth";
import { Header } from "@/components/common/Header";
import { OddEvenGame } from "@/components/dashboard/OddEvenGame";
import { useAppContext } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dices } from "lucide-react";

export default function OddEvenPage() {
  const { walletBalance } = useAppContext();

  return (
    <PageClientAuth>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center p-4 md:p-8">
            <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Dices />
                    Odd or Even
                </CardTitle>
                <CardDescription>Guess if the die roll is odd or even. The result is instant.</CardDescription>
            </CardHeader>
            <OddEvenGame walletBalance={walletBalance} />
            </Card>
        </main>
      </div>
    </PageClientAuth>
  );
}
