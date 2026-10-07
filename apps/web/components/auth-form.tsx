"use client";

import { m } from "motion/react";
import type { ReactNode } from "react";
import { fadeUp, stagger } from "@/lib/motion";

/** Shell for every auth screen: display-font title, one-line subtitle, the form, then a footer. Staggers in. */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <m.div className="flex flex-col gap-8" initial="hidden" animate="show" variants={stagger(0.07)}>
      <m.div variants={fadeUp} className="grid gap-2">
        <h1 className="text-h1">{title}</h1>
        {subtitle && <p className="text-text-2">{subtitle}</p>}
      </m.div>
      <m.div variants={fadeUp}>{children}</m.div>
      {footer && (
        <m.div variants={fadeUp} className="text-sm">
          {footer}
        </m.div>
      )}
    </m.div>
  );
}

/** Neutral (non-error) form notice: sent links, no-enumeration messages. */
export function AuthNotice({ children }: { children: ReactNode }) {
  return (
    <m.p
      role="status"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-md border border-primary/30 bg-accent px-3 py-2 text-sm text-accent-foreground"
    >
      {children}
    </m.p>
  );
}

/** Divider with a centered word ("or"). */
export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      {label}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function nextPath(): string {
  if (typeof window === "undefined") return "/home";
  const next = new URLSearchParams(window.location.search).get("next");
  // Only same-origin relative paths: blocks open redirects like ?next=//evil.com
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/home";
}

/** Better Auth client error → which message to show. Shared by every auth form. */
export type AuthErrorKind = "rateLimited" | "passwordPolicy" | "exists" | "forbidden" | "other";

export function authErrorKind(error: { status?: number; code?: string } | null | undefined): AuthErrorKind {
  if (!error) return "other";
  if (error.status === 429) return "rateLimited";
  if (error.code === "PASSWORD_POLICY") return "passwordPolicy";
  if (error.status === 422 || error.code === "USER_ALREADY_EXISTS") return "exists";
  if (error.status === 403) return "forbidden";
  return "other";
}
