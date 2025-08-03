"use client";
import React, { useState } from 'react';
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Gem, Loader2 } from 'lucide-react';

const betColors = [
  { name: 'Red', value: '#ef4444', textColor: 'text-red-500' },
  { name: 'Yellow', value: '#eab308', textColor: 'text-yellow-500' },
  { name: 'Green', value: '#22c55e', textColor: 'text-green-500' },
  { name: 'Blue', value: '#3b82f6', textColor: 'text-blue-500' },
];

function BettingCard({ color, walletBalance }: { color: typeof betColors[0], walletBalance: number }) {
  const { placeBet } = useAppContext();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleBet = async (e: React.FormEvent) => {
    e.preventDefault();
    const betAmount = parseFloat(amount);
    if (isNaN(betAmount) || betAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid positive amount to bet.",
      });
      return;
    }
    
    setIsLoading(true);
    await placeBet(betAmount, color.name, color.value);
    setAmount('');
    setIsLoading(false);
  };

  return (
    <Card className="shadow-lg transition-transform hover:scale-105 border-primary/20 hover:border-primary">
      <form onSubmit={handleBet}>
        <CardHeader>
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 rounded-full" style={{backgroundColor: color.value}} />
             <h3 className={`font-headline text-2xl font-bold ${color.textColor}`}>{color.name}</h3>
          </div>
        </CardHeader>
        <CardContent>
          <Label htmlFor={`amount-${color.name}`} className="sr-only">Amount</Label>
          <Input 
            id={`amount-${color.name}`} 
            type="number" 
            placeholder="Bet Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            max={walletBalance}
            step="any"
            required
            disabled={isLoading}
          />
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
              <Gem className="mr-2 h-4 w-4" />
            }
            {isLoading ? 'Placing...' : `Bet on ${color.name}`}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export function BettingArea({ walletBalance }: { walletBalance: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {betColors.map((color) => (
        <BettingCard key={color.name} color={color} walletBalance={walletBalance}/>
      ))}
    </div>
  );
}

    