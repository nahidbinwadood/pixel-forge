"use client";

import {
  ArrowDownToLineIcon,
  ArrowUpToLineIcon,
  CopyIcon,
  GroupIcon,
  LockIcon,
  Trash2Icon,
  UngroupIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { shortcutLabel } from "./shortcuts";
import { useEditor } from "./store";
import { useActions } from "./use-actions";

/** Right-click menu at the pointer for the current selection (PRD US3.7). */
export function ContextMenu({ position, onClose }: { position: { x: number; y: number } | null; onClose: () => void }) {
  const t = useTranslations("editor");
  const a = useActions();
  const count = useEditor((s) => s.selection.length);
  return (
    <DropdownMenu open={position !== null && count > 0} onOpenChange={(o) => !o && onClose()} modal={false}>
      <DropdownMenuTrigger asChild>
        <span
          aria-hidden
          className="pointer-events-none absolute size-px"
          style={{ left: position?.x, top: position?.y }}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuItem onSelect={a.duplicate}>
          <CopyIcon aria-hidden /> {t("shortcut.duplicate")}
          <DropdownMenuShortcut>{shortcutLabel("duplicate")}</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => a.reorder("front")}>
          <ArrowUpToLineIcon aria-hidden /> {t("shortcut.front")}
          <DropdownMenuShortcut>{shortcutLabel("front")}</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => a.reorder("back")}>
          <ArrowDownToLineIcon aria-hidden /> {t("shortcut.back")}
          <DropdownMenuShortcut>{shortcutLabel("back")}</DropdownMenuShortcut>
        </DropdownMenuItem>
        {count > 1 ? (
          <DropdownMenuItem onSelect={a.group}>
            <GroupIcon aria-hidden /> {t("shortcut.group")}
            <DropdownMenuShortcut>{shortcutLabel("group")}</DropdownMenuShortcut>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onSelect={a.ungroup}>
          <UngroupIcon aria-hidden /> {t("shortcut.ungroup")}
          <DropdownMenuShortcut>{shortcutLabel("ungroup")}</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={a.toggleLock}>
          <LockIcon aria-hidden /> {t("shortcut.lock")}
          <DropdownMenuShortcut>{shortcutLabel("lock")}</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={a.remove}>
          <Trash2Icon aria-hidden /> {t("shortcut.delete")}
          <DropdownMenuShortcut>{shortcutLabel("delete")}</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
