
import type { Metadata } from "next";
import "./globals.css";
import { AppProvider, useAppContext } from "@/context/AppContext";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "ColorCash",
  description: "A color betting simulation game.",
};

function AppBody({ children }: { children: React.ReactNode }) {
  const { theme } = useAppContext();
  return (
    <body className={cn(
      "font-body antialiased",
      theme
    )}>
      {children}
      <Toaster />
    </body>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <AppProvider>
        {/* We must wrap the component that uses the context hook in a client boundary */}
        <ClientWrapper>{children}</ClientWrapper>
      </AppProvider>
    </html>
  );
}

// This wrapper is a client component and can safely use the context.
function ClientWrapper({ children }: { children: React.ReactNode }) {
  "use client";
  const { theme } = useAppContext();
  return (
    <body className={cn(
      "font-body antialiased",
      theme
    )}>
      {children}
      <Toaster />
    </body>
  )
}
