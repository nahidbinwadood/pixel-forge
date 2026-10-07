import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { type EditorDocument, migrate } from "@pixelforge/editor-core";
import { PLANS } from "@pixelforge/shared";
import { prisma } from "./index";
import { buildStickers, buildTemplates, FONTS, HERO_PHOTOS, presetSize } from "./seed-content";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HERO_DIR = resolve(__dirname, "../../../apps/web/public/hero");

// Minimal, standalone S3 client for seed-time uploads only (packages/db can't import apps/web's
// server-only lib/storage.ts). Same SeaweedFS/R2-safe checksum settings as apps/web (ASSUMPTIONS D20).
const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION ?? "auto",
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  },
});
const PUBLIC_BUCKET = process.env.S3_BUCKET_PUBLIC ?? "pixelforge-public";

async function putPublic(key: string, body: Buffer, contentType: string) {
  await s3.send(new PutObjectCommand({ Bucket: PUBLIC_BUCKET, Key: key, Body: body, ContentType: contentType }));
}

/** Recompute the search_vector column for one template ($executeRaw — Prisma Client can't write `Unsupported` fields). */
async function refreshSearchVector(id: string) {
  await prisma.$executeRaw`
    UPDATE "Template" SET "searchVector" =
      setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
      setweight(to_tsvector('english', array_to_string(tags, ' ')), 'C') ||
      setweight(to_tsvector('english', array_to_string(style, ' ')), 'C')
    WHERE id = ${id}
  `;
}

// Idempotent: safe to run repeatedly. Users with passwords are created via the app's sign-up (Better Auth hashes).
async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@pixelforge.local" },
    update: {},
    create: {
      email: "admin@pixelforge.local",
      name: "Admin",
      role: "admin",
      emailVerified: true,
      subscription: { create: { planId: "pro" } },
      memberships: { create: { role: "owner", workspace: { create: { name: "Admin" } } } },
    },
  });
  await prisma.creditLedger.upsert({
    where: { dedupeKey: `seed-grant:${admin.id}` },
    update: {},
    create: {
      userId: admin.id,
      delta: PLANS.pro.monthlyCredits,
      reason: "admin_grant",
      dedupeKey: `seed-grant:${admin.id}`,
    },
  });

  const categories = [
    ["social-media", "Social media"],
    ["business", "Business"],
    ["marketing", "Marketing"],
    ["events", "Events"],
    ["education", "Education"],
    ["ecommerce", "E-commerce"],
  ] as const;
  for (const [i, [slug, name]] of categories.entries()) {
    await prisma.templateCategory.upsert({
      where: { slug },
      update: { name, sortOrder: i },
      create: { slug, name, sortOrder: i },
    });
  }
  const categoryIds = new Map<string, string>(
    await Promise.all(
      categories.map(
        async ([slug]) =>
          [slug, (await prisma.templateCategory.findUniqueOrThrow({ where: { slug } })).id] as [string, string],
      ),
    ),
  );
  function categoryId(slug: string): string {
    const id = categoryIds.get(slug);
    if (!id) throw new Error(`unknown template category ${slug}`);
    return id;
  }

  for (const font of FONTS) {
    await prisma.font.upsert({
      where: { family: font.family },
      update: { weights: font.weights, license: font.license },
      create: { family: font.family, source: "google", weights: font.weights, license: font.license },
    });
  }

  const flags = [
    ["ai.bg_remove", true],
    ["ai.text_to_image", true],
    ["ai.write", true],
    ["editor.pdf_export", false],
  ] as const;
  for (const [key, enabled] of flags) {
    await prisma.featureFlag.upsert({ where: { key }, update: {}, create: { key, enabled } });
  }

  // ---------- Global stock photos (hero images, re-used from marketing — docs/design/ASSETS.md) ----------
  const heroAssetIds: Record<string, string> = {};
  for (const photo of HERO_PHOTOS) {
    const storageKey = `stock/hero/${photo.name}.webp`;
    let body: Buffer | null = null;
    try {
      body = readFileSync(resolve(HERO_DIR, photo.file));
    } catch {
      console.warn(`seed: missing ${photo.file}, skipping (templates referencing it fall back to a solid fill)`);
    }
    const asset = await prisma.asset.upsert({
      where: { storageKey },
      update: {},
      create: {
        workspaceId: null,
        ownerId: null,
        kind: "stock",
        status: "ready",
        storageKey,
        mimeType: "image/webp",
        bytes: body?.length ?? 0,
        width: photo.width,
        height: photo.height,
        tags: [...photo.tags],
        license: { source: "unsplash", url: photo.url, license: "Unsplash License", commercialUse: true },
      },
    });
    heroAssetIds[photo.name] = asset.id;
    if (body) await putPublic(storageKey, body, "image/webp");
  }

  // ---------- Stickers (original parametric SVGs — see seed-content.ts) ----------
  for (const sticker of buildStickers()) {
    const storageKey = `stickers/${sticker.slug}.svg`;
    const body = Buffer.from(sticker.svg, "utf8");
    await prisma.asset.upsert({
      where: { storageKey },
      update: {},
      create: {
        workspaceId: null,
        ownerId: null,
        kind: "sticker",
        status: "ready",
        storageKey,
        mimeType: "image/svg+xml",
        bytes: body.length,
        tags: sticker.tags,
        license: { source: "self", author: "PixelForge", license: "CC0-1.0", commercialUse: true },
      },
    });
    await putPublic(storageKey, body, "image/svg+xml");
  }

  // ---------- Templates ----------
  const templateSpecs = buildTemplates(heroAssetIds);
  for (const spec of templateSpecs) {
    const { width, height } = presetSize(spec.sizePreset);
    const doc: EditorDocument = migrate({
      schemaVersion: 1,
      pages: [{ id: "p1", width, height, background: spec.background, nodes: spec.nodes }],
    });
    const template = await prisma.template.upsert({
      where: { slug: spec.slug },
      update: {
        title: spec.title,
        description: spec.description,
        categoryId: categoryId(spec.category),
        width,
        height,
        sizePreset: spec.sizePreset,
        style: spec.style,
        colors: spec.colors,
        tags: spec.tags,
        premium: spec.premium,
        document: doc,
        schemaVersion: doc.schemaVersion,
        publishedAt: spec.published ? new Date() : null,
      },
      create: {
        slug: spec.slug,
        title: spec.title,
        description: spec.description,
        categoryId: categoryId(spec.category),
        width,
        height,
        sizePreset: spec.sizePreset,
        style: spec.style,
        colors: spec.colors,
        tags: spec.tags,
        premium: spec.premium,
        document: doc,
        schemaVersion: doc.schemaVersion,
        publishedAt: spec.published ? new Date() : null,
        createdById: admin.id,
      },
    });
    await refreshSearchVector(template.id);
  }

  // biome-ignore lint/suspicious/noConsole: CLI script output
  console.log(
    `Seed complete: ${categories.length} categories, ${FONTS.length} fonts, ${templateSpecs.length} templates`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
