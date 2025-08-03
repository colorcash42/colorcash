"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CircleDollarSign, LogOut, Wallet, Gem, ShieldCheck, User, Settings, Menu } from "lucide-react";
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
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { SettingsDialog } from "./SettingsDialog";

const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Gem },
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

  const NavLink = ({ href, label, icon: Icon }: { href: string, label: string, icon: React.ElementType }) => (
    <SheetClose asChild>
      <Link href={href} className={cn(
        "flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground",
        pathname === href && "text-foreground bg-accent rounded-md"
      )}>
        <Icon className="h-5 w-5" />
        {label}
      </Link>
    </SheetClose>
  );

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          
          <div className="flex items-center gap-4">
            {/* Mobile Navigation */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col">
                <nav className="grid gap-6 text-lg font-medium">
                  <SheetClose asChild>
                    <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold mb-4">
                      <CircleDollarSign className="h-8 w-8 text-primary" />
                      <span className="font-headline tracking-tighter">ColorCash</span>
                    </Link>
                  </SheetClose>
                  {navLinks.map((link) => (
                    <NavLink key={link.href} href={link.href} label={link.label} icon={link.icon} />
                  ))}
                  {showAdminLink && (
                    <NavLink href={adminLink.href} label={adminLink.label} icon={adminLink.icon} />
                  )}
                </nav>
              </SheetContent>
            </Sheet>

            {/* Desktop Logo */}
            <Link href="/dashboard" className="hidden md:flex items-center gap-2">
                <CircleDollarSign className="h-8 w-8 text-primary" />
                <span className="font-headline text-2xl font-bold tracking-tighter">
                ColorCash
                </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
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
