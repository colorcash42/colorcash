"use client";

// This component is no longer needed as we are removing the dark theme.
// The theme class was the only thing it was doing.
// Keeping the file to avoid breaking imports, but it does nothing.
export function ClientWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
