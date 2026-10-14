import { test, expect, type APIRequestContext } from "@playwright/test";

// Edge HTML cache (middleware.ts). The cache only exists on the Cloudflare Workers runtime, so
// these tests exercise a deployed target: run against a wrangler preview or production, e.g.
//   E2E_BASE_URL=https://mamtodoma.cz pnpm test:e2e 38-edge-cache
// Against plain `astro dev` (Node) caches.default is undefined and the whole suite self-skips.
const TARGET = process.env.E2E_BASE_URL ?? "http://localhost:4321";
const STOREFRONT_PATH = process.env.EDGE_TEST_PATH ?? "/eshop-repasado/airpods-pro-2";
const STOREFRONT_BASE = STOREFRONT_PATH.split("/").slice(0, 2).join("/"); // "/eshop-repasado"

async function cacheHeader(ctx: APIRequestContext, path: string, headers: Record<string, string> = {}) {
  const res = await ctx.get(`${TARGET}${path}`, { headers, maxRedirects: 0 });
  return { status: res.status(), edge: res.headers()["x-edge-cache"] ?? null, res };
}

test.describe("edge HTML cache", () => {
  test.beforeAll(async ({ playwright }) => {
    // Probe: if the target never emits x-edge-cache, the edge cache is inactive here — skip all.
    const ctx = await playwright.request.newContext();
    const probe = await cacheHeader(ctx, STOREFRONT_PATH);
    await ctx.dispose();
    test.skip(probe.edge === null, `edge cache not active on ${TARGET} (no x-edge-cache header)`);
  });

  test("anonymous storefront page is served from edge on repeat request (HIT)", async ({ playwright }) => {
    const ctx = await playwright.request.newContext(); // no cookies = anonymous
    await cacheHeader(ctx, STOREFRONT_PATH); // warm
    const second = await cacheHeader(ctx, STOREFRONT_PATH);
    expect(second.status).toBe(200);
    expect(second.edge).toBe("HIT");
    await ctx.dispose();
  });

  test("account path (/cart) is never edge-cached", async ({ playwright }) => {
    const ctx = await playwright.request.newContext();
    await cacheHeader(ctx, `${STOREFRONT_BASE}/cart`);
    const second = await cacheHeader(ctx, `${STOREFRONT_BASE}/cart`);
    expect(second.edge).not.toBe("HIT");
    await ctx.dispose();
  });

  test("api route is never edge-cached", async ({ playwright }) => {
    const ctx = await playwright.request.newContext();
    const first = await cacheHeader(ctx, "/api/cart-count?partyId=00000000-0000-0000-0000-000000000000");
    const second = await cacheHeader(ctx, "/api/cart-count?partyId=00000000-0000-0000-0000-000000000000");
    expect(second.edge).not.toBe("HIT");
    // endpoint answers with a JSON count regardless of identity
    const body = await second.res.json();
    expect(body).toHaveProperty("count");
    await ctx.dispose();
  });

  test("authenticated request bypasses the cache entirely", async ({ playwright }) => {
    const ctx = await playwright.request.newContext();
    // Warm the anonymous cache first so a HIT would be available if the gate were wrong.
    await cacheHeader(ctx, STOREFRONT_PATH);
    const authed = await cacheHeader(ctx, STOREFRONT_PATH, { cookie: "sb-probe-auth-token=dummy" });
    // A request carrying an auth cookie must not be served the shared anonymous copy.
    expect(authed.edge).not.toBe("HIT");
    await ctx.dispose();
  });
});
