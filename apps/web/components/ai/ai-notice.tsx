import { FlaskConicalIcon, TriangleAlertIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

/** Honest status banner: demo (mock provider) or not configured. Renders nothing for a live provider. */
export async function AiNotice({ status }: { status: { provider: string; ready: boolean } }) {
  const t = await getTranslations("ai");
  if (status.ready && status.provider !== "mock") return null;
  const unconfigured = !status.ready;
  const Icon = unconfigured ? TriangleAlertIcon : FlaskConicalIcon;
  return (
    <p
      role="status"
      className={
        unconfigured
          ? "flex items-start gap-2.5 rounded-2xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm"
          : "flex items-start gap-2.5 rounded-2xl border bg-surface-1 px-4 py-3 text-sm text-text-2"
      }
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      {unconfigured ? t("unconfigured") : t("demoMode")}
    </p>
  );
}
