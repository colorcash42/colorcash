
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, Clock } from "lucide-react";

interface HelpDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function HelpDialog({ isOpen, onOpenChange }: HelpDialogProps) {
  return (
    
      
        
          
            Help & Support
            Have questions? We're here to help.
          
        
        
            
                
                    
                    
                        Contact us via Email
                        For any issues or inquiries, please email us at:
                    
                    
                        support@example.com
                    
                
            
             
                
                    
                    
                        Support Hours
                        Our support team is available from 9:00 AM to 6:00 PM, Monday to Friday.
                    
                
            
        
      
    
  );
}
