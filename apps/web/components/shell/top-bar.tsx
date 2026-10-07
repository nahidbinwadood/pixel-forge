import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LogoMark } from "@/components/brand/logo";
import { CreditMeter } from "@/components/shared/credit-meter";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { CommandPalette } from "./command-palette";

interface TopBarProps {
  user: { name: string; email: string; image: string | null };
  isAdmin: boolean;
  credits: number;
  allowance: number;
}

/** Sticky slim bar: search (⌘K) · credits · the one primary action (Create) · account. */
export async function TopBar({ user, isAdmin, credits, allowance }: TopBarProps) {
  const t = await getTranslations("nav");
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/75 px-4 backdrop-blur-xl md:px-6">
      <Link href="/home" className="rounded-lg md:hidden" aria-label={t("home")}>
        <LogoMark />
      </Link>
      <CommandPalette isAdmin={isAdmin} />
      <div className="ms-auto flex items-center gap-2.5">
        <CreditMeter
          balance={credits}
          allowance={allowance}
          label={t("creditsWord", { count: credits })}
          className="hidden sm:inline-flex"
        />
        <Button asChild size="sm" className="h-9 px-3.5">
          <Link href="/uploads">
            <PlusIcon aria-hidden />
            {t("create")}
          </Link>
        </Button>
        <UserMenu
          name={user.name}
          email={user.email}
          image={user.image}
          isAdmin={isAdmin}
          creditsLabel={`${credits} ${t("creditsWord", { count: credits })}`}
        />
      </div>
    </header>
  );
}
