"use client";

import { PageClientAuth } from "@/components/common/PageClientAuth";
import { Header } from "@/components/common/Header";
import { BetHistoryTable } from "@/components/dashboard/BetHistoryTable";
import { useAppContext } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from "@/components/ui/card";
import { Dices, Palette, ArrowRight, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { OffersSection } from "@/components/dashboard/OffersSection";

const GameCard = ({ icon, title, description, href, className }) => (
    <Card className={cn("flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300", className)}>
        <CardHeader>
            <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                    {icon}
                </div>
                <div>
                    <CardTitle className="font-headline text-2xl">{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="flex-grow">
            {/* Can add more details or image here in future */}
        </CardContent>
        <CardFooter>
            <Button asChild className="w-full">
                <Link href={href}>
                    Play Now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </CardFooter>
    </Card>
);

export default function DashboardPage() {
  const { bets } = useAppContext();

  return (
    <PageClientAuth>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-8">
          <div className="container mx-auto">
            <div className="mb-8">
                <h1 className="font-headline text-3xl md:text-4xl font-bold">Choose Your Game</h1>
                <p className="text-muted-foreground">Select a game from the options below to start playing.</p>
            </div>
            
             <div className="mb-8">
              <OffersSection />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              <GameCard 
                icon={<Palette className="h-8 w-8 text-primary" />}
                title="ColorCash"
                description="Bet on colors, numbers, and sizes."
                href="/games/color-cash"
              />
               <GameCard 
                icon={<Dices className="h-8 w-8 text-primary" />}
                title="Odd or Even"
                description="Guess if the die roll is odd or even."
                href="/games/odd-even"
              />
               <GameCard 
                icon={<Gamepad2 className="h-8 w-8 text-primary" />}
                title="Spin & Win"
                description="A live game with timed rounds."
                href="/live"
                className="md:col-span-2 lg:col-span-1"
              />
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
