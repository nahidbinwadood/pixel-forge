"use client";

import { cn } from "cn";
import { SearchIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { SIZE_PRESETS, type TemplateFilters } from "@/lib/template-filters";

const STYLES = ["bold", "elegant", "minimal", "modern", "playful", "vibrant"] as const;
const COLORS = [
  { id: "#FF6A3D", label: "Ember" },
  { id: "#7C5CFF", label: "Violet" },
  { id: "#2EF2C9", label: "Teal" },
  { id: "#FF5CA8", label: "Pink" },
  { id: "#FFC24D", label: "Gold" },
  { id: "#10112A", label: "Ink" },
  { id: "#1E3A8A", label: "Navy" },
  { id: "#2DA8FF", label: "Sky" },
  { id: "#E8233A", label: "Red" },
  { id: "#5E6180", label: "Slate" },
] as const;

/** A toggle pill: selecting the active value again clears the filter. */
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
        active ? "border-transparent bg-primary-solid text-white" : "border-border text-text-2 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function FilterBar({
  categories,
  filters,
  onChange,
}: {
  categories: { slug: string; name: string }[];
  filters: TemplateFilters;
  onChange: (next: Partial<TemplateFilters>) => void;
}) {
  const t = useTranslations("templates");
  const [q, setQ] = useState(filters.q);
  const firstRender = useRef(true);
  // `onChange` (the hook's setFilters) gets a new identity on every filter change, because it
  // closes over the current URL searchParams. Reading it through a ref keeps the debounce timer
  // keyed only on `q`: if it also depended on `onChange`, clicking a category chip while the
  // previous search-clear's timeout was still pending re-armed that timeout, and its *old* closure
  // (built from the pre-click searchParams) later overwrote the category back out.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // External filter changes (e.g. "Clear filters") resync the input.
  useEffect(() => {
    setQ(filters.q);
  }, [filters.q]);

  // Debounced search: keep the URL (and the fetch it triggers) from firing on every keystroke.
  // Skips the mount run so loading the page doesn't immediately re-push the same query.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const id = setTimeout(() => onChangeRef.current({ q }), 350);
    return () => clearTimeout(id);
  }, [q]);

  const hasFilters = filters.category || filters.sizePreset || filters.style || filters.color || filters.premium;

  return (
    <div className="sticky top-0 z-10 -mx-4 flex flex-col gap-3 bg-background/85 px-4 py-3 backdrop-blur-sm sm:-mx-0 sm:px-0">
      <div className="relative">
        <Label htmlFor="template-search" className="sr-only">
          {t("searchLabel")}
        </Label>
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="template-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="pl-10"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Chip active={filters.category === ""} onClick={() => onChange({ category: "" })}>
          {t("allCategories")}
        </Chip>
        {categories.map((c) => (
          <Chip
            key={c.slug}
            active={filters.category === c.slug}
            onClick={() => onChange({ category: filters.category === c.slug ? "" : c.slug })}
          >
            {c.name}
          </Chip>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={filters.sizePreset || "_all"}
          onValueChange={(v) => onChange({ sizePreset: v === "_all" ? "" : v })}
        >
          <SelectTrigger size="sm" aria-label={t("size")}>
            <SelectValue placeholder={t("allSizes")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">{t("allSizes")}</SelectItem>
            {SIZE_PRESETS.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-1.5 overflow-x-auto">
          {STYLES.map((s) => (
            <Chip
              key={s}
              active={filters.style === s}
              onClick={() => onChange({ style: filters.style === s ? "" : s })}
            >
              {s}
            </Chip>
          ))}
        </div>

        <div className="flex gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={filters.color === c.id}
              aria-label={c.label}
              title={c.label}
              onClick={() => onChange({ color: filters.color === c.id ? "" : c.id })}
              className={cn(
                "size-6 shrink-0 rounded-full ring-offset-2 ring-offset-background transition-shadow",
                filters.color === c.id && "ring-2 ring-foreground",
              )}
              style={{ backgroundColor: c.id }}
            />
          ))}
        </div>

        <label htmlFor="template-premium-only" className="flex items-center gap-2 text-sm text-text-2">
          <Switch
            id="template-premium-only"
            size="sm"
            checked={filters.premium}
            onCheckedChange={(premium) => onChange({ premium })}
          />
          {t("premiumOnly")}
        </label>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange({ category: "", sizePreset: "", style: "", color: "", premium: false })}
          >
            <XIcon /> {t("clearFilters")}
          </Button>
        )}
      </div>
    </div>
  );
}
