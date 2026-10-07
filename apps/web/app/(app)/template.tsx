import type { ReactNode } from "react";
import { PageTransition } from "@/components/motion/page-transition";

/** Re-mounts per navigation, so each page's content gets the short entry transition. */
export default function AppTemplate({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
