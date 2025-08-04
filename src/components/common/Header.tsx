"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CircleDollarSign, LogOut, Wallet, Gem, ShieldCheck, User, Settings, LayoutGrid, Gamepad2 } from "lucide-react";
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

  const handleLogout = () => {
    logout();
    router.push("/");
  };
  
  const showAdminLink = isUserAdmin && viewAsAdmin;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          
          <div className="flex items-center gap-4">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2">
                <CircleDollarSign className="h-8 w-8 text-primary" />
                <span className="font-headline text-2xl font-bold tracking-tighter">
                ColorCash
                </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-2 md:flex">
              {navLinks.map((link) => {
                  const onGamePage = pathname.startsWith('/games/');
                  const isCurrentLink = onGamePage ? link.href === '/dashboard' : pathname === link.href;
                  const label = onGamePage && link.href === '/dashboard' ? link.lobbyLabel : link.label;
                  const icon = (onGamePage && link.href === '/dashboard') ? <LayoutGrid className="mr-2 h-4 w-4" /> : <link.icon className="mr-2 h-4 w-4" />;
                  
                  return (
                    <Button key={link.href} variant="ghost" asChild className={cn(
                        isCurrentLink && "bg-secondary"
                    )}>
                        <Link href={link.href}>
                            {icon}
                            {label}
                        </Link>
                    </Button>
                  );
              })}
              {showAdminLink && (
                 <Button variant="ghost" asChild className={cn(
                      pathname === adminLink.href && "bg-secondary"
                  )}>
                      <Link href={adminLink.href}>
                          <adminLink.icon className="mr-2 h-4 w-4" />
                          {adminLink.label}
                      </Link>
                  </Button>
              )}
          </nav>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2">
              <Wallet className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold tabular-nums">
                ₹{walletBalance.toFixed(2)}
              </span>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Open user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Mobile Navigation Links */}
                <div className="md:hidden">
                  {navLinks.map((link) => {
                      const onGamePage = pathname.startsWith('/games/');
                      const label = onGamePage && link.href === '/dashboard' ? link.lobbyLabel : link.label;
                      const icon = onGamePage && link.href === '/dashboard' ? <LayoutGrid className="mr-2 h-4 w-4" /> : <link.icon className="mr-2 h-4 w-4" />;
                      
                      return (
                         <DropdownMenuItem key={link.href} asChild>
                            <Link href={link.href}>
                               {icon}
                               <span>{label}</span>
                            </Link>
                         </DropdownMenuItem>
                      );
                  })}
                  {showAdminLink && (
                      <DropdownMenuItem asChild>
                        <Link href={adminLink.href}>
                           <adminLink.icon className="mr-2 h-4 w-4" />
                           <span>{adminLink.label}</span>
                        </Link>
                      </DropdownMenuItem>
                  )}
                   <DropdownMenuSeparator />
                </div>
                
                <DropdownMenuItem onSelect={() => setIsSettingsOpen(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleLogout}>
                   <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
       <SettingsDialog isOpen={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </>
  );
}
