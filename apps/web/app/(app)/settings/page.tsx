import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/page-header";
import { creditBalance, userPlan } from "@/lib/account";
import { requireUser } from "@/lib/api";
import { getEntitlements, hasStripeCustomerId } from "@/lib/billing/entitlements";
import { listInvoices } from "@/lib/billing/invoices";
import { stripeEnabled } from "@/lib/billing/stripe";
import { AppearanceSection } from "./_components/appearance-section";
import { BillingSection } from "./_components/billing-section";
import { DataSection } from "./_components/data-section";
import { PasswordForm } from "./_components/password-form";
import { PlanWidget } from "./_components/plan-widget";
import { ProfileForm } from "./_components/profile-form";
import { SettingsNav } from "./_components/settings-nav";
import { SettingsSection } from "./_components/settings-section";
import { TwoFactorForm } from "./_components/two-factor-form";
import { VerifyEmailBanner } from "./_components/verify-email-banner";

export const metadata: Metadata = { title: "Settings" };

/** Thin page: parallel data fetch, then composition of section components. */
export default async function SettingsPage() {
  const user = await requireUser();
  const [plan, credits, t, entitlements, invoices, hasStripeCustomer] = await Promise.all([
    userPlan(user.id),
    creditBalance(user.id),
    getTranslations("settings"),
    getEntitlements(user.id),
    listInvoices(user.id),
    hasStripeCustomerId(user.id),
  ]);

  const sections = [
    { id: "profile", label: t("profile") },
    { id: "appearance", label: t("appearance") },
    { id: "security", label: t("security") },
    { id: "billing", label: t("billing") },
    { id: "data", label: t("data") },
  ];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <PageHeader title={t("title")} description={t("description")} />
      {!user.emailVerified && <VerifyEmailBanner email={user.email} />}

      <div className="grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12">
        <SettingsNav sections={sections} label={t("sections")} />

        <div className="flex min-w-0 flex-col gap-14">
          <SettingsSection id="profile" title={t("profile")} description={t("profileDesc")}>
            <ProfileForm name={user.name} email={user.email} />
            <PlanWidget planName={plan.name} balance={credits} allowance={plan.monthlyCredits} />
          </SettingsSection>

          <SettingsSection id="appearance" title={t("appearance")} description={t("appearanceDesc")}>
            <AppearanceSection />
          </SettingsSection>

          <SettingsSection id="security" title={t("security")} description={t("securityDesc")}>
            <PasswordForm />
            <TwoFactorForm enabled={Boolean(user.twoFactorEnabled)} />
          </SettingsSection>

          <SettingsSection id="billing" title={t("billing")} description={t("billingDesc")}>
            <BillingSection
              planName={entitlements.name}
              status={entitlements.status}
              isPaid={entitlements.isPaid}
              hasStripeCustomer={hasStripeCustomer}
              stripeEnabled={stripeEnabled}
              invoices={invoices}
            />
          </SettingsSection>

          <SettingsSection id="data" title={t("data")} description={t("dataDesc")}>
            <DataSection />
          </SettingsSection>
        </div>
      </div>
    </div>
  );
}
