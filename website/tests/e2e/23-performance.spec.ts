import { test, expect, type Page } from "@playwright/test";
import { BASE, USER, loginAs, capturePerf } from "./helpers";

// Budgets are generous on purpose — this is an SSR dev server on shared CI/sandbox hardware,
// not a production CDN. The point is to catch real regressions (a page suddenly 5x slower,
// a page pulling in megabytes it shouldn't), not to chase production-grade numbers here.
const BUDGET = {
  ttfbMs: 2500,
  loadEventMs: 6000,
  maxTransferBytes: 6 * 1024 * 1024,
  maxResourceCount: 80,
};

const PAGES = [
  { name: "shop listing", path: "/shop" },
  { name: "product detail", path: "/shop/seed-product" },
  { name: "cart", path: "/shop/cart" },
  { name: "checkout", path: "/shop/checkout" },
];

test.describe("23 — Performance: navigation timing + resource budgets", () => {
  test.describe.configure({ mode: "serial" });
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAs(page, USER.email, USER.password);
  });

  test.afterAll(async () => {
    await page.close();
  });

  for (const { name, path } of PAGES) {
    test(`23-perf ${name} (${path}) stays within timing + weight budget`, async () => {
      await page.goto(`${BASE}${path}`, { waitUntil: "load" });
      const perf = await capturePerf(page);
      // eslint-disable-next-line no-console
      console.log(`[perf] ${name}:`, JSON.stringify(perf));

      expect(perf.ttfb, `${name}: TTFB`).toBeLessThan(BUDGET.ttfbMs);
      expect(perf.loadEvent, `${name}: full load event`).toBeLessThan(BUDGET.loadEventMs);
      expect(perf.transferSize, `${name}: total transfer size`).toBeLessThan(BUDGET.maxTransferBytes);
      expect(perf.resourceCount, `${name}: resource (request) count`).toBeLessThan(BUDGET.maxResourceCount);
    });
  }

  test("23-perf-concurrent 8 parallel visitors browsing the shop stay within a shared latency budget", async ({ browser }) => {
    const CONCURRENCY = 8;
    const contexts = await Promise.all(Array.from({ length: CONCURRENCY }, () => browser.newContext()));
    const pages = await Promise.all(contexts.map((c) => c.newPage()));

    const start = Date.now();
    const timings = await Promise.all(
      pages.map(async (p) => {
        const t0 = Date.now();
        await p.goto(`${BASE}/shop`, { waitUntil: "load" });
        return Date.now() - t0;
      })
    );
    const wallClock = Date.now() - start;
    const avg = timings.reduce((a, b) => a + b, 0) / timings.length;
    const max = Math.max(...timings);
    // eslint-disable-next-line no-console
    console.log(`[perf] concurrent x${CONCURRENCY}: avg=${avg.toFixed(0)}ms max=${max}ms wallClock=${wallClock}ms`);

    await Promise.all(contexts.map((c) => c.close()));

    // Under N concurrent SSR requests hitting the same DB-backed page, no single visitor
    // should degrade catastrophically relative to the single-page budget above.
    expect(avg, "average concurrent load time").toBeLessThan(BUDGET.loadEventMs);
    expect(max, "worst-case concurrent load time").toBeLessThan(BUDGET.loadEventMs * 1.5);
  });
});
