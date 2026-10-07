"use client";

import { CopyIcon, MoreHorizontalIcon, ShieldBanIcon, ShieldCheckIcon, UserCogIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setBanned } from "@/lib/admin";
import { UserSheet } from "./user-sheet";

export interface AdminUserRow {
  userId: string;
  email: string;
  role: string;
  planId: string;
  banned: boolean;
  isSelf: boolean;
  planIds: string[];
}

/** Row "Actions" menu. Quick actions inline; editing opens the side sheet. */
export function UserRowActions(props: AdminUserRow) {
  const t = useTranslations("admin");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pending, start] = useTransition();

  const toggleBan = () =>
    start(async () => {
      const r = await setBanned(props.userId, !props.banned);
      if (r.ok) toast.success(t("updated"));
      else toast.error(r.error);
    });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={t("actionsFor", { email: props.email })} loading={pending}>
            {!pending && <MoreHorizontalIcon />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
            {props.email}
          </DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => setSheetOpen(true)}>
            <UserCogIcon /> {t("manage")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              void navigator.clipboard.writeText(props.email).then(() => toast.success(t("copied")));
            }}
          >
            <CopyIcon /> {t("copyEmail")}
          </DropdownMenuItem>
          {!props.isSelf && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant={props.banned ? "default" : "destructive"} onSelect={toggleBan}>
                {props.banned ? <ShieldCheckIcon /> : <ShieldBanIcon />}
                {props.banned ? t("unban") : t("ban")}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <UserSheet {...props} open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}
