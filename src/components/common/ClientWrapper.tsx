"use client";

import { useAppContext } from "@/context/AppContext";
import { cn } from "@/lib/utils";

// This wrapper is a client component and can safely use the context.
export function ClientWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useAppContext();
  return (
    <div className={cn(
      "font-body antialiased",
      theme
    )}>
      {children}
    </div>
  )
}
