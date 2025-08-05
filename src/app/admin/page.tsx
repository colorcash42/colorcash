
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
             
                
                     
                        
                            
                                 
                                    Access Denied
                                
                            
                            
                                You do not have permission to view this page. Redirecting...
                            
                        
                    
                
            
        </PageClientAuth>
    );
  }

  return (
    <PageClientAuth>
      
        
             
                
                    Admin Panel
                    Manage live games and user transactions.
                

                
                

                
            
         
      
    </PageClientAuth>
  );
}
