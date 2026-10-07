"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "cn";
import { ImagePlusIcon, SparklesIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type DragEvent, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form } from "@/components/form/form";
import { FormInput } from "@/components/form/form-input";
import { FormSubmit } from "@/components/form/form-submit";

const schema = z.object({ idea: z.string().max(500).optional() });
type Values = z.infer<typeof schema>;

/**
 * Hero "describe or drop" bar. Honest by design: it doesn't fake a generation, it takes you to sign-up
 * (the editor and AI tools need an account). Dropping an image does the same.
 */
export function PromptBar() {
  const t = useTranslations("landing.hero");
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { idea: "" } });

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    router.push("/sign-up");
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: drop target; the form inside is the keyboard path
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        "rounded-2xl border bg-surface-1/80 p-1.5 shadow-card backdrop-blur transition-[border-color,box-shadow] duration-200",
        dragging && "border-primary shadow-glow",
      )}
    >
      <Form form={form} onSubmit={() => router.push("/sign-up")} className="flex-row items-center gap-1.5">
        <span className="ps-2.5 text-primary" aria-hidden>
          {dragging ? <ImagePlusIcon className="size-5" /> : <SparklesIcon className="size-5" />}
        </span>
        <FormInput<Values>
          name="idea"
          label={t("promptLabel")}
          hideLabel
          placeholder={t("promptPlaceholder")}
          autoComplete="off"
          className="flex-1 [&_input]:h-11 [&_input]:border-transparent [&_input]:bg-transparent [&_input]:shadow-none [&_input]:focus-visible:ring-0"
        />
        <FormSubmit size="default" className="h-11 px-5">
          {t("promptSubmit")}
        </FormSubmit>
      </Form>
    </div>
  );
}
