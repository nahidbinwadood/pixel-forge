import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { ThemeSegmented } from "@/components/shared/theme-segmented";
import { ButtonsShowcase } from "./_components/buttons-showcase";
import { FeedbackShowcase } from "./_components/feedback-showcase";
import { FormShowcase } from "./_components/form-showcase";
import { MotionShowcase } from "./_components/motion-showcase";
import { Section } from "./_components/section";
import { TokensShowcase } from "./_components/tokens-showcase";

export const metadata: Metadata = { title: "Design system", robots: { index: false } };

const SECTIONS = [
  { id: "tokens", title: "Tokens" },
  { id: "buttons", title: "Buttons & badges" },
  { id: "forms", title: "Form controls" },
  { id: "feedback", title: "Surfaces & feedback" },
  { id: "motion", title: "Motion" },
] as const;

/**
 * Dev-only living style guide (CLAUDE.md "Design system"): every component and state, both themes.
 * Preview new or changed components here before using them in features.
 */
export default function DesignSystemPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b glass">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Logo href="/design-system" />
            <span className="rounded-full border px-2 py-0.5 font-mono text-xs text-muted-foreground">
              design system
            </span>
          </div>
          <ThemeSegmented layoutId="ds-theme" className="max-w-xs" />
        </div>
        <nav aria-label="Sections" className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="shrink-0 rounded-md px-2.5 py-1 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {s.title}
            </a>
          ))}
        </nav>
      </header>

      <main id="main" className="mx-auto flex max-w-6xl flex-col gap-20 px-4 py-12">
        <Section
          id="tokens"
          title="Tokens"
          description="Color, type, radius and elevation. Everything in the UI comes from these."
        >
          <TokensShowcase />
        </Section>
        <Section
          id="buttons"
          title="Buttons & badges"
          description="Aurora = the one primary action per view. Premium = upsells only."
        >
          <ButtonsShowcase />
        </Section>
        <Section
          id="forms"
          title="Form controls"
          description="Every control is a Form* component wired to react-hook-form + zod. Submit empty to see errors."
        >
          <FormShowcase />
        </Section>
        <Section
          id="feedback"
          title="Surfaces & feedback"
          description="Cards, empty states, credits, loading, toasts, the signature light sweep."
        >
          <FeedbackShowcase />
        </Section>
        <Section
          id="motion"
          title="Motion"
          description="Presets from lib/motion.ts. Reduced motion is honored globally."
        >
          <MotionShowcase />
        </Section>
      </main>
    </div>
  );
}
