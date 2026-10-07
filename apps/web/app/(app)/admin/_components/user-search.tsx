"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form } from "@/components/form/form";
import { FormInput } from "@/components/form/form-input";
import { Button } from "@/components/ui/button";

const schema = z.object({ q: z.string().trim().max(100) });
type Values = z.infer<typeof schema>;

/** Search is URL state (GET ?q=), so results are shareable and the server page does the query. */
export function UserSearch({ defaultValue }: { defaultValue: string }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [pending, start] = useTransition();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { q: defaultValue } });

  return (
    <search>
      <Form
        form={form}
        onSubmit={({ q }) => start(() => router.push(q ? `/admin?q=${encodeURIComponent(q)}` : "/admin"))}
        className="flex-row items-end gap-2"
      >
        <FormInput<Values>
          name="q"
          type="search"
          label={t("search")}
          hideLabel
          placeholder={t("search")}
          startIcon={<SearchIcon />}
          className="w-full max-w-md"
        />
        <Button type="submit" variant="secondary" loading={pending}>
          {t("searchSubmit")}
        </Button>
      </Form>
    </search>
  );
}
