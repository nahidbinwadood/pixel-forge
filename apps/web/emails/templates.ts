import { APP_NAME } from "@pixelforge/shared";
import { renderEmail } from "./layout";

export interface SentEmail {
  subject: string;
  html: string;
  text: string;
}

export function verifyEmailTemplate(url: string): SentEmail {
  return {
    subject: `Verify your ${APP_NAME} email`,
    ...renderEmail({
      previewText: "Confirm your email to finish setting up your account.",
      heading: "Verify your email",
      paragraphs: [
        `Confirm this is your email address to finish setting up your ${APP_NAME} account.`,
        "If you didn't create an account, you can ignore this message.",
      ],
      button: { label: "Verify email", url },
      fallbackNote: `Or paste this link into your browser: ${url}`,
    }),
  };
}

export function magicLinkTemplate(url: string): SentEmail {
  return {
    subject: `Your ${APP_NAME} sign-in link`,
    ...renderEmail({
      previewText: "Here's your one-time sign-in link.",
      heading: `Sign in to ${APP_NAME}`,
      paragraphs: [
        "Use the button below to sign in. This link works once and expires shortly.",
        "If you didn't request this, you can ignore this message.",
      ],
      button: { label: "Sign in", url },
      fallbackNote: `Or paste this link into your browser: ${url}`,
    }),
  };
}

export function resetPasswordTemplate(url: string): SentEmail {
  return {
    subject: `Reset your ${APP_NAME} password`,
    ...renderEmail({
      previewText: "Reset your password. This link expires in 1 hour.",
      heading: "Reset your password",
      paragraphs: [
        "We got a request to reset your password. This link is valid for 1 hour and signs you out of other devices once used.",
        "If you didn't request this, you can ignore this message — your password won't change.",
      ],
      button: { label: "Reset password", url },
      fallbackNote: `Or paste this link into your browser: ${url}`,
    }),
  };
}

export function welcomeTemplate(name?: string | null): SentEmail {
  const greeting = name ? `Welcome, ${name.split(" ")[0]}!` : "Welcome!";
  return {
    subject: `Welcome to ${APP_NAME}`,
    ...renderEmail({
      previewText: `You're in — here's what to try first.`,
      heading: greeting,
      paragraphs: [
        `Your ${APP_NAME} account is ready, with free monthly credits already on your balance.`,
        "Upload a photo or start from a blank canvas — everything autosaves as you go.",
      ],
      button: { label: `Open ${APP_NAME}`, url: appUrl("/home") },
    }),
  };
}

export function lowCreditsTemplate(balance: number): SentEmail {
  return {
    subject: `Your ${APP_NAME} credits are running low`,
    ...renderEmail({
      previewText: `You have ${balance} credit${balance === 1 ? "" : "s"} left.`,
      heading: "Running low on credits",
      paragraphs: [
        `You have ${balance} credit${balance === 1 ? "" : "s"} left this month. AI tools (background remover, image generator, writer) are metered by credits.`,
        "Credits refill monthly on the free plan, or upgrade for a bigger monthly allowance.",
      ],
      button: { label: "View plans", url: appUrl("/pricing") },
    }),
  };
}

export function exportReadyTemplate(downloadUrl: string): SentEmail {
  return {
    subject: `Your ${APP_NAME} export is ready`,
    ...renderEmail({
      previewText: "Your export finished rendering.",
      heading: "Your export is ready",
      paragraphs: ["Your render finished. The download link below stays active for 7 days."],
      button: { label: "Download", url: downloadUrl },
      fallbackNote: `Or paste this link into your browser: ${downloadUrl}`,
    }),
  };
}

function appUrl(path: string): string {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return `${base}${path}`;
}
