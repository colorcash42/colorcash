"use client";

import { PageClientAuth } from "@/components/common/PageClientAuth";
import { Header } from "@/components/common/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Gamepad2 } from "lucide-react";

export default function LiveGamePage() {

  return (
    <PageClientAuth>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-8">
          <div className="container mx-auto">
             <div className="mb-8">
                <h1 className="font-headline text-3xl md:text-4xl font-bold">Live Game: Spin & Win</h1>
                <p className="text-muted-foreground">A shared game experience for all players.</p>
            </div>
            
            <Card className="flex flex-col items-center justify-center text-center p-12 min-h-[400px]">
                <CardHeader>
                    <CardTitle className="flex items-center justify-center gap-4 text-3xl">
                        <Gamepad2 className="h-10 w-10" />
                        Coming Soon!
                    </CardTitle>
                    <CardDescription className="mt-4 text-lg">
                        Our exciting new live game "Spin & Win" is under construction.
                        <br />
                        Get ready to play together and win big!
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">The game wheel and betting area will appear here.</p>
                </CardContent>
            </Card>

          </div>
        </main>
      </div>
    </PageClientAuth>
  );
}
