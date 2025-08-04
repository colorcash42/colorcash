"use client";

import { PageClientAuth } from "@/components/common/PageClientAuth";
import { Header } from "@/components/common/Header";
import { FourColorGame } from "@/components/live/FourColorGame";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Gamepad2 } from "lucide-react";

export default function LiveGamePage() {
  return (
    <PageClientAuth>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center p-4 md:p-8">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Gamepad2 />
                        Live 4-Color Game
                    </CardTitle>
                    <CardDescription>Place your bet before the timer runs out. An admin controls the round.</CardDescription>
                </CardHeader>
                <FourColorGame />
            </Card>
        </main>
      </div>
    </PageClientAuth>
  );
}
