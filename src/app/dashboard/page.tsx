
"use client";

import { PageClientAuth } from "@/components/common/PageClientAuth";
import { Header } from "@/components/common/Header";
import { BetHistoryTable } from "@/components/dashboard/BetHistoryTable";
import { useAppContext } from "@/context/AppContext";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from "@/components/ui/card";
import { Dices, Palette, ArrowRight, Gamepad2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Marquee } from "@/components/common/Marquee";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";


const GameCard = ({ icon, title, description, href, className }) => (
    
        
            
                
                    {icon}
                
                
                    {title}
                    {description}
                
            
        
        
            {/* Can add more details or image here in future */}
        
        
            
                
                    Play Now 
                
            
        
    
);

export default function DashboardPage() {
  const { bets } = useAppContext();

  return (
    <PageClientAuth>
      
        
         
          
            
                Choose Your Game
                Select a game from the options below to start playing.
            
            
                
            
            
              
                लाइव गेम का समय
                कृपया ध्यान दें: लाइव गेम राउंड केवल रात 8:00 बजे से 11:00 बजे तक ही उपलब्ध रहेगा।
              
            

            
              
                
                    
                    ColorCash
                    Bet on colors, numbers, and sizes.
                    
                
                 
                    
                    Odd or Even
                    Guess if the die roll is odd or even.
                    
                
                 
                    
                    Live 4-Color Game
                    Join the live game with timed rounds!
                    
                
              
            

            
                
                    Your Bet History
                
                
            
          
         
      
    </PageClientAuth>
  );
}
