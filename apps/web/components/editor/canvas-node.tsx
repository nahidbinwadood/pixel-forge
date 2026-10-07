"use client";

import {
  applyAdjustments,
  type Background,
  effectiveAdjustments,
  type Fill,
  type ImageNode,
  isNeutral,
  type Node,
  type ShapeNode,
} from "@pixelforge/editor-core";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { memo, useEffect, useRef, useState } from "react";
import { Ellipse, Group, Image as KImage, Line, Rect, Text } from "react-konva";
import { themeColor } from "./canvas-theme";
import { cssFontFamily } from "./fonts";

/** Konva props for a document fill (solid or linear gradient across a w×h box). */
export function fillProps(fill: Fill | undefined, w: number, h: number): Record<string, unknown> {
  if (!fill) return { fillEnabled: false };
  if (fill.type === "solid") return { fill: fill.color };
  const rad = (fill.angle * Math.PI) / 180;
  const dx = (Math.cos(rad) * w) / 2;
  const dy = (Math.sin(rad) * h) / 2;
  return {
    fillPriority: "linear-gradient",
    fillLinearGradientStartPoint: { x: w / 2 - dx, y: h / 2 - dy },
    fillLinearGradientEndPoint: { x: w / 2 + dx, y: h / 2 + dy },
    fillLinearGradientColorStops: fill.stops.flatMap((s) => [s.offset, s.color]),
  };
}

const BLEND: Record<Node["blendMode"], GlobalCompositeOperation> = {
  normal: "source-over",
  multiply: "multiply",
  screen: "screen",
  overlay: "overlay",
};

/** Regular polygon / star points stretched to a w×h box. */
function polyPoints(sides: number, w: number, h: number, inner?: number): number[] {
  const count = inner ? sides * 2 : sides;
  return Array.from({ length: count }, (_, i) => {
    const r = inner && i % 2 === 1 ? inner : 1;
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / count;
    return [w / 2 + (Math.cos(a) * r * w) / 2, h / 2 + (Math.sin(a) * r * h) / 2];
  }).flat();
}

