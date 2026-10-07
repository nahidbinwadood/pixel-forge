"use client";

import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Card + form with a single pending/error state. `onSubmit` returns an error message to show, or nothing.
 * Every auth screen uses it so loading and error handling look the same everywhere.
 */
export function AuthForm({
  title,
  submitLabel,
  onSubmit,
  children,
  footer,
}: {
  title: string;
  submitLabel: string;
  onSubmit: (data: FormData) => Promise<string | undefined>;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string>();

  async function handle(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setMessage(undefined);
    try {
      setMessage(await onSubmit(new FormData(e.currentTarget)));
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={handle} className="flex flex-col gap-4" noValidate={false}>
          {children}
          {message && (
            <Alert role="status">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" disabled={pending} className="w-full">
            {submitLabel}
          </Button>
        </form>
        {footer}
      </CardContent>
    </Card>
  );
}

export function nextPath(): string {
  if (typeof window === "undefined") return "/home";
  const next = new URLSearchParams(window.location.search).get("next");
  // Only same-origin relative paths: blocks open redirects like ?next=//evil.com
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/home";
}
