"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { MotionProvider } from "@/components/motion/motion-provider";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: ReactNode }) {
  return (
    // Dark is the brand default; users can pick light or follow the system in Settings.
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <MotionProvider>
        {children}
        <Toaster position="bottom-right" />
      </MotionProvider>
    </ThemeProvider>
  );
}
