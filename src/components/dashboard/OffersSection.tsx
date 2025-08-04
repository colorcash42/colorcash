"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone } from "lucide-react";

// In the future, these offers could be fetched from a database (e.g., Firestore)
const offers = [
  {
    title: "Weekend Bonanza!",
    description: "Deposit ₹500 or more this weekend and get an extra 10% bonus in your wallet instantly!",
  },
  {
    title: "ColorCash Challenge",
    description: "Win 3 ColorCash games in a row and get a free ₹20 voucher. Good luck!",
  },
];


export function OffersSection() {
    if (offers.length === 0) {
        return null; // Don't render anything if there are no offers
    }

  return (
    <Card className="shadow-lg bg-gradient-to-r from-primary/10 to-accent/10">
        <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
                <Megaphone className="text-primary" />
                Special Offers
            </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
            {offers.map((offer, index) => (
                 <Alert key={index} className="bg-background/80">
                    <AlertTitle className="font-semibold">{offer.title}</AlertTitle>
                    <AlertDescription>
                        {offer.description}
                    </AlertDescription>
                </Alert>
            ))}
        </CardContent>
    </Card>
  );
}
