"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAppContext } from "@/context/AppContext";
import { Moon, Sun, Shield, Volume2, VolumeX, Lock, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { useToast } from "@/hooks/use-toast";

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const passwordFormSchema = z.object({
  // We can't validate the current password here, so we just check for presence.
  // The re-authentication on the client will handle the actual validation.
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(6, "New password must be at least 6 characters."),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"], // path of error
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;


export function SettingsDialog({ isOpen, onOpenChange }: SettingsDialogProps) {
  const { 
    theme, 
    setTheme, 
    isUserAdmin, 
    viewAsAdmin, 
    setViewAsAdmin, 
    soundEnabled, 
    setSoundEnabled,
    changePassword 
  } = useAppContext();
  
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    }
  });

  const onSubmit = async (data: PasswordFormValues) => {
    setIsPasswordLoading(true);
    const result = await changePassword(data.currentPassword, data.newPassword);
    if(result.success) {
      toast({
        title: "Success",
        description: result.message
      });
      form.reset(); // Clear form on success
    } else {
        // Error toast is handled in AppContext, but you could add more specific ones here if needed
    }
    setIsPasswordLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your application experience.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
            <div className="space-y-2">
                <Label>Theme</Label>
                <RadioGroup value={theme} onValueChange={(value) => setTheme(value as any)} className="grid grid-cols-3 gap-2">
                    <Label className="p-2 border rounded-md has-[:checked]:border-primary flex flex-col items-center justify-center cursor-pointer">
                        <RadioGroupItem value="light" id="light" className="sr-only" />
                        <Sun className="h-6 w-6 mb-1"/>
                        <span className="text-xs">Light</span>
                    </Label>
                    <Label className="p-2 border rounded-md has-[:checked]:border-primary flex flex-col items-center justify-center cursor-pointer">
                        <RadioGroupItem value="dark" id="dark" className="sr-only" />
                        <Moon className="h-6 w-6 mb-1"/>
                        <span className="text-xs">Dark</span>
                    </Label>
                    <Label className="p-2 border rounded-md has-[:checked]:border-primary flex flex-col items-center justify-center cursor-pointer">
                        <RadioGroupItem value="dark-pro" id="dark-pro" className="sr-only" />
                        <Moon className="h-6 w-6 mb-1" />
                        <span className="text-xs">Dark Pro</span>
                    </Label>
                </RadioGroup>
            </div>

            <Separator />

            <div className="space-y-4">
                <h3 className="text-sm font-medium">Audio</h3>
                   <div className="flex items-center justify-between">
                      <Label htmlFor="sound-effects" className="flex flex-col space-y-1">
                         <span className="flex items-center gap-2">
                               {soundEnabled ? <Volume2 className="h-5 w-5"/> : <VolumeX className="h-5 w-5"/>}
                               Sound Effects
                            </span>
                            <span className="font-normal leading-snug text-muted-foreground">
                               Enable or disable in-game sounds.
                            </span>
                        </Label>
                      <Switch id="sound-effects" checked={soundEnabled} onCheckedChange={setSoundEnabled} />
                    </div>
              </div>

            <Separator />
            
                <Form {...form}>
                 <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center gap-2"><Lock /> Security</h3>
                      <FormField
                        control={form.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    <Button type="submit" disabled={isPasswordLoading}>
                        {isPasswordLoading ? <Loader2 className="animate-spin" /> : null}
                        {isPasswordLoading ? "Updating..." : "Update Password"}
                    </Button>
                </form>
            </Form>

            {isUserAdmin && (
              <>
                <Separator />
                <div className="space-y-4">
                      <h3 className="text-sm font-medium flex items-center gap-2"><Shield/> Developer Options</h3>
                       <div className="flex items-center justify-between">
                         <Label htmlFor="admin-view" className="flex flex-col space-y-1">
                           <span className="font-medium">
                               View as Admin
                            </span>
                            <span className="font-normal leading-snug text-muted-foreground">
                                Enable to see the admin panel and features.
                            </span>
                        </Label>
                        <Switch id="admin-view" checked={viewAsAdmin} onCheckedChange={setViewAsAdmin} />
                      </div>
                    </div>
              </>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
