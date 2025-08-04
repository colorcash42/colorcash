"use client";

import React from 'react';

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
    <div className="relative flex w-full overflow-x-hidden bg-secondary text-secondary-foreground py-2 rounded-lg border">
      <div className="flex animate-marquee whitespace-nowrap">
        {extendedMessages.map((msg, i) => (
          <span key={`p1-${i}`} className="mx-8 text-sm font-medium">
            {msg}
          </span>
        ))}
      </div>
       <div className="absolute top-0 flex pt-2 animate-marquee2 whitespace-nowrap">
         {extendedMessages.map((msg, i) => (
          <span key={`p2-${i}`} className="mx-8 text-sm font-medium">
            {msg}
          </span>
        ))}
      </div>
    </div>
  );
}
