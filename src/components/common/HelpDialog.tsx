
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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Help & Support</DialogTitle>
          <DialogDescription>
            Have questions? We're here to help.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-lg">
                    <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h3 className="font-semibold">Contact us via Email</h3>
                    <p className="text-sm text-muted-foreground">
                        For any issues or inquiries, please email us at:
                    </p>
                    <a href="mailto:support@example.com" className="text-sm text-primary hover:underline">
                        support@example.com
                    </a>
                </div>
            </div>
             <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-lg">
                    <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h3 className="font-semibold">Support Hours</h3>
                    <p className="text-sm text-muted-foreground">
                        Our support team is available from 9:00 AM to 6:00 PM, Monday to Friday.
                    </p>
                </div>
            </div>
        </div>
      </DialogContent>
