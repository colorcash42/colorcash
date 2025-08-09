
"use client";

import { PageClientAuth } from "@/components/common/PageClientAuth";
import { Header } from "@/components/common/Header";
import { BetHistoryTable } from "@/components/dashboard/BetHistoryTable";
import { useAppContext } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from "@/components/ui/card";
import { Coins, Palette, ArrowRight, Gamepad2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Marquee } from "@/components/common/Marquee";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";


const GameCard = ({ icon, title, description, href, className }: { icon: React.ReactNode, title: string, description: string, href: string, className?: string }) => (
    <Card className={cn("flex flex-col", className)}>
        <CardHeader>
            <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-full">
                    {icon}
                </div>
                <div>
                    <CardTitle>{title}</CardTitle>
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
      <div className="flex flex-col min-h-screen">
        <Header />
         <main className="flex-1 p-4 md:p-6 space-y-6">
          <Marquee />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">
                Welcome! Choose Your Game
            </h1>
            <p className="text-muted-foreground">Select a game from the options below to start playing.</p>
          </div>
            
            <Alert className="bg-yellow-500/10 border-yellow-500/50 text-yellow-700 dark:text-yellow-400 [&>svg]:text-yellow-700 dark:[&>svg]:text-yellow-400">
              <Clock className="h-4 w-4" />
              <AlertTitle>लाइव गेम का समय</AlertTitle>
              <AlertDescription>
                कृपया ध्यान दें: लाइव गेम राउंड केवल रात 8:00 बजे से 11:00 बजे तक ही उपलब्ध रहेगा।
              </AlertDescription>
            </Alert>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <GameCard 
                icon={<Palette className="h-6 w-6 text-primary" />} 
                title="ColorCash" 
                description="Bet on colors, numbers, and sizes." 
                href="/games/color-cash"
                className="hover:shadow-lg transition-shadow"
              />
               <GameCard 
                icon={<Coins className="h-6 w-6 text-primary" />} 
                title="Heads or Tails" 
                description="Flip a coin. Win if you guess right." 
                href="/games/head-tails"
                className="hover:shadow-lg transition-shadow"
              />
               <GameCard 
                icon={<Gamepad2 className="h-6 w-6 text-primary" />} 
                title="Live 4-Color Game" 
                description="Join the live game with timed rounds!" 
                href="/live"
                className="hover:shadow-lg transition-shadow"
              />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Your Bet History</CardTitle>
                </CardHeader>
                <BetHistoryTable initialBets={bets} />
            </Card>
          </main>
      </div>
    </PageClientAuth>
  );
}

    