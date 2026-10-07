import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import {
  exportReadyTemplate,
  lowCreditsTemplate,
  type SentEmail,
  welcomeTemplate,
} from "@/emails/templates";

interface Mail {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const g = globalThis as unknown as { emailTransporter?: Transporter };

function getTransporter(): Transporter {
  if (g.emailTransporter) return g.emailTransporter;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  if (process.env.NODE_ENV !== "production") g.emailTransporter = transporter;
  return transporter;
}

/** SMTP via nodemailer. Without SMTP_HOST (dev/test), mail is logged to the console instead of sent. */
export async function sendEmail({ to, subject, text, html }: Mail): Promise<void> {
  if (!process.env.SMTP_HOST) {
    console.warn(`[email:dev] to=${to} subject="${subject}"\n${text}`);
    return;
  }
  await getTransporter().sendMail({ from: process.env.EMAIL_FROM, to, subject, text, html });
}

function deliver(to: string, email: SentEmail): Promise<void> {
  return sendEmail({ to, subject: email.subject, text: email.text, html: email.html });
}

/** Fire on signup (ASSUMPTIONS/PRD welcome email). Call from the user-create hook; never blocks signup on failure. */
export async function sendWelcomeEmail(to: string, name?: string | null): Promise<void> {
  try {
    await deliver(to, welcomeTemplate(name));
  } catch (e) {
    console.error("[email] welcome send failed", e);
  }
}

/**
 * Fire after any credit debit (job charge). Intentionally not wired into the AI job/credit-charge
 * code here (that's Phase 4 / the AI agent's domain) — call this with the balance *after* the debit.
 * No-ops at balance >= 5, and never throws.
 */
export async function maybeSendLowCreditsEmail(to: string, balanceAfter: number): Promise<void> {
  if (balanceAfter >= 5) return;
  try {
    await deliver(to, lowCreditsTemplate(balanceAfter));
  } catch (e) {
    console.error("[email] low-credits send failed", e);
  }
}

/** For when server-side export/render jobs exist (V2, ASSUMPTIONS D13 — export is client-side for MVP). */
export async function sendExportReadyEmail(to: string, downloadUrl: string): Promise<void> {
  try {
    await deliver(to, exportReadyTemplate(downloadUrl));
  } catch (e) {
    console.error("[email] export-ready send failed", e);
  }
}
