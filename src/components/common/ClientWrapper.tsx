
"use client";

import { useEffect } from "react";
import { useAppContext } from "@/context/AppContext";

// This component is essential for applying the theme class on the client-side
// to prevent hydration mismatches between the server-rendered and client-rendered HTML.
export function ClientWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useAppContext();

  useEffect(() => {
    const body = document.body;
    body.classList.remove("light", "dark");
    body.classList.add(theme);
  }, [theme]);

  return <>{children}</>;
}
