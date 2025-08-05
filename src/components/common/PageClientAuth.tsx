
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAppContext } from "@/context/AppContext";

export function PageClientAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      
        
            
                
                Loading your session...
            
        
      
    );
  }

  return <>{children}</>;
}
