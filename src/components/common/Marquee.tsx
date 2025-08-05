"use client";

import React from 'react';
import { cn } from '@/lib/utils';

const marqueeMessages = [
  "Welcome to ColorCash! 🚀",
  "Place your bets and win big! 💰",
  "Check out the live game for exciting rounds! लाइव गेम में शामिल हों और बड़ी जीत हासिल करें! 🏆",
  "Refer your friends and earn rewards! अपने दोस्तों को रेफर करें और पुरस्कार अर्जित करें! 🎁",
  "24/7 customer support available. 24/7 ग्राहक सहायता उपलब्ध है। 🕒"
];

// Repeat messages to create a seamless loop effect
const extendedMessages = [...marqueeMessages, ...marqueeMessages, ...marqueeMessages];

export function Marquee() {
  return (
    <div className="relative flex w-full overflow-x-hidden bg-primary/10 py-2 rounded-lg border">
      <div className="whitespace-nowrap animate-marquee">
        {extendedMessages.map((msg, i) => (
          <span key={i} className="mx-4 text-sm font-medium text-primary">
            {msg}
          </span>
        ))}
      </div>
       <div className="absolute top-0 whitespace-nowrap animate-marquee2">
         {extendedMessages.map((msg, i) => (
          <span key={i} className="mx-4 text-sm font-medium text-primary">
            {msg}
          </span>
        ))}
      </div>
    </div>
  );
}