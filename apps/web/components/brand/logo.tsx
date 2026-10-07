import { APP_NAME } from "@pixelforge/shared";
import { cn } from "cn";
import Link from "next/link";

/** Aurora "P" mark: a pixel square with a light band through it. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} aria-hidden>
      <defs>
        <linearGradient id="pf-aurora" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7C5CFF" />
          <stop offset="0.55" stopColor="#2DA8FF" />
          <stop offset="1" stopColor="#2EF2C9" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#pf-aurora)" />
      <path
        d="M10 24V8h7.5a5 5 0 0 1 0 10H14v6"
        fill="none"
        stroke="#07070D"
        strokeWidth="3.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <rect x="20.5" y="20.5" width="4" height="4" rx="1" fill="#07070D" />
    </svg>
  );
}

export function Logo({
  href = "/",
  className,
  wordmark = true,
}: {
  href?: string;
  className?: string;
  wordmark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-md font-display text-lg font-semibold tracking-tight",
        className,
      )}
    >
      <LogoMark />
      {wordmark ? <span>{APP_NAME}</span> : <span className="sr-only">{APP_NAME}</span>}
    </Link>
  );
}
