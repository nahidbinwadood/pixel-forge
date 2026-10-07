"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { nextPath } from "./auth-form";

export function GoogleButton() {
  const t = useTranslations("auth");
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => authClient.signIn.social({ provider: "google", callbackURL: nextPath() })}
    >
      {t("google")}
    </Button>
  );
}
