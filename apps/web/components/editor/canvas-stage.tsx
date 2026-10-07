"use client";

import {
  type Box,
  drawableNodes,
  expandSelection,
  getNode,
  type NodePatch,
  nodeBounds,
  snapBox,
  unionBounds,
  updateEach,
} from "@pixelforge/editor-core";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Group, Layer, Line, Rect, Stage, Transformer } from "react-konva";
import { CanvasNode, type NodeHandlers, PageBackground } from "./canvas-node";
import { themeColor } from "./canvas-theme";
import { ContextMenu } from "./context-menu";
import { useEditor, useEditorStore, usePage } from "./store";
import { TextEditor } from "./text-editor";

const MIN_ZOOM = 0.05;
const MAX_ZOOM = 8;
const SNAP_PX = 6;
const clampZoom = (z: number) => Math.min(Math.max(z, MIN_ZOOM), MAX_ZOOM);
/** Grid line positions every `step` px inside `length`. */
const gridLines = (length: number, step: number) =>
  Array.from({ length: Math.floor(length / step) }, (_, i) => (i + 1) * step);

interface DragState {
  ids: string[];
  starts: Map<string, { x: number; y: number }>;
  box: Box;
  others: Box[];
}

/** The design canvas: zoom/pan, selection, drag with snapping guides, transformer, context menu. */
export function CanvasStage({ onReady }: { onReady?: () => void }) {
  const t = useTranslations("editor");
  const store = useEditorStore();
  const page = usePage();
  const selection = useEditor((s) => s.selection);
  const zoom = useEditor((s) => s.zoom);
  const view = useEditor((s) => s.view);
  const compare = useEditor((s) => s.compare);
  const showGrid = useEditor((s) => s.showGrid);
  const assetUrls = useEditor((s) => s.assetUrls);
  const editingTextId = useEditor((s) => s.editingTextId);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const uiLayerRef = useRef<Konva.Layer>(null);
  const gridRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const nodesRef = useRef(new Map<string, Konva.Group>());
  const dragRef = useRef<DragState | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [guides, setGuides] = useState<{ v: number[]; h: number[] }>({ v: [], h: [] });
  const [spaceDown, setSpaceDown] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  // Container size → stage size.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fit = useCallback(() => {
    const { width, height } = containerRef.current?.getBoundingClientRect() ?? { width: 0, height: 0 };
    if (!width || !height) return;
    const p = store.page();
    const z = clampZoom(Math.min((width - 96) / p.width, (height - 96) / p.height));
    store.set({ zoom: z, view: { x: (width - p.width * z) / 2, y: (height - p.height * z) / 2 } });
  }, [store]);

  /** Zoom around a screen point (defaults to the viewport center). */
  const zoomTo = useCallback(
    (next: number, at?: { x: number; y: number }) => {
      const { zoom: z, view: v } = store.get();
      const rect = containerRef.current?.getBoundingClientRect();
      const p = at ?? { x: (rect?.width ?? 0) / 2, y: (rect?.height ?? 0) / 2 };
      const nz = clampZoom(next);
      const wx = (p.x - v.x) / z;
      const wy = (p.y - v.y) / z;
      store.set({ zoom: nz, view: { x: p.x - wx * nz, y: p.y - wy * nz } });
    },
    [store],
  );

  // First layout: fit the page once the container has a size.
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current || size.width === 0) return;
    fitted.current = true;
    fit();
    onReady?.();
  }, [size.width, fit, onReady]);

  // Register the imperative API used by the top bar, export and thumbnails.
  useEffect(() => {
    store.registerCanvas({
      fit,
      zoomTo: (z) => zoomTo(z),
      render(pixelRatio) {
        const stage = stageRef.current;
        if (!stage) throw new Error("canvas not ready");
        const { zoom: z, view: v } = store.get();
        const p = store.page();
        uiLayerRef.current?.hide();
        gridRef.current?.hide();
        try {
          return stage.toCanvas({
            x: v.x,
            y: v.y,
            width: p.width * z,
            height: p.height * z,
            pixelRatio: pixelRatio / z,
          });
        } finally {
          uiLayerRef.current?.show();
          gridRef.current?.show();
        }
      },
    });
    return () => store.registerCanvas(null);
  }, [store, fit, zoomTo]);

  // Attach the transformer to the selected (visible) nodes.
  const anyLocked = selection.some((id) => getNode(page, id)?.locked);
  const onlyText = selection.length > 0 && selection.every((id) => getNode(page, id)?.type === "text");
  // biome-ignore lint/correctness/useExhaustiveDependencies: `page` re-attaches after nodes re-mount (undo/redo).
  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    const nodes = editingTextId
      ? []
      : selection.flatMap((id) => {
          const n = nodesRef.current.get(id);
          return n ? [n] : [];
        });
    tr.nodes(nodes);
    tr.getLayer()?.batchDraw();
  }, [selection, page, editingTextId]);

  // Space = temporary hand tool.
  useEffect(() => {
    const isTyping = (e: KeyboardEvent) =>
      e.target instanceof HTMLElement &&
      (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName));
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" && !isTyping(e)) {
        e.preventDefault();
        setSpaceDown(true);
      }
    };
    const up = (e: KeyboardEvent) => e.code === "Space" && setSpaceDown(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const handlers = useMemo<NodeHandlers>(
    () => ({
      register(id, node) {
        if (node) nodesRef.current.set(id, node);
        else nodesRef.current.delete(id);
      },
      onSelect(id, e) {
        if (e.evt instanceof MouseEvent && e.evt.button !== 0 && e.evt.button !== 2) return;
        const additive = e.evt.shiftKey || e.evt.metaKey || e.evt.ctrlKey;
        const { selection: sel } = store.get();
        if (e.evt instanceof MouseEvent && e.evt.button === 2 && sel.includes(id)) return;
        if (!additive && sel.includes(id)) return;
        store.select([id], additive);
      },
      onDragStart(id, e) {
        const p = store.page();
        const sel = store.get().selection;
        const ids = sel.includes(id) ? sel : expandSelection(p, [id]);
        if (!sel.includes(id)) store.select([id]);
        const moving = ids.flatMap((i) => {
          const n = getNode(p, i);
          return n && !n.locked ? [n] : [];
        });
        const starts = new Map(moving.map((n) => [n.id, { x: n.x, y: n.y }]));
        const box = unionBounds(moving.map(nodeBounds));
        if (!box || !starts.has(id)) {
          e.target.stopDrag();
          return;
        }
        const others = drawableNodes(p)
          .filter((n) => !starts.has(n.id))
          .map(nodeBounds);
        dragRef.current = { ids: [...starts.keys()], starts, box, others };
        store.set({ interacting: true });
      },
      onDragMove(id, e) {
        const d = dragRef.current;
        const start = d?.starts.get(id);
        if (!d || !start) return;
        let dx = e.target.x() - start.x;
        let dy = e.target.y() - start.y;
        const { snapping, zoom: z } = store.get();
        if (snapping && !e.evt.altKey) {
          const s = snapBox({ ...d.box, x: d.box.x + dx, y: d.box.y + dy }, d.others, store.page(), SNAP_PX / z);
          dx = s.x - d.box.x;
          dy = s.y - d.box.y;
          setGuides({ v: s.vertical, h: s.horizontal });
        }
        for (const [nid, st] of d.starts) nodesRef.current.get(nid)?.position({ x: st.x + dx, y: st.y + dy });
      },
      onDragEnd(id, e) {
        const d = dragRef.current;
        const start = d?.starts.get(id);
        dragRef.current = null;
        setGuides({ v: [], h: [] });
        store.set({ interacting: false });
        if (!d || !start) return;
        const dx = e.target.x() - start.x;
        const dy = e.target.y() - start.y;
        if (dx === 0 && dy === 0) return;
        const patches: Record<string, NodePatch> = {};
        for (const [nid, st] of d.starts) patches[nid] = { x: st.x + dx, y: st.y + dy };
        store.run(updateEach(patches), "Move");
      },
      onEditText(id) {
        store.set({ selection: [id], editingTextId: id });
      },
    }),
    [store],
  );

  const onTransformEnd = () => {
    const tr = trRef.current;
    if (!tr) return;
    const p = store.page();
    const patches: Record<string, NodePatch> = {};
    for (const g of tr.nodes()) {
      const n = getNode(p, g.id());
      if (!n) continue;
      const sx = Math.abs(g.scaleX());
      const sy = Math.abs(g.scaleY());
      const patch: NodePatch = { x: g.x(), y: g.y(), rotation: Math.round(g.rotation() * 100) / 100 };
      patch.width = Math.max(1, n.width * sx);
      patch.height = Math.max(1, n.height * sy);
      if (n.type === "text" && Math.abs(sy - 1) > 0.001) patch.fontSize = Math.max(1, n.fontSize * sy);
      g.scale({ x: 1, y: 1 });
      patches[n.id] = patch;
    }
    store.set({ interacting: false });
    store.run(updateEach(patches), "Transform");
  };

  const onStageDown = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    setMenu(null);
    const target = e.target;
    const onEmpty = target === e.target.getStage() || target.name() === "page-bg";
    if (onEmpty && !spaceDown) store.select([]);
  };

  const onWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const { zoom: z, view: v } = store.get();
    if (e.evt.ctrlKey || e.evt.metaKey) {
      const pointer = stageRef.current?.getPointerPosition() ?? undefined;
      zoomTo(z * (e.evt.deltaY > 0 ? 1 / 1.1 : 1.1), pointer);
    } else {
      store.set({ view: { x: v.x - e.evt.deltaX, y: v.y - e.evt.deltaY } });
    }
  };

  const onContextMenu = (e: KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault();
    const group = e.target.findAncestor(".doc-node", true) as Konva.Group | undefined;
    if (group && !store.get().selection.includes(group.id())) store.select([group.id()]);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMenu({ x: e.evt.clientX - rect.left, y: e.evt.clientY - rect.top });
  };

  const nodes = drawableNodes(page);
  const primary = themeColor("--primary");
  const gridStep = Math.max(8, Math.round(Math.min(page.width, page.height) / 12));

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-surface-3/60"
      style={{ cursor: spaceDown ? "grab" : undefined }}
      role="application"
      aria-label={t("canvasLabel", { width: page.width, height: page.height })}
      aria-roledescription={t("canvasRole")}
    >
      {size.width > 0 && (
        <Stage
          ref={stageRef}
          width={size.width}
          height={size.height}
          x={view.x}
          y={view.y}
          scaleX={zoom}
          scaleY={zoom}
          draggable={spaceDown}
          onDragEnd={(e) => {
            if (e.target === stageRef.current) store.set({ view: { x: e.target.x(), y: e.target.y() } });
          }}
          onMouseDown={onStageDown}
          onTouchStart={onStageDown}
          onWheel={onWheel}
          onContextMenu={onContextMenu}
        >
          <Layer>
            <Rect
              width={page.width}
              height={page.height}
              fill={themeColor("--surface-3")}
              shadowColor="black"
              shadowOpacity={0.12}
              shadowBlur={24 / zoom}
              shadowOffsetY={6 / zoom}
              listening={false}
            />
            <Group clipX={0} clipY={0} clipWidth={page.width} clipHeight={page.height}>
              <PageBackground
                background={page.background}
                width={page.width}
                height={page.height}
                url={page.background.type === "image" ? assetUrls[page.background.assetId] : undefined}
              />
              {nodes.map((n) => (
                <CanvasNode
                  key={n.id}
                  node={n}
                  url={n.type === "image" ? assetUrls[n.assetId] : undefined}
                  compare={compare}
                  editing={editingTextId === n.id}
                  handlers={handlers}
                />
              ))}
            </Group>
            <Group ref={gridRef} listening={false} visible={showGrid}>
              {showGrid &&
                gridLines(page.width, gridStep).map((x) => (
                  <Line
                    key={`v${x}`}
                    points={[x, 0, x, page.height]}
                    stroke={primary}
                    opacity={0.18}
                    strokeWidth={1 / zoom}
                  />
                ))}
              {showGrid &&
                gridLines(page.height, gridStep).map((y) => (
                  <Line
                    key={`h${y}`}
                    points={[0, y, page.width, y]}
                    stroke={primary}
                    opacity={0.18}
                    strokeWidth={1 / zoom}
                  />
                ))}
            </Group>
          </Layer>
          <Layer ref={uiLayerRef}>
            {guides.v.map((x) => (
              <Line
                key={`gv${x}`}
                points={[x, -1e4, x, 1e4]}
                stroke={primary}
                strokeWidth={1 / zoom}
                dash={[4 / zoom, 4 / zoom]}
              />
            ))}
            {guides.h.map((y) => (
              <Line
                key={`gh${y}`}
                points={[-1e4, y, 1e4, y]}
                stroke={primary}
                strokeWidth={1 / zoom}
                dash={[4 / zoom, 4 / zoom]}
              />
            ))}
            <Transformer
              ref={trRef}
              rotateEnabled={!anyLocked}
              resizeEnabled={!anyLocked}
              borderStroke={primary}
              anchorStroke={primary}
              anchorFill="white"
              anchorSize={9}
              anchorCornerRadius={5}
              rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
              enabledAnchors={
                onlyText
                  ? ["top-left", "top-right", "bottom-left", "bottom-right", "middle-left", "middle-right"]
                  : undefined
              }
              boundBoxFunc={(oldBox, newBox) => (newBox.width < 4 || newBox.height < 4 ? oldBox : newBox)}
              onTransformStart={() => store.set({ interacting: true })}
              onTransformEnd={onTransformEnd}
            />
          </Layer>
        </Stage>
      )}
      {editingTextId && <TextEditor id={editingTextId} />}
      <ContextMenu position={menu} onClose={() => setMenu(null)} />
    </div>
  );
}
