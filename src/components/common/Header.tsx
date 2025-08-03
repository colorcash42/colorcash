"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CircleDollarSign, LogOut, Wallet, Gem, ShieldCheck, User, Settings } from "lucide-react";
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
    { href: "/dashboard", label: "Dashboard", icon: Gem },
    { href: "/wallet", label: "Wallet", icon: Wallet },
    { href: "/admin", label: "Admin", icon: ShieldCheck },
]

export function Header() {
  const { walletBalance, logout } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);


  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
              <CircleDollarSign className="h-8 w-8 text-primary" />
              <span className="font-headline text-2xl font-bold tracking-tighter">
              ColorCash
              </span>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
              {navLinks.map((link) => (
                  <Button key={link.href} variant="ghost" asChild className={cn(
                      pathname === link.href && "bg-secondary"
                  )}>
                      <Link href={link.href}>
                          <link.icon className="mr-2 h-4 w-4" />
                          {link.label}
                      </Link>
                  </Button>
              ))}
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
