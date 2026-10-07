import { Specimen } from "./section";

const COLORS = [
  { name: "background", var: "--background" },
  { name: "surface-1", var: "--surface-1" },
  { name: "surface-2 / card", var: "--surface-2" },
  { name: "surface-3", var: "--surface-3" },
  { name: "foreground", var: "--foreground" },
  { name: "text-2", var: "--text-2" },
  { name: "muted-foreground", var: "--muted-foreground" },
  { name: "primary", var: "--primary" },
  { name: "accent", var: "--accent" },
  { name: "border", var: "--border" },
  { name: "success", var: "--success" },
  { name: "warning", var: "--warning" },
  { name: "destructive", var: "--destructive" },
  { name: "info", var: "--info" },
] as const;

const GRADIENTS = [
  { name: "grad-aurora · transformation", cls: "bg-aurora" },
  { name: "grad-premium · premium only", cls: "bg-premium" },
  { name: "grad-mesh · hero/CTA backdrop", cls: "bg-mesh" },
] as const;

const TYPE = [
  { name: "text-hero · Clash Display", cls: "text-hero font-display font-semibold", sample: "Make it glow" },
  { name: "text-h1", cls: "text-h1 font-display font-semibold", sample: "Your library" },
  { name: "text-h2", cls: "text-h2 font-display font-semibold", sample: "Recent designs" },
  { name: "body · Geist 16", cls: "text-base", sample: "Edit photos, design graphics and create with AI." },
  { name: "small · Geist 14", cls: "text-sm text-text-2", sample: "JPG, PNG, WebP, GIF or HEIC up to 25 MB" },
  { name: "mono · Geist Mono", cls: "font-mono text-sm", sample: "1,240 credits · ⌘K" },
] as const;

const RADII = [
  { name: "input 8", cls: "rounded-sm" },
  { name: "button 12", cls: "rounded-lg" },
  { name: "card 20", cls: "rounded-2xl" },
  { name: "panel 28", cls: "rounded-3xl" },
  { name: "full", cls: "rounded-full" },
] as const;

export function TokensShowcase() {
  return (
    <div className="flex flex-col gap-10">
      <Specimen label="Color" className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {COLORS.map((c) => (
          <div key={c.name} className="flex flex-col gap-2">
            <div className="h-16 rounded-xl border" style={{ background: `var(${c.var})` }} />
            <div className="grid">
              <span className="text-xs font-medium">{c.name}</span>
              <code className="font-mono text-[11px] text-muted-foreground">{c.var}</code>
            </div>
          </div>
        ))}
      </Specimen>

      <Specimen label="Gradients" className="grid gap-3 sm:grid-cols-3">
        {GRADIENTS.map((g) => (
          <div key={g.name} className="flex flex-col gap-2">
            <div className={`h-20 rounded-2xl border ${g.cls}`} />
            <span className="text-xs text-text-2">{g.name}</span>
          </div>
        ))}
      </Specimen>

      <Specimen label="Type scale" className="flex flex-col gap-5">
        {TYPE.map((t) => (
          <div key={t.name} className="grid gap-1 border-b pb-4 last:border-0">
            <span className="font-mono text-[11px] text-muted-foreground">{t.name}</span>
            <span className={t.cls}>{t.sample}</span>
          </div>
        ))}
        <span className="text-h1 font-display font-semibold">
          Gradient text, <span className="text-aurora">sparingly</span>
        </span>
      </Specimen>

      <Specimen label="Radius & elevation" className="flex flex-wrap items-end gap-4">
        {RADII.map((r) => (
          <div key={r.name} className="flex flex-col items-center gap-2">
            <div className={`size-20 border bg-card surface-highlight ${r.cls}`} />
            <span className="font-mono text-[11px] text-muted-foreground">{r.name}</span>
          </div>
        ))}
        <div className="flex flex-col items-center gap-2">
          <div className="size-20 rounded-2xl bg-card shadow-float" />
          <span className="font-mono text-[11px] text-muted-foreground">shadow-float</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="size-20 rounded-2xl bg-aurora shadow-glow" />
          <span className="font-mono text-[11px] text-muted-foreground">shadow-glow</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="grid size-20 place-items-center rounded-2xl bg-mesh">
            <div className="size-14 rounded-xl glass" />
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">glass (floating UI)</span>
        </div>
      </Specimen>
    </div>
  );
}
