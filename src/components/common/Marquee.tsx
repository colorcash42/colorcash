
import React from 'react';
import { cn } from '@/lib/utils';

const marqueeMessages = [
  "Welcome to ColorCash! 🚀",
  "Place your bets and win big! 💰",
  "Check out the live game for exciting rounds! लाइव गेम में शामिल हों और बड़ी जीत हासिल करें! 🏆",
  "Refer your friends and earn rewards! अपने दोस्तों को रेफर करें और पुरस्कार अर्जित करें! 🎁",
  "24/7 customer support available. 24/7 ग्राहक सहायता उपलब्ध है। 🕒"
];

export function Marquee() {
  return (
    <div className="relative flex w-full overflow-hidden bg-secondary text-secondary-foreground py-2 rounded-lg border">
      <div className="animate-marquee whitespace-nowrap">
        {marqueeMessages.map((msg, i) => (
          <span key={i} className="mx-8 text-sm font-medium">
            {msg}
          </span>
        ))}
      </div>
      <div className="absolute top-0 animate-marquee2 whitespace-nowrap">
         {marqueeMessages.map((msg, i) => (
          <span key={i} className="mx-8 text-sm font-medium">
            {msg}
          </span>
        ))}
      </div>
    </div>
  );
}
