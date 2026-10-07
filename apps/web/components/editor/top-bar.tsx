"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeftIcon,
  CheckIcon,
  CloudOffIcon,
  CopyIcon,
  DownloadIcon,
  Grid3x3Icon,
  HistoryIcon,
  KeyboardIcon,
  Loader2Icon,
  MinusIcon,
  MoreHorizontalIcon,
  PlusIcon,
  Redo2Icon,
  SplitIcon,
  TriangleAlertIcon,
  Undo2Icon,
} from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ComponentProps, type ReactNode, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Form } from "@/components/form/form";
import { FormInput } from "@/components/form/form-input";
import { FormRootError, FormSubmit } from "@/components/form/form-submit";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { duration, ease } from "@/lib/motion";
import { RenameForm, type RenameValues } from "@/lib/projects-schema";
import { shortcutLabel } from "./shortcuts";
import { type SaveStatus, useEditor, useEditorStore } from "./store";

function IconButton({
  label,
  shortcut,
  children,
  ...props
}: { label: string; shortcut?: string; children: ReactNode } & ComponentProps<typeof Button>) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={label} {...props}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {label}
        {shortcut && <span className="ms-2 font-mono opacity-70">{shortcut}</span>}
      </TooltipContent>
    </Tooltip>
  );
}

const STATUS_ICON: Record<SaveStatus, ReactNode> = {
  saved: <CheckIcon className="size-3.5 text-success" aria-hidden />,
  saving: <Loader2Icon className="size-3.5 animate-spin" aria-hidden />,
  pending: <span className="size-1.5 rounded-full bg-warning" aria-hidden />,
  offline: <CloudOffIcon className="size-3.5 text-warning" aria-hidden />,
  error: <TriangleAlertIcon className="size-3.5 text-destructive" aria-hidden />,
};

function SaveIndicator() {
  const t = useTranslations("editor");
  const status = useEditor((s) => s.saveStatus);
  return (
    <output
      aria-live="polite"
      className="flex items-center gap-1.5 text-xs text-muted-foreground"
      data-testid="save-status"
    >
      <AnimatePresence mode="wait" initial={false}>
        <m.span
          key={status}
          className="flex items-center gap-1.5"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: duration.micro, ease: ease.out }}
        >
          {STATUS_ICON[status]}
          {t(`status.${status}`)}
        </m.span>
      </AnimatePresence>
    </output>
  );
}

