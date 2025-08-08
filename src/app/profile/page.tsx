
"use client";

import { PageClientAuth } from "@/components/common/PageClientAuth";
import { Header } from "@/components/common/Header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Lock, Loader2, CircleDollarSign, Gift, Trophy } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/context/AppContext";
import { Separator } from "@/components/ui/separator";

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(6, "New password must be at least 6 characters."),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;


function ChangePasswordForm() {
    const { changePassword } = useAppContext();
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

    return (
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    {isPasswordLoading && <Loader2 className="animate-spin" />}
                    {isPasswordLoading ? "Updating..." : "Update Password"}
                </Button>
            </form>
        </Form>
    );
}


export default function ProfilePage() {
  const { userData } = useAppContext();

  return (
    <PageClientAuth>
      <div className="flex flex-col min-h-screen">
        <Header />
         <main className="flex-1 flex flex-col items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                 <div className="mx-auto mb-2 bg-primary/10 p-3 rounded-full w-fit">
                    <Lock className="h-8 w-8 text-primary" />
                 </div>
                <CardTitle className="text-3xl font-bold">
                    Profile & Security
                </CardTitle>
                <CardDescription>Manage your account settings and view your balances.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <div className="p-4 rounded-lg bg-secondary flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CircleDollarSign className="h-6 w-6 text-muted-foreground" />
                            <span className="font-medium text-muted-foreground">Total Balance</span>
                        </div>
                        <span className="text-xl font-bold">₹{((userData?.depositBalance ?? 0) + (userData?.winningsBalance ?? 0) + (userData?.bonusBalance ?? 0)).toFixed(2)}</span>
                    </div>
                     <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="p-3 rounded-md bg-secondary/50 flex flex-col items-center justify-center">
                            <span className="text-muted-foreground flex items-center gap-1"><Trophy className="h-4 w-4"/> Winnings</span>
                            <span className="font-bold">₹{(userData?.winningsBalance ?? 0).toFixed(2)}</span>
                        </div>
                         <div className="p-3 rounded-md bg-secondary/50 flex flex-col items-center justify-center">
                            <span className="text-muted-foreground flex items-center gap-1"><Gift className="h-4 w-4" /> Bonus</span>
                            <span className="font-bold">₹{(userData?.bonusBalance ?? 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-4 text-center">Change Your Password</h4>
                  <ChangePasswordForm />
                </div>
            </CardContent>
          </Card>
         </main>
      </div>
    </PageClientAuth>
  );
}
