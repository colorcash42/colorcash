"use client";

import { PageClientAuth } from "@/components/common/PageClientAuth";
import { Header } from "@/components/common/Header";
import { FourColorGame } from "@/components/live/FourColorGame";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Gamepad2 } from "lucide-react";

export default function LiveGamePage() {
  return (
    <PageClientAuth>
      <div className="flex flex-col min-h-screen">
        <Header />
         <main className="flex-1 flex flex-col items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <div className="mx-auto mb-2 bg-primary/10 p-3 rounded-full w-fit">
                    <Gamepad2 className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold">Live 4-Color Game</CardTitle>
                <CardDescription>Place your bet before the timer runs out. An admin controls the round.</CardDescription>
            </CardHeader>
            <FourColorGame />
          </Card>
         </main>
      </div>
    </PageClientAuth>
  );
}
