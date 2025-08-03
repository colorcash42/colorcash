"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageClientAuth } from "@/components/common/PageClientAuth";
import { Header } from "@/components/common/Header";
import { RequestsTable } from "@/components/admin/RequestsTable";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function AdminPage() {
  const { isUserAdmin, viewAsAdmin } = useAppContext();
  const router = useRouter();

  const isAuthorized = isUserAdmin && viewAsAdmin;

  useEffect(() => {
    // If user data has loaded and they are not authorized, redirect.
    if (!isAuthorized) {
      router.replace("/dashboard");
    }
  }, [isAuthorized, router]);

  // If the user is not authorized, we can show a message or just nothing while redirecting.
  if (!isAuthorized) {
    return (
        <PageClientAuth>
             <div className="flex min-h-screen w-full flex-col">
                <Header />
                 <main className="flex-1 p-4 md:p-8">
                    <div className="container mx-auto">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="text-destructive"/>
                                    Access Denied
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p>You do not have permission to view this page. Redirecting...</p>
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </PageClientAuth>
    );
  }

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
