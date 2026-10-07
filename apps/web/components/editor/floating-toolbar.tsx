"use client";

import { getNode, nodeBounds, unionBounds } from "@pixelforge/editor-core";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CopyIcon,
  LockIcon,
  type LucideIcon,
  PencilIcon,
  Trash2Icon,
  UnlockIcon,
} from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { duration, ease } from "@/lib/motion";
import { shortcutLabel } from "./shortcuts";
import { useEditor, useEditorStore, usePage } from "./store";
import { useActions } from "./use-actions";

/** Quick actions floating above the selection; hidden while dragging/transforming or editing text. */
export function FloatingToolbar() {
  const t = useTranslations("editor");
  const store = useEditorStore();
  const a = useActions();
  const page = usePage();
  const selection = useEditor((s) => s.selection);
  const zoom = useEditor((s) => s.zoom);
  const view = useEditor((s) => s.view);
  const interacting = useEditor((s) => s.interacting);
  const editing = useEditor((s) => s.editingTextId);

  const nodes = selection.flatMap((id) => getNode(page, id) ?? []).filter((n) => n.type !== "group");
  const box = unionBounds(nodes.map(nodeBounds));
  const visible = Boolean(box) && !interacting && !editing;
  const locked = nodes.some((n) => n.locked);
  const onlyText = nodes.length === 1 && nodes[0]?.type === "text" ? nodes[0] : undefined;

  const left = box ? view.x + (box.x + box.width / 2) * zoom : 0;
  const top = box ? Math.max(8, view.y + box.y * zoom - 52) : 0;

  const actions: ReadonlyArray<{ id: string; icon: LucideIcon; label: string; run: () => void; danger?: boolean }> = [
    ...(onlyText
      ? [
          {
            id: "editText",
            icon: PencilIcon,
            label: t("editText"),
            run: () => store.set({ editingTextId: onlyText.id }),
          },
        ]
      : []),
    { id: "duplicate", icon: CopyIcon, label: t("shortcut.duplicate"), run: a.duplicate },
    { id: "forward", icon: ArrowUpIcon, label: t("shortcut.forward"), run: () => a.reorder("forward") },
    { id: "backward", icon: ArrowDownIcon, label: t("shortcut.backward"), run: () => a.reorder("backward") },
    {
      id: "lock",
      icon: locked ? UnlockIcon : LockIcon,
      label: locked ? t("unlock") : t("shortcut.lock"),
      run: a.toggleLock,
    },
    { id: "delete", icon: Trash2Icon, label: t("shortcut.delete"), run: a.remove, danger: true },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <m.div
          role="toolbar"
          aria-label={t("selectionToolbar")}
          data-testid="floating-toolbar"
          initial={{ opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.96 }}
          transition={{ duration: duration.micro, ease: ease.out }}
          className="absolute z-10 flex items-center gap-0.5 rounded-full border bg-surface-1 p-1 shadow-float"
          style={{ left, top, x: "-50%" }}
        >
          {actions.map(({ id, icon: Icon, label, run, danger }) => (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={label}
                  onClick={run}
                  className={danger ? "text-destructive hover:text-destructive" : undefined}
                >
                  <Icon aria-hidden />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {label}
                {shortcutLabel(id) && <span className="ms-2 font-mono opacity-70">{shortcutLabel(id)}</span>}
              </TooltipContent>
            </Tooltip>
          ))}
        </m.div>
      )}
    </AnimatePresence>
  );
}
