
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
import { Moon, Sun, Shield, Volume2, VolumeX, Palette } from "lucide-react";
import React from "react";
import { ScrollArea } from "../ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function SettingsDialog({ isOpen, onOpenChange }: SettingsDialogProps) {
  const { 
    theme,
    setTheme,
    isUserAdmin, 
    viewAsAdmin, 
    setViewAsAdmin, 
    soundEnabled, 
    setSoundEnabled,
  } = useAppContext();
  
  const handleThemeChange = (newTheme: 'light' | 'dark') => {
      setTheme(newTheme);
      onOpenChange(false);
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
