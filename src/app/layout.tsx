
import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { Toaster } from "@/components/ui/toaster";
import { ClientWrapper } from "@/components/common/ClientWrapper";
import { Footer } from "@/components/common/Footer";

export const metadata: Metadata = {
  title: "ColorCash",
  description: "A color betting simulation game.",
};

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
      <body className="flex flex-col min-h-screen">
        <AppProvider>
          <ClientWrapper>
            <div className="flex-grow">
              {children}
            </div>
            <Footer />
            <Toaster />
          </ClientWrapper>
        </AppProvider>
      </body>
    </html>
  );
}
