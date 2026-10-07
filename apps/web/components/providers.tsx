"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { MotionProvider } from "@/components/motion/motion-provider";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: ReactNode }) {
  return (
    // Light is the default (2026-10-07 redesign v2); dark and "system" are one toggle away in Settings.
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <MotionProvider>
        {children}
        <Toaster position="bottom-right" />
      </MotionProvider>
    </ThemeProvider>
  );
}
