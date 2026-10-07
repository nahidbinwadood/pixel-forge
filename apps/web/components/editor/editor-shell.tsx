"use client";

import { createHistory, type EditorDocument } from "@pixelforge/editor-core";
import type { Plan } from "@pixelforge/shared";
import { Loader2Icon } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ExportDialog } from "./export-dialog";
import { FloatingToolbar } from "./floating-toolbar";
import { LeftRail } from "./left-rail";
import { PropertiesPanel } from "./properties/properties-panel";
import { ShortcutsDialog } from "./shortcuts-dialog";
import { type EditorState, EditorStoreProvider, useEditor } from "./store";
import { EditorTopBar } from "./top-bar";
import { useAutosave } from "./use-autosave";
import { useShortcuts } from "./use-shortcuts";

/** Konva touches `window`, so the canvas only loads in the browser (CLAUDE.md: heavy client code via next/dynamic). */
const CanvasStage = dynamic(() => import("./canvas-stage").then((m) => m.CanvasStage), {
  ssr: false,
  loading: () => <CanvasLoading />,
});

function CanvasLoading() {
  const t = useTranslations("editor");
  return (
    <div className="grid h-full place-items-center bg-surface-3/60 text-sm text-text-2">
      <span className="flex items-center gap-2">
        <Loader2Icon className="size-4 animate-spin" aria-hidden /> {t("loadingCanvas")}
      </span>
    </div>
  );
}

export interface EditorProject {
  id: string;
  name: string;
  revision: number;
  document: EditorDocument;
}

export function EditorShell({
  project,
  assetUrls,
  plan,
  userId,
}: {
  project: EditorProject;
  assetUrls: Record<string, string>;
  plan: Plan;
  userId: string;
}) {
  const initial: EditorState = {
    projectId: project.id,
    name: project.name,
    history: createHistory(project.document),
    revision: project.revision,
    selection: [],
    zoom: 1,
    view: { x: 0, y: 0 },
    interacting: false,
    panel: "text",
    showGrid: false,
    snapping: true,
    compare: false,
    saveStatus: "saved",
    assetUrls,
    editingTextId: null,
    plan,
  };
  return (
    // key: a conflict copy navigates to a new id, which must start a fresh store.
    <EditorStoreProvider key={project.id} initial={initial}>
      <TooltipProvider delayDuration={300}>
        <EditorLayout userId={userId} />
      </TooltipProvider>
    </EditorStoreProvider>
  );
}

function EditorLayout({ userId }: { userId: string }) {
  const t = useTranslations("editor");
  const [exportOpen, setExportOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const maxMb = useEditor((s) => s.plan.maxUploadMb);
  const onExport = useCallback(() => setExportOpen(true), []);
  const onHelp = useCallback(() => setHelpOpen(true), []);
  useAutosave();
  useShortcuts({ onExport, onHelp, defaultText: t("text.bodyDefault") });

  return (
    <div className="flex h-dvh flex-col bg-background">
      <EditorTopBar onExport={onExport} onHelp={onHelp} />
      <div className="flex min-h-0 flex-1">
        <LeftRail maxMb={maxMb} userId={userId} />
        <main id="main" className="relative min-w-0 flex-1">
          <CanvasStage />
          <FloatingToolbar />
        </main>
        <PropertiesPanel />
      </div>
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} userId={userId} />
      <ShortcutsDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
}
