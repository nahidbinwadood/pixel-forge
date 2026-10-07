import { type EditorDocument, migrate } from "@pixelforge/editor-core";
import { PLANS } from "@pixelforge/shared";
import { prisma } from "./index";

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

  for (const family of ["Inter", "Poppins", "Playfair Display", "Bebas Neue", "Caveat"]) {
    await prisma.font.upsert({
      where: { family },
      update: {},
      create: { family, source: "google", weights: [400, 700], license: "OFL-1.1" },
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

  const doc: EditorDocument = migrate({
    schemaVersion: 1,
    pages: [
      {
        id: "p1",
        width: 1080,
        height: 1080,
        background: {
          type: "linear",
          angle: 135,
          stops: [
            { offset: 0, color: "#ff6a3d" },
            { offset: 1, color: "#1b1b1f" },
          ],
        },
        nodes: [
          {
            id: "t1",
            type: "text",
            x: 90,
            y: 420,
            width: 900,
            height: 160,
            text: "Summer Sale",
            fontFamily: "Bebas Neue",
            fontSize: 160,
            align: "center",
            fill: { type: "solid", color: "#ffffff" },
          },
        ],
      },
    ],
  });
  const social = await prisma.templateCategory.findUniqueOrThrow({ where: { slug: "social-media" } });
  await prisma.template.upsert({
    where: { slug: "summer-sale-post" },
    update: {},
    create: {
      slug: "summer-sale-post",
      title: "Summer Sale Post",
      categoryId: social.id,
      width: 1080,
      height: 1080,
      sizePreset: "instagram_post",
      style: ["bold"],
      colors: ["#ff6a3d", "#1b1b1f"],
      tags: ["sale", "summer"],
      document: doc,
      schemaVersion: doc.schemaVersion,
      publishedAt: new Date(),
      createdById: admin.id,
    },
  });

  // biome-ignore lint/suspicious/noConsole: CLI script output
  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
