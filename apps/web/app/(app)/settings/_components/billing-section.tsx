import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { InvoiceRow } from "@/lib/billing/invoices";
import { BillingManageButton } from "./billing-manage-button";
import { SettingsCard } from "./settings-section";

function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

/** Plan/status + invoices. Upgrading always routes through /pricing — Settings never duplicates checkout. */
export async function BillingSection({
  planName,
  status,
  isPaid,
  hasStripeCustomer,
  stripeEnabled,
  invoices,
}: {
  planName: string;
  status: string;
  isPaid: boolean;
  hasStripeCustomer: boolean;
  stripeEnabled: boolean;
  invoices: InvoiceRow[];
}) {
  const t = await getTranslations("billing.settings");

  return (
    <div className="grid gap-5">
      <SettingsCard
        title={t("currentPlan")}
        aside={
          <div className="flex items-center gap-2">
            <Badge variant={isPaid ? "premium" : "secondary"} className="font-mono">
              {planName} · {status}
            </Badge>
            {stripeEnabled && hasStripeCustomer ? (
              <BillingManageButton />
            ) : (
              <Button asChild variant="secondary" size="sm">
                <Link href="/pricing">{t("upgrade")}</Link>
              </Button>
            )}
          </div>
        }
      >
        {!stripeEnabled && <p className="text-sm text-muted-foreground">{t("disabledNote")}</p>}
      </SettingsCard>

      <SettingsCard title={t("invoices")}>
        {invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noInvoices")}</p>
        ) : (
          <ul className="grid gap-2">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-text-2">{inv.createdAt.toLocaleDateString()}</span>
                {inv.hostedInvoiceUrl ? (
                  <a href={inv.hostedInvoiceUrl} className="text-primary underline underline-offset-4">
                    {t("invoiceAmount", { amount: formatAmount(inv.amountPaid, inv.currency), status: inv.status })}
                  </a>
                ) : (
                  <span>
                    {t("invoiceAmount", { amount: formatAmount(inv.amountPaid, inv.currency), status: inv.status })}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </SettingsCard>
    </div>
  );
}
