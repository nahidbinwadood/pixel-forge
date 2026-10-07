import { route } from "@/lib/api";
import { listTemplateCategories } from "@/lib/templates";

export const GET = route(async () => {
  const categories = await listTemplateCategories();
  return Response.json({ items: categories.map((c) => ({ slug: c.slug, name: c.name })) });
});
