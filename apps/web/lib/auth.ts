import "server-only";
import { prisma } from "@pixelforge/db";
import { APP_NAME, PASSWORD_MAX_LENGTH, PLANS, passwordSchema } from "@pixelforge/shared";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { magicLink, twoFactor } from "better-auth/plugins";
import { magicLinkTemplate, resetPasswordTemplate, verifyEmailTemplate } from "@/emails/templates";
import { sendEmail, sendWelcomeEmail } from "./email";

const google =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET } }
    : undefined;

/** Endpoints that set a password → the body field holding it. */
const PASSWORD_FIELDS: Record<string, string> = {
  "/sign-up/email": "password",
  "/reset-password": "newPassword",
  "/change-password": "newPassword",
};

export const auth = betterAuth({
  appName: APP_NAME,
  baseURL: process.env.APP_URL,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    // Full policy (upper/lower/number/special) is enforced in hooks.before below.
    minPasswordLength: 6,
    maxPasswordLength: PASSWORD_MAX_LENGTH,
    // ponytail: verification is sent but not required to use the app (PRD US1.1 lands user signed in).
    requireEmailVerification: false,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: ({ user, url }) => {
      const { subject, html, text } = resetPasswordTemplate(url);
      return sendEmail({ to: user.email, subject, html, text });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: ({ user, url }) => {
      const { subject, html, text } = verifyEmailTemplate(url);
      return sendEmail({ to: user.email, subject, html, text });
    },
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
  hooks: {
    // Server-side password policy: same zod schema as the client forms, so it can't be bypassed via the API.
    before: createAuthMiddleware(async (ctx) => {
      const field = PASSWORD_FIELDS[ctx.path];
      if (!field) return;
      const value = (ctx.body as Record<string, unknown> | undefined)?.[field];
      const result = passwordSchema.safeParse(typeof value === "string" ? value : "");
      if (!result.success) {
        throw new APIError("BAD_REQUEST", {
          code: "PASSWORD_POLICY",
          message: result.error.issues.map((i) => i.message).join(", "),
        });
      }
    }),
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
          void sendWelcomeEmail(user.email, user.name);
        },
      },
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: ({ email, url }) => {
        const { subject, html, text } = magicLinkTemplate(url);
        return sendEmail({ to: email, subject, html, text });
      },
    }),
    twoFactor({ issuer: APP_NAME }),
    nextCookies(), // must be last
  ],
});

export type Session = typeof auth.$Infer.Session;
