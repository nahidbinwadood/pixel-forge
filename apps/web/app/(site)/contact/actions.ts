"use server";

import { APP_NAME } from "@pixelforge/shared";
import { headers } from "next/headers";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email(),
  message: z.string().trim().min(10).max(2000),
});

export type ContactResult = { ok: true } | { ok: false; error: string };

/** Public contact form → email. No DB model: this is a low-volume mailbox relay, not a ticket queue. */
export async function submitContact(values: z.infer<typeof schema>): Promise<ContactResult> {
  const input = schema.safeParse(values);
  if (!input.success) return { ok: false, error: input.error.issues[0]?.message ?? "Invalid input" };

  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  try {
    await rateLimit(`contact:${ip}`, 5, 10 * 60);
  } catch {
    return { ok: false, error: "Too many messages — try again later." };
  }

  // EMAIL_FROM doubles as the operator inbox for this beta (no separate CONTACT_EMAIL var yet).
  const to = process.env.EMAIL_FROM;
  if (!to) return { ok: false, error: "The contact form isn't configured yet." };

  try {
    await sendEmail({
      to,
      subject: `[${APP_NAME} contact] ${input.data.name}`,
      text: `From: ${input.data.name} <${input.data.email}>\n\n${input.data.message}`,
    });
  } catch (e) {
    console.error("[contact] send failed", e);
    return { ok: false, error: "Couldn't send that. Try again." };
  }
  return { ok: true };
}
