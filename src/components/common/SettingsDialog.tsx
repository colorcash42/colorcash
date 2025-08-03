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
import { Moon, Sun, Shield, Volume2, VolumeX } from "lucide-react";

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function SettingsDialog({ isOpen, onOpenChange }: SettingsDialogProps) {
  const { theme, setTheme, isUserAdmin, viewAsAdmin, setViewAsAdmin, soundEnabled, setSoundEnabled } = useAppContext();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
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