/** Load an image for canvas use; CORS-enabled so exports aren't tainted. */
export function useLoadedImage(url: string | undefined) {
  const [state, setState] = useState<{ url?: string; img: HTMLImageElement | null; failed: boolean }>({
    img: null,
    failed: false,
  });
  useEffect(() => {
    if (!url) return;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setState({ url, img, failed: false });
    img.onerror = () => setState({ url, img: null, failed: true });
    img.src = url;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [url]);
  if (!url) return { img: null, failed: true };
  return state.url === url ? state : { img: null, failed: false };
}

function ShapeContent({ node }: { node: ShapeNode }) {
  const { width: w, height: h } = node;
  const common = {
    ...fillProps(node.fill, w, h),
    stroke: node.stroke?.color,
    strokeWidth: node.stroke?.width ?? 0,
    strokeEnabled: Boolean(node.stroke && node.stroke.width > 0),
    perfectDrawEnabled: false,
  };
  switch (node.shape) {
    case "rect":
      return <Rect width={w} height={h} cornerRadius={node.cornerRadius} {...common} />;
    case "ellipse":
      return <Ellipse x={w / 2} y={h / 2} radiusX={w / 2} radiusY={h / 2} {...common} />;
    case "triangle":
      return <Line points={[w / 2, 0, w, h, 0, h]} closed {...common} />;
    case "line":
      return (
        <Line
          points={[0, h / 2, w, h / 2]}
          stroke={node.stroke?.color ?? (node.fill?.type === "solid" ? node.fill.color : undefined)}
          strokeWidth={node.stroke?.width ?? h}
          hitStrokeWidth={Math.max(16, h)}
          lineCap="round"
        />
      );
    case "star":
      return <Line points={polyPoints(5, w, h, 0.45)} closed {...common} />;
    case "polygon":
      return <Line points={polyPoints(6, w, h)} closed {...common} />;
  }
}

function ImageContent({ node, url, compare }: { node: ImageNode; url?: string; compare: boolean }) {
  const { img, failed } = useLoadedImage(url);
  const ref = useRef<Konva.Image>(null);
  const adj = effectiveAdjustments(compare ? {} : node.adjustments, compare ? undefined : node.filter);
  const adjKey = JSON.stringify(adj);
  const crop =
    node.crop && img
      ? {
          x: node.crop.x * img.naturalWidth,
          y: node.crop.y * img.naturalHeight,
          width: node.crop.width * img.naturalWidth,
          height: node.crop.height * img.naturalHeight,
        }
      : undefined;
  const cropKey = JSON.stringify(crop);

  // biome-ignore lint/correctness/useExhaustiveDependencies: adjKey/cropKey stand in for adj/crop by value.
  useEffect(() => {
    const k = ref.current;
    if (!k || !img) return;
    const values = JSON.parse(adjKey) as typeof adj;
    if (isNeutral(values)) {
      k.clearCache();
      k.filters([]);
    } else {
      const srcW = (crop?.width ?? img.naturalWidth) / Math.max(node.width, 1);
      k.filters([(data: ImageData) => applyAdjustments(data, values)]);
      k.cache({ pixelRatio: Math.min(Math.max(srcW, 1), 3) });
    }
    k.getLayer()?.batchDraw();
  }, [img, adjKey, cropKey, node.width, node.height]);

  if (!img) {
    return (
      <Rect
        width={node.width}
        height={node.height}
        fill={themeColor("--surface-3")}
        dash={[8, 6]}
        stroke={themeColor(failed ? "--destructive" : "--muted-foreground")}
        strokeWidth={1}
      />
    );
  }
  return <KImage ref={ref} image={img} width={node.width} height={node.height} crop={crop} />;
}

export interface NodeHandlers {
  onSelect: (id: string, e: KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onDragStart: (id: string, e: KonvaEventObject<DragEvent>) => void;
  onDragMove: (id: string, e: KonvaEventObject<DragEvent>) => void;
  onDragEnd: (id: string, e: KonvaEventObject<DragEvent>) => void;
  onEditText: (id: string) => void;
  register: (id: string, node: Konva.Group | null) => void;
}

/** One document node on the canvas. Memoized: Immer keeps unchanged nodes referentially equal. */
export const CanvasNode = memo(function CanvasNode({
  node,
  url,
  compare,
  editing,
  handlers,
}: {
  node: Node;
  url?: string;
  compare: boolean;
  editing: boolean;
  handlers: NodeHandlers;
}) {
  const { id } = node;
  return (
    <Group
      ref={(g) => handlers.register(id, g)}
      id={id}
      name="doc-node"
      x={node.x}
      y={node.y}
      rotation={node.rotation}
      opacity={node.opacity}
      globalCompositeOperation={BLEND[node.blendMode]}
      draggable={!node.locked}
      onMouseDown={(e) => handlers.onSelect(id, e)}
      onTap={(e) => handlers.onSelect(id, e)}
      onDragStart={(e) => handlers.onDragStart(id, e)}
      onDragMove={(e) => handlers.onDragMove(id, e)}
      onDragEnd={(e) => handlers.onDragEnd(id, e)}
      onDblClick={() => node.type === "text" && !node.locked && handlers.onEditText(id)}
      onDblTap={() => node.type === "text" && !node.locked && handlers.onEditText(id)}
    >
      <Group
        x={node.flipX ? node.width : 0}
        y={node.flipY ? node.height : 0}
        scaleX={node.flipX ? -1 : 1}
        scaleY={node.flipY ? -1 : 1}
      >
        {node.type === "text" && (
          <Text
            visible={!editing}
            text={node.text}
            width={node.width}
            fontFamily={cssFontFamily(node.fontFamily)}
            fontSize={node.fontSize}
            fontStyle={String(node.fontWeight)}
            align={node.align}
            lineHeight={node.lineHeight}
            letterSpacing={node.letterSpacing}
            wrap="word"
            {...fillProps(node.fill, node.width, node.height)}
            stroke={node.stroke?.color}
            strokeWidth={node.stroke?.width ?? 0}
            fillAfterStrokeEnabled
            shadowEnabled={Boolean(node.shadow)}
            shadowColor={node.shadow?.color}
            shadowBlur={node.shadow?.blur}
            shadowOffsetX={node.shadow?.offsetX}
            shadowOffsetY={node.shadow?.offsetY}
          />
        )}
        {node.type === "shape" && <ShapeContent node={node} />}
        {node.type === "image" && <ImageContent node={node} url={url} compare={compare} />}
        {node.type === "sticker" && (
          <Rect
            width={node.width}
            height={node.height}
            dash={[6, 6]}
            stroke={themeColor("--muted-foreground")}
            strokeWidth={1}
          />
        )}
      </Group>
    </Group>
  );
});

/** Page background: solid, gradient, or an image covering the page. */
export function PageBackground({
  background,
  width,
  height,
  url,
}: {
  background: Background;
  width: number;
  height: number;
  url?: string;
}) {
  const { img } = useLoadedImage(background.type === "image" ? url : undefined);
  if (background.type !== "image") {
    return <Rect name="page-bg" width={width} height={height} {...fillProps(background, width, height)} />;
  }
  if (!img) return <Rect name="page-bg" width={width} height={height} fill={themeColor("--surface-3")} />;
  const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  return <KImage name="page-bg" image={img} x={(width - w) / 2} y={(height - h) / 2} width={w} height={h} />;
}
