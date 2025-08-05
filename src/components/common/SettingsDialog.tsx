
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
  
  const form = useForm({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    }
  });

  const onSubmit: SubmitHandler = async (data) => {
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
    
      
        
          
            Settings
            Customize your application experience.
          
        
        
            
                
                    Theme
                
                
                    
                        
                            
                        
                        
                            
                                
                                Light
                            
                        
                    
                    
                        
                            
                        
                        
                            
                                
                                Dark (Original)
                            
                        
                    
                    
                        
                            
                        
                        
                            
                                
                                Dark Pro
                            
                        
                    
                
            

            
            

            
                
                    Audio
                     
                      
                        
                           
                               {soundEnabled ?  : }
                               Sound Effects
                            
                            Enable or disable in-game sounds.
                        
                         
                      
                    
                  
              

            
             
            
                 
                    Security
                   
                        
                            
                                
                                    Current Password
                                
                                
                                    
                                        
                                        
                                    
                                    
                                
                            
                            
                                
                                    New Password
                                
                                
                                    
                                        
                                        
                                    
                                    
                                
                            
                            
                                
                                    Confirm New Password
                                
                                
                                    
                                        
                                        
                                    
                                    
                                
                            
                            
                                {isPasswordLoading ?  : }
                                {isPasswordLoading ? "Updating..." : "Update Password"}
                            
                        
                    
                

            {isUserAdmin && (
              <>
                
                
                    
                      Developer Options
                       
                        
                           
                               
                                View as Admin
                            
                            Enable to see the admin panel and features.
                        
                         
                      
                    
                  
                
              </>
            )}
        
      
    
  );
}
