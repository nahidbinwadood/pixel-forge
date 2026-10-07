"use client";

import { useTranslations } from "next-intl";
import { ThemeSegmented } from "@/components/shared/theme-segmented";
import { SettingsCard } from "./settings-section";

export function AppearanceSection() {
  const t = useTranslations("settings");
  return (
    <SettingsCard title={t("themeLabel")} description={t("appearanceDesc")}>
      <ThemeSegmented />
    </SettingsCard>
  );
}
