
"use client";

import { useAppContext } from "@/context/AppContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "../ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useMemo, useState } from "react";

// Helper function to convert ISO string to Date
const toDate = (timestamp: string | Date): Date => {
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  return timestamp;
};


export function RequestsTable() {
  const { handleTransaction, pendingTransactions } = useAppContext();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const sortedPendingTransactions = useMemo(() => {
    if (!pendingTransactions) return [];
    return [...pendingTransactions].sort((a, b) => toDate(b.timestamp).getTime() - toDate(a.timestamp).getTime());
  }, [pendingTransactions]);


  const onHandleTransaction = async (id: string, status: 'approved' | 'rejected') => {
    setProcessingId(id);
    await handleTransaction(id, status);
    setProcessingId(null);
  }

  return (
    
      
        
          Pending Requests
          Review deposit and withdrawal requests from users.
        
      
      
        
          
            
              
                
                  Date
                  User ID
                  Type
                  Amount
                  Details
                  Actions
                
              
              
                {sortedPendingTransactions.length === 0 ? (
                  
                    No pending requests.
                  
                ) : (
                  sortedPendingTransactions.map((t) => (
                    
                      
                        {t.timestamp ? format(toDate(t.timestamp), 'PP pp') : 'No date'}
                      
                      
                        {t.userId}
                      
                      
                        {t.type}
                      
                      
                        ₹{t.amount.toFixed(2)}
                      
                      
                        {t.type === 'deposit' ? `UTR: ${t.utr}` : `UPI: ${t.upi}`}
                      
                      
                        {processingId === t.id ? (
                          
                        ) : (
                          <>
                            
                                
                                
                            
                            
                                
                                
                            
                          </>
                        )}
                      
                    
                  ))
                )}
              
            
          
        
      
    
  );
}
