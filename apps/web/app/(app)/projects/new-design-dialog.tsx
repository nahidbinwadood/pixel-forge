"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { findPreset, ratioLabel, SIZE_PRESETS } from "@pixelforge/editor-core";
import { PlusIcon } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Form } from "@/components/form/form";
import { FormChoiceCards } from "@/components/form/form-choice-cards";
import { FormInput } from "@/components/form/form-input";
import { FormRootError, FormSubmit } from "@/components/form/form-submit";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { track } from "@/lib/analytics";
import { duration, ease } from "@/lib/motion";
import { NewDesignForm, type NewDesignValues } from "@/lib/projects-schema";

/** Aspect-ratio preview box (max 40 px on the long edge). */
function RatioBox({ width, height }: { width: number; height: number }) {
  const s = 40 / Math.max(width, height);
  return (
    <span
      aria-hidden
      className="block rounded-[4px] border-2 border-primary/60 bg-primary/10"
      style={{ width: Math.max(8, width * s), height: Math.max(8, height * s) }}
    />
  );
}

/** "New design" with the size-preset picker (PRD US3.1). Opens the editor on success. */
export function NewDesignDialog({ userId, trigger }: { userId: string; trigger?: ReactNode }) {
  const t = useTranslations("editor");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const form = useForm<NewDesignValues>({
    resolver: zodResolver(NewDesignForm),
    defaultValues: { preset: "instagram-post", width: 1080, height: 1080 },
  });
  const preset = useWatch({ control: form.control, name: "preset" });

  const submit = async (v: NewDesignValues) => {
    const p = findPreset(v.preset);
    const width = p?.width ?? v.width;
    const height = p?.height ?? v.height;
    const res = await fetch("/api/v1/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: p ? p.label : t("newDesign.untitled"), width, height }),
    });
    if (!res.ok) {
      form.setError("root", { message: t("newDesign.failed") });
      return;
    }
    const { id } = (await res.json()) as { id: string };
    track("project_created", { preset: v.preset, width, height }, userId);
    router.push(`/editor/${id}`);
  };

  const options = [
    ...SIZE_PRESETS.map((p) => ({
      value: p.id,
      label: p.label,
      hint: `${p.width}×${p.height} · ${ratioLabel(p.width, p.height)}`,
      visual: <RatioBox width={p.width} height={p.height} />,
    })),
    {
      value: "custom",
      label: t("newDesign.custom"),
      hint: t("newDesign.customHint"),
      visual: <RatioBox width={4} height={3} />,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button data-testid="new-design">
            <PlusIcon aria-hidden /> {t("newDesign.cta")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("newDesign.title")}</DialogTitle>
          <DialogDescription>{t("newDesign.description")}</DialogDescription>
        </DialogHeader>
        <Form form={form} onSubmit={submit} className="gap-4">
          <div className="max-h-[50vh] overflow-y-auto p-1">
            <FormChoiceCards<NewDesignValues>
              name="preset"
              label={t("newDesign.size")}
              hideLabel
              options={options}
              columns="grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
            />
          </div>
          <AnimatePresence initial={false}>
            {preset === "custom" && (
              <m.div
                className="grid grid-cols-2 gap-3"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: duration.micro, ease: ease.out }}
              >
                <FormInput<NewDesignValues>
                  name="width"
                  label={t("newDesign.width")}
                  type="number"
                  inputMode="numeric"
                />
                <FormInput<NewDesignValues>
                  name="height"
                  label={t("newDesign.height")}
                  type="number"
                  inputMode="numeric"
                />
              </m.div>
            )}
          </AnimatePresence>
          <FormRootError />
          <FormSubmit className="justify-self-end" data-testid="create-design">
            {t("newDesign.create")}
          </FormSubmit>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
