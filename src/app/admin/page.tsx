"use client";

import { PageClientAuth } from "@/components/common/PageClientAuth";
import { Header } from "@/components/common/Header";
import { RequestsTable } from "@/components/admin/RequestsTable";

export default function AdminPage() {
  return (
    <PageClientAuth>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-8">
            <div className="container mx-auto">
                <div className="mb-8">
                    <h1 className="font-headline text-3xl md:text-4xl font-bold">Admin Panel</h1>
                    <p className="text-muted-foreground">Review and approve user transactions.</p>
                </div>
                <RequestsTable />
            </div>
        </main>
      </div>
    </PageClientAuth>
  );
}
