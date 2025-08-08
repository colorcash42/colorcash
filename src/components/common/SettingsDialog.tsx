
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
import { Label } from "@/components/ui/label";
import { useAppContext } from "@/context/AppContext";
import { Moon, Sun, Shield, Volume2, VolumeX, Lock, Loader2, Palette } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "../ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(6, "New password must be at least 6 characters."),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
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
      form.reset();
    }
    setIsPasswordLoading(false);
  };
  
  const handleThemeChange = (newTheme: 'light' | 'dark') => {
      setTheme(newTheme);
      // Removed onOpenChange(false) to allow user to see the change
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your application experience.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow pr-6 -mr-6">
        <div className="py-4 space-y-6">
            <div className="space-y-4">
                <h3 className="text-sm font-medium flex items-center gap-2"><Palette /> Appearance</h3>
                 <RadioGroup
                    value={theme}
                    onValueChange={handleThemeChange}
                    className="grid grid-cols-2 gap-2"
                  >
                    <div>
                      <RadioGroupItem value="light" id="light" className="peer sr-only" />
                      <Label
                        htmlFor="light"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <Sun className="mb-3 h-6 w-6" />
                        Light
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                      <Label
                        htmlFor="dark"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <Moon className="mb-3 h-6 w-6" />
                        Dark
                      </Label>
                    </div>
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
