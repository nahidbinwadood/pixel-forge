import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getUser } from "@/lib/api";

/** Full-bleed editor area: no app shell, signed-in users only. */
export default async function EditorLayout({ children }: { children: ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/sign-in");
  return children;
}
