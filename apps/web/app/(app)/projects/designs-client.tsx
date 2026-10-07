"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CopyIcon, LayoutTemplateIcon, MoreHorizontalIcon, PencilIcon, SearchIcon, Trash2Icon } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Form } from "@/components/form/form";
import { FormInput } from "@/components/form/form-input";
import { FormRootError, FormSubmit } from "@/components/form/form-submit";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { liftHover, listItem } from "@/lib/motion";
import type { ProjectCard } from "@/lib/projects";
import { RenameForm, type RenameValues } from "@/lib/projects-schema";
import { NewDesignDialog } from "./new-design-dialog";

const SearchForm = z.object({ q: z.string().max(100) });
type SearchValues = z.infer<typeof SearchForm>;
const SEARCH_DELAY = 250;

async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, { headers: { "Content-Type": "application/json" }, ...init });
  if (!res.ok) throw new Error(String(res.status));
  return res;
}

/** My Designs grid: search, rename, duplicate, trash (with undo), load more. */
export function DesignsClient({
  initial,
  initialCursor,
  userId,
}: {
  initial: ProjectCard[];
  initialCursor: string | null;
  userId: string;
}) {
  const t = useTranslations("editor");
  const [items, setItems] = useState(initial);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [renaming, setRenaming] = useState<ProjectCard | null>(null);
  const search = useForm<SearchValues>({ resolver: zodResolver(SearchForm), defaultValues: { q: "" } });
  const q = useWatch({ control: search.control, name: "q" });
  const firstRun = useRef(true);

  const load = useCallback(
    async (query: string, after?: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ ...(query ? { q: query } : {}), ...(after ? { cursor: after } : {}) });
        const data = (await (await api(`/api/v1/projects?${params}`)).json()) as {
          items: ProjectCard[];
          nextCursor: string | null;
        };
        setItems((prev) => (after ? [...prev, ...data.items] : data.items));
        setCursor(data.nextCursor);
      } catch {
        toast.error(t("designs.loadFailed"));
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const timer = setTimeout(() => void load(q.trim()), SEARCH_DELAY);
    return () => clearTimeout(timer);
  }, [q, load]);

  const duplicate = async (p: ProjectCard) => {
    try {
      await api(`/api/v1/projects/${p.id}/duplicate`, { method: "POST" });
      toast.success(t("duplicated"));
      await load(q.trim());
    } catch {
      toast.error(t("duplicateFailed"));
    }
  };

  const trash = async (p: ProjectCard) => {
    try {
      await api(`/api/v1/projects/${p.id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.id !== p.id));
      toast(t("designs.trashed", { name: p.name }), {
        action: {
          label: t("designs.undo"),
          onClick: async () => {
            await api(`/api/v1/projects/${p.id}`, { method: "PATCH", body: JSON.stringify({ trashed: false }) });
            await load(q.trim());
          },
        },
      });
    } catch {
      toast.error(t("designs.trashFailed"));
    }
  };

  return (
    <div className="grid gap-6">
      <Form form={search} onSubmit={() => undefined} className="max-w-sm" role="search">
        <FormInput<SearchValues>
          name="q"
          label={t("designs.search")}
          hideLabel
          type="search"
          placeholder={t("designs.searchPlaceholder")}
          startIcon={<SearchIcon />}
        />
      </Form>

      {items.length === 0 && !loading ? (
        q.trim() ? (
          <EmptyState icon={<SearchIcon />} title={t("designs.noMatch", { q: q.trim() })} />
        ) : (
          <EmptyState
            icon={<LayoutTemplateIcon />}
            title={t("designs.emptyTitle")}
            description={t("designs.emptyBody")}
            action={<NewDesignDialog userId={userId} />}
          />
        )
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" aria-busy={loading}>
          <AnimatePresence initial={false}>
            {items.map((p) => (
              <m.li
                key={p.id}
                layout
                variants={listItem}
                initial="hidden"
                animate="show"
                exit="exit"
                className="group relative"
              >
                <DesignCard project={p} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="glass"
                      size="icon-sm"
                      aria-label={t("designs.actions", { name: p.name })}
                      className="absolute top-2 right-2 opacity-100 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100"
                    >
                      <MoreHorizontalIcon aria-hidden />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onSelect={() => setRenaming(p)}>
                      <PencilIcon aria-hidden /> {t("rename")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => void duplicate(p)}>
                      <CopyIcon aria-hidden /> {t("shortcut.duplicate")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onSelect={() => void trash(p)}>
                      <Trash2Icon aria-hidden /> {t("designs.trash")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </m.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {cursor && (
        <Button
          variant="secondary"
          className="justify-self-center"
          loading={loading}
          onClick={() => void load(q.trim(), cursor)}
        >
          {t("designs.more")}
        </Button>
      )}

      <RenameDialog
        project={renaming}
        onClose={() => setRenaming(null)}
        onRenamed={(id, name) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, name } : i)))}
      />
    </div>
  );
}

function DesignCard({ project: p }: { project: ProjectCard }) {
  const t = useTranslations("editor");
  const updated = new Date(p.updatedAt);
  return (
    <m.div {...liftHover}>
      <Link
        href={`/editor/${p.id}`}
        className="grid gap-2 rounded-3xl focus-visible:ring-4 focus-visible:ring-ring/30 focus-visible:outline-none"
        data-testid="design-card"
      >
        <span className="grid aspect-[4/3] place-items-center overflow-hidden rounded-3xl border bg-surface-3 p-3">
          {p.thumbUrl ? (
            // biome-ignore lint/performance/noImgElement: presigned URL (CLAUDE.md: next/image except presigned)
            <img
              src={p.thumbUrl}
              alt=""
              className="max-h-full max-w-full rounded-md object-contain shadow-sm"
              loading="lazy"
            />
          ) : (
            <span
              aria-hidden
              className="max-h-full max-w-full rounded-md border bg-surface-1"
              style={{
                aspectRatio: `${p.width} / ${p.height}`,
                height: p.height >= p.width ? "100%" : undefined,
                width: p.width > p.height ? "100%" : undefined,
              }}
            />
          )}
        </span>
        <span className="grid gap-0.5 px-1">
          <span className="truncate text-sm font-medium">{p.name}</span>
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {p.width}×{p.height} · <time dateTime={p.updatedAt}>{t("designs.edited", { date: updated })}</time>
          </span>
        </span>
      </Link>
    </m.div>
  );
}

function RenameDialog({
  project,
  onClose,
  onRenamed,
}: {
  project: ProjectCard | null;
  onClose: () => void;
  onRenamed: (id: string, name: string) => void;
}) {
  const t = useTranslations("editor");
  const form = useForm<RenameValues>({ resolver: zodResolver(RenameForm), values: { name: project?.name ?? "" } });
  const submit = async (v: RenameValues) => {
    if (!project) return;
    try {
      await api(`/api/v1/projects/${project.id}`, { method: "PATCH", body: JSON.stringify({ name: v.name }) });
      onRenamed(project.id, v.name);
      onClose();
    } catch {
      form.setError("root", { message: t("renameFailed") });
    }
  };
  return (
    <Dialog open={project !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("rename")}</DialogTitle>
        </DialogHeader>
        <Form form={form} onSubmit={submit} className="gap-4">
          <FormInput<RenameValues> name="name" label={t("designName")} maxLength={120} autoFocus />
          <FormRootError />
          <FormSubmit className="justify-self-end">{t("rename")}</FormSubmit>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
