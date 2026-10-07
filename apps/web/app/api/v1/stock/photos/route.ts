import { z } from "zod";
import { ApiError, requireUser, route } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

const Query = z.object({
  q: z.string().trim().min(1).max(100),
  page: z.coerce.number().int().min(1).max(50).default(1),
});

interface UnsplashPhoto {
  id: string;
  width: number;
  height: number;
  color: string;
  alt_description: string | null;
  urls: { small: string; regular: string };
  user: { name: string; links: { html: string } };
  links: { html: string };
}

/**
 * Proxies Unsplash search (ASSUMPTIONS: stock content via Unsplash/Pexels APIs, attribution stored
 * per asset). No `UNSPLASH_ACCESS_KEY` configured -> honest 503, never fake results (AUDIT §5).
 */
export const GET = route(async (req) => {
  const user = await requireUser();
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) {
    throw new ApiError(503, "NOT_CONFIGURED", "Stock photo search isn't configured on this server yet");
  }
  await rateLimit(`stock-photos:${user.id}`, 30, 60);
  const { q, page } = Query.parse(Object.fromEntries(new URL(req.url).searchParams));

  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&page=${page}&per_page=24`,
    { headers: { Authorization: `Client-ID ${key}` } },
  );
  if (!res.ok) throw new ApiError(502, "UPSTREAM_ERROR", "Unsplash search failed");
  const data = (await res.json()) as { results: UnsplashPhoto[]; total_pages: number };

  return Response.json({
    items: data.results.map((p) => ({
      id: p.id,
      width: p.width,
      height: p.height,
      color: p.color,
      alt: p.alt_description,
      thumbUrl: p.urls.small,
      fullUrl: p.urls.regular,
      license: { source: "unsplash", author: p.user.name, url: p.links.html, commercialUse: true },
    })),
    nextPage: page < data.total_pages ? page + 1 : null,
  });
});
