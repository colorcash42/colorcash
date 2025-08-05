
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
      
        
         
          
            
                 
                    
                        
                        ColorCash
                    
                    Bet on colors, numbers, or sizes. The result is instant.
                
                
            
          
         
      
    </PageClientAuth>
  );
}