function RenameButton() {
  const t = useTranslations("editor");
  const store = useEditorStore();
  const name = useEditor((s) => s.name);
  const [open, setOpen] = useState(false);
  const form = useForm<RenameValues>({ resolver: zodResolver(RenameForm), values: { name } });

  const submit = async (v: RenameValues) => {
    const res = await fetch(`/api/v1/projects/${store.get().projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: v.name }),
    });
    if (!res.ok) {
      form.setError("root", { message: t("renameFailed") });
      return;
    }
    store.set({ name: v.name });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="max-w-48 truncate rounded-full px-3 py-1 text-sm font-medium hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
          aria-label={t("renameLabel", { name })}
        >
          {name}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <Form form={form} onSubmit={submit} className="gap-3">
          <FormInput name="name" label={t("designName")} maxLength={120} autoFocus />
          <FormRootError />
          <FormSubmit size="sm">{t("rename")}</FormSubmit>
        </Form>
      </PopoverContent>
    </Popover>
  );
}

/** Hold to see the original photo (PRD US4.4). Pointer and keyboard (Space/Enter) both work. */
function CompareButton() {
  const t = useTranslations("editor");
  const store = useEditorStore();
  const compare = useEditor((s) => s.compare);
  const on = () => store.set({ compare: true });
  const off = () => store.set({ compare: false });
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={compare ? "aurora" : "ghost"}
          size="sm"
          aria-pressed={compare}
          onPointerDown={on}
          onPointerUp={off}
          onPointerLeave={off}
          onKeyDown={(e) => {
            if (e.key !== " " && e.key !== "Enter") return;
            e.preventDefault();
            on();
          }}
          onKeyUp={off}
          onBlur={off}
        >
          <SplitIcon aria-hidden />
          <span className="hidden xl:inline">{t("compare")}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {t("compareHint")} <span className="ms-2 font-mono opacity-70">\</span>
      </TooltipContent>
    </Tooltip>
  );
}

export function EditorTopBar({ onExport, onHelp }: { onExport: () => void; onHelp: () => void }) {
  const t = useTranslations("editor");
  const router = useRouter();
  const store = useEditorStore();
  const canUndo = useEditor((s) => s.history.past.length > 0);
  const canRedo = useEditor((s) => s.history.future.length > 0);
  const zoom = useEditor((s) => s.zoom);
  const showGrid = useEditor((s) => s.showGrid);

  const saveVersion = async () => {
    const res = await fetch(`/api/v1/projects/${store.get().projectId}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (res.ok) toast.success(t("versionSaved"));
    else toast.error(t("versionFailed"));
  };

  const duplicateDesign = async () => {
    const res = await fetch(`/api/v1/projects/${store.get().projectId}/duplicate`, { method: "POST" });
    if (!res.ok) return toast.error(t("duplicateFailed"));
    const { id } = (await res.json()) as { id: string };
    toast.success(t("duplicated"));
    router.push(`/editor/${id}`);
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-surface-1 px-2 md:px-3">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href="/projects" aria-label={t("back")}>
              <ArrowLeftIcon aria-hidden />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t("back")}</TooltipContent>
      </Tooltip>
      <RenameButton />
      <SaveIndicator />

      <div className="mx-auto flex items-center gap-0.5">
        <IconButton label={t("undo")} shortcut={shortcutLabel("undo")} disabled={!canUndo} onClick={store.undo}>
          <Undo2Icon aria-hidden />
        </IconButton>
        <IconButton label={t("redo")} shortcut={shortcutLabel("redo")} disabled={!canRedo} onClick={store.redo}>
          <Redo2Icon aria-hidden />
        </IconButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        <IconButton
          label={t("zoomOut")}
          shortcut={shortcutLabel("zoomOut")}
          onClick={() => store.canvas()?.zoomTo(zoom / 1.25)}
        >
          <MinusIcon aria-hidden />
        </IconButton>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-16 font-mono tabular-nums"
              onClick={() => store.canvas()?.fit()}
              aria-label={t("zoomFitLabel", { zoom: Math.round(zoom * 100) })}
            >
              {Math.round(zoom * 100)}%
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {t("zoomFit")} <span className="ms-2 font-mono opacity-70">{shortcutLabel("zoomFit")}</span>
          </TooltipContent>
        </Tooltip>
        <IconButton
          label={t("zoomIn")}
          shortcut={shortcutLabel("zoomIn")}
          onClick={() => store.canvas()?.zoomTo(zoom * 1.25)}
        >
          <PlusIcon aria-hidden />
        </IconButton>
        <IconButton
          label={t("grid")}
          shortcut={shortcutLabel("grid")}
          aria-pressed={showGrid}
          className={showGrid ? "bg-secondary" : undefined}
          onClick={() => store.set({ showGrid: !showGrid })}
        >
          <Grid3x3Icon aria-hidden />
        </IconButton>
        <CompareButton />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={t("more")}>
            <MoreHorizontalIcon aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onSelect={saveVersion}>
            <HistoryIcon aria-hidden /> {t("saveVersion")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={duplicateDesign}>
            <CopyIcon aria-hidden /> {t("duplicateDesign")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onHelp}>
            <KeyboardIcon aria-hidden /> {t("shortcuts")}
            <DropdownMenuShortcut>?</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button size="sm" onClick={onExport}>
        <DownloadIcon aria-hidden />
        {t("export")}
      </Button>
    </header>
  );
}
