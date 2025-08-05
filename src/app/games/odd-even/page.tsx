
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
      
        
         
          
            
            
                
                    
                    Odd or Even
                
                Guess if the die roll is odd or even. The result is instant.
            
            
            
        
         
      
    </PageClientAuth>
  );
}
