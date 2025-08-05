"use client";

import { PageClientAuth } from "@/components/common/PageClientAuth";
import { Header } from "@/components/common/Header";
import { WalletTabs } from "@/components/wallet/WalletTabs";

export default function WalletPage() {
  return (
    <PageClientAuth>
      <div className="flex flex-col min-h-screen">
        <Header />
         <main className="flex-1 p-4 md:p-6">
            <div className="space-y-1 mb-6">
                <h1 className="text-2xl font-bold">Manage Your Wallet</h1>
                <p className="text-muted-foreground">Deposit funds to play or withdraw your winnings.</p>
            </div>
            <WalletTabs />
         </main>
      </div>
    </PageClientAuth>
  );
}
