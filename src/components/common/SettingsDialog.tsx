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
import { useForm, SubmitHandler } from "react-hook-form";
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

  const onSubmit: SubmitHandler<PasswordFormValues> = async (data) => {
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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your application experience.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
            <div>
                <h3 className="mb-4 text-sm font-medium">Theme</h3>
                <RadioGroup value={theme} onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'dark-pro')}>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="light" id="theme-light" />
                        <Label htmlFor="theme-light" className="flex items-center gap-2">
                            <Sun className="h-4 w-4" />
                            Light
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dark" id="theme-dark" />
                        <Label htmlFor="theme-dark" className="flex items-center gap-2">
                            <Moon className="h-4 w-4" />
                            Dark (Original)
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dark-pro" id="theme-dark-pro" />
                        <Label htmlFor="theme-dark-pro" className="flex items-center gap-2">
                            <Moon className="h-4 w-4" />
                            Dark Pro
                        </Label>
                    </div>
                </RadioGroup>
            </div>

            <Separator />

            <div>
                <h3 className="mb-4 text-sm font-medium">Audio</h3>
                 <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <Label htmlFor="sound-mode" className="flex items-center gap-2">
                      {soundEnabled ? <Volume2 className="h-4 w-4 text-primary" /> : <VolumeX className="h-4 w-4" />}
                      Sound Effects
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Enable or disable in-game sounds.
                    </p>
                  </div>
                  <Switch
                    id="sound-mode"
                    checked={soundEnabled}
                    onCheckedChange={setSoundEnabled}
                  />
                </div>
              </div>

            <Separator />
             
            <div>
                 <h3 className="mb-4 text-sm font-medium">Security</h3>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 rounded-lg border p-4 shadow-sm">
                        <FormField
                            control={form.control}
                            name="currentPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Current Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="••••••••" {...field} />
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
                                        <Input type="password" placeholder="••••••••" {...field} />
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
                                        <Input type="password" placeholder="••••••••" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isPasswordLoading}>
                            {isPasswordLoading ? <Loader2 className="animate-spin" /> : <Lock />}
                            {isPasswordLoading ? "Updating..." : "Update Password"}
                        </Button>
                    </form>
                </Form>
            </div>


            {isUserAdmin && (
              <>
                <Separator />
                <div>
                  <h3 className="mb-4 text-sm font-medium">Developer Options</h3>
                   <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <Label htmlFor="admin-mode" className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        View as Admin
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Enable to see the admin panel and features.
                      </p>
                    </div>
                    <Switch
                      id="admin-mode"
                      checked={viewAsAdmin}
                      onCheckedChange={setViewAsAdmin}
                    />
                  </div>
                </div>
              </>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
