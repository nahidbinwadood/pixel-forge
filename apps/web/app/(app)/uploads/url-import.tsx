"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LinkIcon } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Form } from "@/components/form/form";
import { FormInput } from "@/components/form/form-input";
import { FormSubmit } from "@/components/form/form-submit";
import { Button } from "@/components/ui/button";
import { duration, ease } from "@/lib/motion";

/**
 * Secondary action: import an image by URL. Fetched in the browser, never by the server
 * (no SSRF surface, ASSUMPTIONS D27). Sites without CORS fail with a clear message.
 */
export function UrlImport({ onFile }: { onFile: (file: File) => Promise<void> }) {
  const t = useTranslations("uploads");
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const schema = z.object({ url: z.url({ protocol: /^https?$/, error: t("urlInvalid") }) });
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { url: "" } });

  async function submit({ url }: z.infer<typeof schema>) {
    try {
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const name = new URL(url).pathname.split("/").pop() || "image";
      await onFile(new File([blob], name, { type: blob.type }));
      form.reset();
      setOpen(false);
    } catch {
      toast.error(t("urlFailed"));
    }
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <Button variant="ghost" size="sm" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((o) => !o)}>
        <LinkIcon aria-hidden />
        {t("fromUrl")}
      </Button>
      <AnimatePresence initial={false}>
        {open && (
          <m.div
            id={panelId}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: duration.panel, ease: ease.out }}
            className="w-full max-w-xl overflow-hidden"
          >
            <Form form={form} onSubmit={submit} className="flex-row items-start gap-2 p-1">
              <FormInput
                name="url"
                label={t("urlLabel")}
                hideLabel
                type="url"
                inputMode="url"
                placeholder={t("urlPlaceholder")}
                className="flex-1"
                autoFocus
              />
              <FormSubmit variant="secondary">{t("import")}</FormSubmit>
            </Form>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
