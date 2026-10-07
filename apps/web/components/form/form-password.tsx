"use client";

import { PASSWORD_RULES } from "@pixelforge/shared";
import { cn } from "cn";
import { CheckIcon, EyeIcon, EyeOffIcon, XIcon } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useState } from "react";
import { type FieldValues, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { spring } from "@/lib/motion";
import { type BaseFieldProps, FormField } from "./form-field";

/**
 * Password field with show/hide (eye) toggle. `showRules` adds the live policy checklist
 * (use on sign-up, reset and change-password; omit on sign-in).
 */
export function FormPassword<T extends FieldValues>({
  showRules = false,
  autoComplete = "current-password",
  placeholder,
  ...props
}: BaseFieldProps<T> & {
  showRules?: boolean;
  autoComplete?: "current-password" | "new-password";
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  const value = useWatch<T>({ name: props.name }) as string | undefined;

  return (
    <FormField {...props}>
      {({ field, aria, ids }) => (
        <>
          <div className="relative">
            <Input
              {...aria}
              type={visible ? "text" : "password"}
              name={field.name}
              ref={field.ref}
              value={field.value ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              disabled={field.disabled}
              autoComplete={autoComplete}
              placeholder={placeholder}
              className="pe-11"
              aria-describedby={
                [aria["aria-describedby"], showRules ? `${ids.control}-rules` : null].filter(Boolean).join(" ") ||
                undefined
              }
            />
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? "Hide password" : "Show password"}
              aria-pressed={visible}
              aria-controls={ids.control}
              disabled={field.disabled}
              className="absolute inset-y-0 end-0 flex w-11 items-center justify-center rounded-e-md text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <m.span
                  key={visible ? "off" : "on"}
                  initial={{ opacity: 0, scale: 0.6, rotate: -30 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.6, rotate: 30 }}
                  transition={spring.snappy}
                  className="flex"
                >
                  {visible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                </m.span>
              </AnimatePresence>
            </button>
          </div>
          {showRules && <PasswordRules id={`${ids.control}-rules`} value={value ?? ""} />}
        </>
      )}
    </FormField>
  );
}

function PasswordRules({ id, value }: { id: string; value: string }) {
  return (
    <ul id={id} aria-label="Password requirements" className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value);
        return (
          <li
            key={rule.id}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors",
              ok ? "text-success" : "text-muted-foreground",
            )}
          >
            <m.span
              animate={{ scale: ok ? [1, 1.25, 1] : 1 }}
              transition={{ duration: 0.25 }}
              className={cn("flex size-4 items-center justify-center rounded-full", ok ? "bg-success/15" : "bg-muted")}
              aria-hidden
            >
              {ok ? <CheckIcon className="size-3" /> : <XIcon className="size-3" />}
            </m.span>
            {rule.label}
            <span className="sr-only">{ok ? "(met)" : "(not met)"}</span>
          </li>
        );
      })}
    </ul>
  );
}
