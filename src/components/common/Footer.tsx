
"use client";

import React from 'react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-6 md:px-8 md:py-0 bg-background/95 border-t">
      <div className="container flex flex-col items-center justify-center gap-4 md:h-24 md:flex-row">
        <p className="text-sm leading-loose text-center text-muted-foreground">
          © {currentYear} ColorCash. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
