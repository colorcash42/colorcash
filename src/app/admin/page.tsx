"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageClientAuth } from "@/components/common/PageClientAuth";
import { Header } from "@/components/common/Header";
import { RequestsTable } from "@/components/admin/RequestsTable";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { LiveGameAdmin } from "@/components/admin/LiveGameAdmin";
import { Separator } from "@/components/ui/separator";

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
             <div className="flex flex-col min-h-screen">
                <main className="flex-1 flex items-center justify-center">
                    <Card className="w-full max-w-md m-4">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="text-destructive" />
                                 Access Denied
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>You do not have permission to view this page. Redirecting...</p>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </PageClientAuth>
    );
  }

  return (
    <PageClientAuth>
      <div className="flex flex-col min-h-screen">
        <Header />
         <main className="flex-1 p-4 md:p-6 space-y-6">
             <div className="space-y-1">
                <h1 className="text-2xl font-bold">Admin Panel</h1>
                <p className="text-muted-foreground">Manage live games and user transactions.</p>
            </div>

            <LiveGameAdmin />
            <Separator />
            <RequestsTable />

        </main>
      </div>
    </PageClientAuth>
  );
}
