"use client";

import { getNode, updateNodes } from "@pixelforge/editor-core";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { cssFontFamily } from "./fonts";
import { useEditor, useEditorStore, usePage } from "./store";

/** In-place text editing: a textarea laid exactly over the text node (double-click or Enter to start). */
export function TextEditor({ id }: { id: string }) {
  const t = useTranslations("editor");
  const store = useEditorStore();
  const page = usePage();
  const zoom = useEditor((s) => s.zoom);
  const view = useEditor((s) => s.view);
  const ref = useRef<HTMLTextAreaElement>(null);
  const node = getNode(page, id);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.select();
  }, []);

  if (node?.type !== "text") return null;
  const color = node.fill.type === "solid" ? node.fill.color : (node.fill.stops[0]?.color ?? "inherit");
  const close = () => store.set({ editingTextId: null });

  return (
    <textarea
      ref={ref}
      aria-label={t("editText")}
      defaultValue={node.text}
      spellCheck
      onChange={(e) => store.run(updateNodes([id], { text: e.target.value }), "Edit text", `text:${id}`)}
      onBlur={close}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape" || (e.key === "Enter" && (e.metaKey || e.ctrlKey))) close();
      }}
      className="absolute resize-none overflow-hidden border-0 bg-transparent p-0 outline-2 outline-primary outline-offset-2 outline-dashed"
      style={{
        left: view.x + node.x * zoom,
        top: view.y + node.y * zoom,
        width: node.width * zoom,
        height: node.height * zoom + node.fontSize * zoom,
        transform: `rotate(${node.rotation}deg)`,
        transformOrigin: "top left",
        fontFamily: cssFontFamily(node.fontFamily),
        fontSize: node.fontSize * zoom,
        fontWeight: node.fontWeight,
        lineHeight: node.lineHeight,
        letterSpacing: node.letterSpacing * zoom,
        textAlign: node.align,
        color,
      }}
    />
  );
}
