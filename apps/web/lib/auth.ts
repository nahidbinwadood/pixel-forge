import "server-only";
import { prisma } from "@pixelforge/db";
import { APP_NAME, PLANS } from "@pixelforge/shared";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { magicLink, twoFactor } from "better-auth/plugins";
import { sendEmail } from "./email";

const google =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET } }
    : undefined;

export const auth = betterAuth({
  appName: APP_NAME,
  baseURL: process.env.APP_URL,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    // ponytail: verification is sent but not required to use the app (PRD US1.1 lands user signed in).
    requireEmailVerification: false,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: ({ user, url }) =>
      sendEmail({ to: user.email, subject: `Reset your ${APP_NAME} password`, text: `Reset your password: ${url}` }),
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: ({ user, url }) =>
      sendEmail({ to: user.email, subject: `Verify your ${APP_NAME} email`, text: `Verify your email: ${url}` }),
  },
  socialProviders: google,
  account: { accountLinking: { enabled: true, trustedProviders: ["google"] } },
  user: {
    additionalFields: {
      role: { type: "string", input: false, defaultValue: "user" },
      locale: { type: "string", input: false, defaultValue: "en" },
    },
  },
  session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
  rateLimit: {
    enabled: true,
    storage: "database",
    customRules: {
      "/sign-in/email": { window: 15 * 60, max: 5 }, // PRD US1.4
      "/sign-up/email": { window: 60, max: 10 },
      "/sign-in/magic-link": { window: 15 * 60, max: 5 },
      "/request-password-reset": { window: 15 * 60, max: 3 },
    },
  },
  databaseHooks: {
    session: {
      create: {
        // Deleted (GDPR grace period) and banned accounts can't start new sessions.
        before: async (session) => {
          const u = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { deletedAt: true, bannedAt: true },
          });
          if (u?.deletedAt || u?.bannedAt) throw new APIError("FORBIDDEN", { message: "This account is disabled" });
        },
      },
    },
    user: {
      create: {
        // Every user gets a personal workspace, a free plan and this month's credits (ARCHITECTURE §5).
        after: async (user) => {
          const month = new Date().toISOString().slice(0, 7);
          await prisma.$transaction([
            prisma.workspace.create({
              data: { name: "Personal", members: { create: { userId: user.id, role: "owner" } } },
            }),
            prisma.subscription.create({ data: { userId: user.id, planId: "free" } }),
            prisma.creditLedger.create({
              data: {
                userId: user.id,
                delta: PLANS.free.monthlyCredits,
                reason: "monthly_grant",
                dedupeKey: `grant:${month}:${user.id}`,
              },
            }),
          ]);
        },
      },
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: ({ email, url }) =>
        sendEmail({ to: email, subject: `Your ${APP_NAME} sign-in link`, text: `Sign in: ${url}` }),
    }),
    twoFactor({ issuer: APP_NAME }),
    nextCookies(), // must be last
  ],
});

export type Session = typeof auth.$Infer.Session;
