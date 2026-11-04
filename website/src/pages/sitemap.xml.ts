import type { APIRoute } from "astro";
import { createAdminClient } from "../lib/supabase";

export const prerender = false;

// Static marketing pages. Deliberately excludes auth-gated utility pages (dashboard, login,
// profile, settings) — there's nothing for a crawler to index there, and listing them would
// just invite Google to waste crawl budget on pages that redirect or vary per visitor.
const STATIC_PATHS = [
  "/",
  "/about",
  "/features",
  "/pricing",
  "/templates",
  "/contact",
  "/eshopy",
  "/commissionaire",
  "/employment",
  "/terms",
  "/privacy",
];

function xmlEscape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function urlEntry(loc: string, lastmod?: string | null): string {
  return `  <url><loc>${xmlEscape(loc)}</loc>${lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : ""}</url>`;
}

export const GET: APIRoute = async ({ url }) => {
  const origin = url.origin;
  const admin = createAdminClient();

  // Every tenant storefront is reachable at the shared /eshop-[slug] path regardless of any
  // custom domain it also has — a single sitemap rooted at this origin already covers it.
  // pending_approval parties are intentionally excluded: they're publicly viewable (preview
  // banner) but not yet reviewed, and Layout.astro already noindexes them as a second guard.
  const { data: parties } = await admin
    .from("parties")
    .select("id, slug, updated_at")
    .eq("status", "active");

  const entries: string[] = STATIC_PATHS.map((p) => urlEntry(`${origin}${p}`));

  for (const party of parties ?? []) {
    const base = `${origin}/eshop-${party.slug}`;
    entries.push(urlEntry(base, party.updated_at));

    const [{ data: products }, { data: posts }, { data: pages }] = await Promise.all([
      admin.from("products").select("slug, updated_at").eq("party_id", party.id).eq("status", "active").eq("is_visible", true),
      admin.from("blog_posts").select("slug, published_at").eq("party_id", party.id).eq("status", "published"),
      admin.from("content_pages").select("slug, updated_at").eq("party_id", party.id).eq("is_visible", true),
    ]);

    for (const product of products ?? []) entries.push(urlEntry(`${base}/${product.slug}`, product.updated_at));
    for (const post of posts ?? []) entries.push(urlEntry(`${base}/blog/${post.slug}`, post.published_at));
    for (const page of pages ?? []) entries.push(urlEntry(`${base}/stranka/${page.slug}`, page.updated_at));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=UTF-8",
      // Sitemaps don't need to be byte-fresh on every crawl — an hour of edge caching keeps a
      // crawl burst from hammering the DB with a per-party N+1 query fan-out.
      "Cache-Control": "public, max-age=3600",
    },
  });
};
