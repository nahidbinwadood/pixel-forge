"use client";

import { cn } from "cn";
import { m } from "motion/react";
import { useEffect, useState } from "react";
import { spring } from "@/lib/motion";

/**
 * Section navigation. Desktop: sticky vertical list. Mobile: horizontal scrolling tabs.
 * The active item follows scroll position (IntersectionObserver on each section).
 */
export function SettingsNav({ sections, label }: { sections: { id: string; label: string }[]; label: string }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      // A thin band near the top third of the viewport decides which section is "current".
      { rootMargin: "-30% 0px -60% 0px" },
    );
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav aria-label={label} className="lg:sticky lg:top-24 lg:self-start">
      <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
        {sections.map((s) => {
          const isActive = s.id === active;
          return (
            <li key={s.id} className="shrink-0">
              <a
                href={`#${s.id}`}
                onClick={() => setActive(s.id)}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "relative block rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {isActive && (
                  <m.span
                    layoutId="settings-nav-active"
                    transition={spring.ui}
                    className="absolute inset-0 -z-10 rounded-lg bg-secondary"
                    aria-hidden
                  >
                    <span className="absolute inset-y-2 start-0 w-0.5 rounded-full bg-primary max-lg:hidden" />
                  </m.span>
                )}
                {s.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
