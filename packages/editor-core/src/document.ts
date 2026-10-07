import { z } from "zod";

/**
 * Editor document model — the JSON stored in Project.document.
 * Non-destructive: source images are never modified; edits live here as data.
 * Layers are a FLAT list per page in z-order (index 0 = bottom). Grouping is via `groupId`
 * pointing at a `group` node — no recursion, so reorder/undo stay simple array ops.
 */
export const CURRENT_SCHEMA_VERSION = 1;

const id = z.string().min(1).max(64);
const color = z.string().regex(/^#[0-9a-f]{6}([0-9a-f]{2})?$/i, "hex color");

export const Fill = z.discriminatedUnion("type", [
  z.object({ type: z.literal("solid"), color }),
  z.object({
    type: z.literal("linear"),
    angle: z.number(),
    stops: z.array(z.object({ offset: z.number().min(0).max(1), color })).min(2),
  }),
]);

/** Photo adjustments. 0 = neutral; ranges are UI ranges, renderer maps them to filter params. */
export const Adjustments = z
  .object({
    brightness: z.number().min(-100).max(100),
    contrast: z.number().min(-100).max(100),
    saturation: z.number().min(-100).max(100),
    exposure: z.number().min(-100).max(100),
    highlights: z.number().min(-100).max(100),
    shadows: z.number().min(-100).max(100),
    temperature: z.number().min(-100).max(100),
    tint: z.number().min(-100).max(100),
    vibrance: z.number().min(-100).max(100),
    sharpness: z.number().min(0).max(100),
    blur: z.number().min(0).max(100),
    vignette: z.number().min(0).max(100),
    grain: z.number().min(0).max(100),
  })
  .partial();

const base = {
  id,
  name: z.string().max(120).optional(),
  groupId: id.optional(),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  rotation: z.number().default(0),
  flipX: z.boolean().default(false),
  flipY: z.boolean().default(false),
  opacity: z.number().min(0).max(1).default(1),
  // MVP blend set; full Photoshop-style list is V2.
  blendMode: z.enum(["normal", "multiply", "screen", "overlay"]).default("normal"),
  locked: z.boolean().default(false),
  hidden: z.boolean().default(false),
};

export const ImageNode = z.object({
  ...base,
  type: z.literal("image"),
  assetId: id,
  crop: z
    .object({ x: z.number(), y: z.number(), width: z.number().positive(), height: z.number().positive() })
    .optional(),
  adjustments: Adjustments.default({}),
  filter: z.object({ presetId: id, intensity: z.number().min(0).max(1) }).optional(),
});

export const TextNode = z.object({
  ...base,
  type: z.literal("text"),
  text: z.string().max(10_000),
  fontFamily: z.string(),
  fontSize: z.number().positive(),
  fontWeight: z.number().int().min(100).max(900).default(400),
  fill: Fill,
  align: z.enum(["left", "center", "right"]).default("left"),
  letterSpacing: z.number().default(0),
  lineHeight: z.number().positive().default(1.2),
  stroke: z.object({ color, width: z.number().min(0) }).optional(),
  shadow: z.object({ color, blur: z.number().min(0), offsetX: z.number(), offsetY: z.number() }).optional(),
});

export const ShapeNode = z.object({
  ...base,
  type: z.literal("shape"),
  shape: z.enum(["rect", "ellipse", "triangle", "line", "star", "polygon"]),
  fill: Fill.optional(),
  stroke: z.object({ color, width: z.number().min(0) }).optional(),
  cornerRadius: z.number().min(0).default(0),
});

export const StickerNode = z.object({ ...base, type: z.literal("sticker"), stickerId: id });

export const GroupNode = z.object({ ...base, type: z.literal("group") });

export const Node = z.discriminatedUnion("type", [ImageNode, TextNode, ShapeNode, StickerNode, GroupNode]);

export const Page = z.object({
  id,
  width: z.number().int().positive().max(16_384),
  height: z.number().int().positive().max(16_384),
  background: z.union([Fill, z.object({ type: z.literal("image"), assetId: id })]),
  nodes: z.array(Node).max(2_000),
});

export const EditorDocument = z.object({
  schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
  pages: z.array(Page).min(1).max(100),
});

export type EditorDocument = z.infer<typeof EditorDocument>;
export type Page = z.infer<typeof Page>;
export type Node = z.infer<typeof Node>;
