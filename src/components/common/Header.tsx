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
  DropdownMenuGroup
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
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center space-x-4">
          
          <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
            <Gem className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline">
                ColorCash
            </span>
          </Link>

          <nav className="hidden items-center space-x-1 md:flex">
              {navLinks.map((link) => {
                  const onGamePage = pathname.startsWith('/games/');
                  const isCurrentLink = onGamePage ? link.href === '/dashboard' : pathname === link.href;
                  const label = onGamePage && link.href === '/dashboard' ? link.lobbyLabel : link.label;
                  const Icon = (onGamePage && link.href === '/dashboard') ? LayoutGrid : link.icon;
                  
                  return (
                    <Button key={link.href} variant="ghost" asChild className={cn("text-sm font-medium", !isCurrentLink && "text-muted-foreground")}>
                        <Link href={link.href}>
                            <Icon />
                            {label}
                        </Link>
                    </Button>
                  );
              })}
              {showAdminLink && (
                 <Button variant="ghost" asChild className={cn("text-sm font-medium", pathname !== adminLink.href && "text-muted-foreground")}>
                      <Link href={adminLink.href}>
                          <ShieldCheck />
                          {adminLink.label}
                      </Link>
                  </Button>
              )}
          </nav>

          <div className="flex flex-1 items-center justify-end space-x-4">
            <Button variant="outline" className="hidden sm:inline-flex">
              <CircleDollarSign />
                ₹{walletBalance.toFixed(2)}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <Avatar>
                    <AvatarFallback>{user ? getInitials(user.email) : '?'}</AvatarFallback>
                  </Avatar>
                  <span className="sr-only">Open user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                  <DropdownMenuGroup className="md:hidden">
                      {navLinks.map((link) => {
                          const onGamePage = pathname.startsWith('/games/');
                          const label = onGamePage && link.href === '/dashboard' ? link.lobbyLabel : link.label;
                          const Icon = onGamePage && link.href === '/dashboard' ? LayoutGrid : link.icon;
                          
                          return (
                             <DropdownMenuItem key={link.href} asChild>
                                <Link href={link.href}>
                                <Icon />
                                <span>{label}</span>
                                </Link>
                             </DropdownMenuItem>
                          );
                      })}
                      {showAdminLink && (
                          <DropdownMenuItem asChild>
                            <Link href={adminLink.href}>
                                <ShieldCheck />
                                <span>{adminLink.label}</span>
                            </Link>
                          </DropdownMenuItem>
                      )}
                       <DropdownMenuSeparator />
                    </DropdownMenuGroup>
                <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onSelect={() => setIsSettingsOpen(true)}>
                       <Settings /> Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setIsHelpOpen(true)}>
                       <LifeBuoy /> Help & Support
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleLogout}>
                     <LogOut /> Log out
                  </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
       <SettingsDialog isOpen={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
       <HelpDialog isOpen={isHelpOpen} onOpenChange={setIsHelpOpen} />
    </>
  );
}
