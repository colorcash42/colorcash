
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CircleDollarSign, LogOut, Wallet, Gem, ShieldCheck, User, Settings, LayoutGrid, Gamepad2, LifeBuoy } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { SettingsDialog } from "./SettingsDialog";
import { HelpDialog } from "./HelpDialog";
import { Avatar, AvatarFallback } from "../ui/avatar";

const navLinks = [
    { href: "/dashboard", label: "Games", lobbyLabel: "Lobby", icon: Gem },
    { href: "/live", label: "Live", icon: Gamepad2 },
    { href: "/wallet", label: "Wallet", icon: Wallet },
];

const adminLink = { href: "/admin", label: "Admin", icon: ShieldCheck };


export function Header() {
  const { user, walletBalance, logout, isUserAdmin, viewAsAdmin } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/");
  };
  
  const showAdminLink = isUserAdmin && viewAsAdmin;
  
  const getInitials = (email: string | null | undefined): string => {
    if (!email) return "";
    const name = email.split('@')[0];
    return name.substring(0, 2).toUpperCase();
  }

  return (
    <>
      
        
          
          
            
                
                
                ColorCash
                
            
          

          
          
              {navLinks.map((link) => {
                  const onGamePage = pathname.startsWith('/games/');
                  const isCurrentLink = onGamePage ? link.href === '/dashboard' : pathname === link.href;
                  const label = onGamePage && link.href === '/dashboard' ? link.lobbyLabel : link.label;
                  const icon = (onGamePage && link.href === '/dashboard') ?  : ;
                  
                  return (
                    
                        
                            {icon}
                            {label}
                        
                    
                  );
              })}
              {showAdminLink && (
                 
                      
                          
                          {adminLink.label}
                      
                  
              )}
          

          
            
              
                
                ₹{walletBalance.toFixed(2)}
              
            
            
              
                
                  
                    
                        {user ? getInitials(user.email) : }
                    
                    Open user menu
                  
                
                
                  
                    My Account
                  
                  
                  
                    
                      {navLinks.map((link) => {
                          const onGamePage = pathname.startsWith('/games/');
                          const label = onGamePage && link.href === '/dashboard' ? link.lobbyLabel : link.label;
                          const icon = onGamePage && link.href === '/dashboard' ?  : ;
                          
                          return (
                             
                                {icon}
                                
                                    {label}
                                
                             
                          );
                      })}
                      {showAdminLink && (
                          
                            
                                
                                
                                    {adminLink.label}
                                
                            
                          
                      )}
                       
                    
                  
                  
                    
                      
                       Settings
                    
                    
                      
                       Help & Support
                    
                  
                  
                    
                      
                       Log out
                    
                  
                
              
            
          
        
      
       
       
    </>
  );
}
