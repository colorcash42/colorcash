
"use client";

import { useEffect } from "react";
import { useAppContext } from "@/context/AppContext";

// This component is essential for applying the theme class on the client-side
// to prevent hydration mismatches between the server-rendered and client-rendered HTML.
export function ClientWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useAppContext();

  useEffect(() => {
    // This effect now ONLY runs on the client after hydration.
    // It ensures the correct theme class is applied without causing a mismatch.
    document.body.classList.remove("light", "dark");
    document.body.classList.add(theme);
  }, [theme]);

  // suppressHydrationWarning is added to the html tag in RootLayout,
  // but we return the children directly here. The effect handles the rest.
  return <>{children}</>;
}
