import { z } from "zod";

/** Password policy (CLAUDE.md "Password policy"). One source of truth for client forms and server hooks. */
export const PASSWORD_RULES = [
  { id: "length", label: "At least 6 characters", test: (p: string) => p.length >= 6 },
  { id: "upper", label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { id: "lower", label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { id: "number", label: "One number", test: (p: string) => /\d/.test(p) },
  { id: "special", label: "One special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;

export type PasswordRuleId = (typeof PASSWORD_RULES)[number]["id"];

export const PASSWORD_MAX_LENGTH = 128;

export const passwordSchema = z
  .string()
  .max(PASSWORD_MAX_LENGTH, `At most ${PASSWORD_MAX_LENGTH} characters`)
  .superRefine((p, ctx) => {
    for (const rule of PASSWORD_RULES) {
      if (!rule.test(p)) ctx.addIssue({ code: "custom", message: rule.label, params: { rule: rule.id } });
    }
  });

/** Ids of rules the password still fails — drives the live checklist. */
export function failedPasswordRules(password: string): PasswordRuleId[] {
  return PASSWORD_RULES.filter((r) => !r.test(password)).map((r) => r.id);
}
