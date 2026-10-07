import { Reveal } from "@/components/motion/reveal";

export interface LegalSection {
  title: string;
  body: string;
}

/** Shared shell for every legal page (terms, privacy, cookies, DMCA, AI policy): title + dated sections. */
export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <Reveal>
        <header className="grid gap-3 border-b pb-8">
          <h1 className="text-display">{title}</h1>
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-wide">{updated}</p>
          <p className="text-lg text-text-2">{intro}</p>
        </header>
      </Reveal>
      <div className="mt-10 grid gap-10">
        {sections.map((s, i) => (
          <Reveal key={s.title} delay={Math.min(i * 0.03, 0.2)} className="grid gap-2">
            <h2 className="text-h2">{s.title}</h2>
            <p className="text-pretty text-text-2">{s.body}</p>
          </Reveal>
        ))}
      </div>
    </article>
  );
}
