"use client";

import { ThemeProvider } from "next-themes";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ScriptServiceProvider } from "@/hooks/use-script-service";
import { useSettingsStore } from "@/lib/store/settings-store";

/** Client-side providers shared by every route. */
export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    void useSettingsStore.persist.rehydrate();
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ScriptServiceProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </ScriptServiceProvider>
      <Toaster position="bottom-right" />
    </ThemeProvider>
  );
}
