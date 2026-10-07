"use client";

import { cn } from "cn";
import { CheckIcon, ChevronsUpDownIcon, XIcon } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useState } from "react";
import type { FieldValues } from "react-hook-form";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { listItem } from "@/lib/motion";
import { type BaseFieldProps, FormField } from "./form-field";
import type { Option } from "./form-select";

/**
 * Searchable select (combobox). `multiple` stores string[] and shows removable chips.
 * Use for long lists (countries, fonts, categories) or anything users will type to find.
 */
export function FormCombobox<T extends FieldValues>({
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No matches.",
  multiple = false,
  ...props
}: BaseFieldProps<T> & {
  options: readonly Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  multiple?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const byValue = new Map(options.map((o) => [o.value, o]));

  return (
    <FormField {...props}>
      {({ field, aria }) => {
        const selected: string[] = multiple
          ? ((field.value as string[] | undefined) ?? [])
          : field.value
            ? [field.value]
            : [];
        const toggle = (value: string) => {
          if (!multiple) {
            field.onChange(value === field.value ? "" : value);
            setOpen(false);
            return;
          }
          field.onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
        };

        return (
          <div className="grid gap-2">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  role="combobox"
                  aria-expanded={open}
                  aria-haspopup="listbox"
                  {...aria}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  disabled={field.disabled}
                  className={cn(
                    "flex min-h-10 w-full items-center gap-2 rounded-sm border border-input bg-transparent px-3 py-1.5 text-start text-sm transition-colors",
                    "hover:bg-secondary/50 focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50 aria-invalid:border-destructive",
                  )}
                >
                  <span className="flex-1 truncate">
                    {selected.length === 0 ? (
                      <span className="text-muted-foreground">{placeholder}</span>
                    ) : multiple ? (
                      `${selected.length} selected`
                    ) : (
                      byValue.get(selected[0] ?? "")?.label
                    )}
                  </span>
                  <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                <Command>
                  <CommandInput placeholder={searchPlaceholder} />
                  <CommandList>
                    <CommandEmpty>{emptyText}</CommandEmpty>
                    <CommandGroup>
                      {options.map((o) => (
                        <CommandItem
                          key={o.value}
                          value={o.label}
                          disabled={o.disabled}
                          onSelect={() => toggle(o.value)}
                          aria-selected={selected.includes(o.value)}
                        >
                          <CheckIcon
                            className={cn("size-4", selected.includes(o.value) ? "opacity-100" : "opacity-0")}
                          />
                          {o.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {multiple && selected.length > 0 && (
              <ul className="flex flex-wrap gap-1.5" aria-label="Selected">
                <AnimatePresence initial={false}>
                  {selected.map((v) => (
                    <m.li key={v} layout variants={listItem} initial="hidden" animate="show" exit="exit">
                      <button
                        type="button"
                        onClick={() => toggle(v)}
                        aria-label={`Remove ${byValue.get(v)?.label ?? v}`}
                        className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs text-accent-foreground transition-colors hover:bg-accent/70"
                      >
                        {byValue.get(v)?.label ?? v}
                        <XIcon className="size-3" aria-hidden />
                      </button>
                    </m.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>
        );
      }}
    </FormField>
  );
}
