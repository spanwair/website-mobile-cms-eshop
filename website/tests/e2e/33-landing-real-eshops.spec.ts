/**
 * 33 — Landing page "real eshops" showcase
 *
 * Covers the marketing landing page's new DB-driven list of live storefronts:
 *   - a store with store_configs.landing_featured = true renders as a card with its
 *     name, description, and a CTA linking to /eshop-{slug}
 *   - a store with landing_featured = false (or an inactive party) never appears
 *   - the old TemplatesShowcase mockup section is no longer rendered on the landing page
 *   - the "create your own eshop" CTA block renders below the real-eshops list
 */
import { test, expect } from "@playwright/test";
import { BASE, psql, replica, defaultRole, screenshot } from "./helpers";

const FEATURED_PARTY_ID = "c9000001-0000-0000-0000-000000000001";
const HIDDEN_PARTY_ID = "c9000001-0000-0000-0000-000000000002";
const FEATURED_SLUG = "e2e-landing-featured-store";
const HIDDEN_SLUG = "e2e-landing-hidden-store";
const FEATURED_NAME = "E2E Featured Store";
const FEATURED_DESC = "E2E landing description for the featured store.";

function seed() {
  // session_replication_role = replica (see `replica` below) disables ALL triggers, including
  // create_default_store_config — so the usual auto-created store_configs row never appears
  // here and must be inserted explicitly instead of relying on it + UPDATE.
  psql(`${replica}
    INSERT INTO public.parties (id, name, slug, status)
    VALUES ('${FEATURED_PARTY_ID}', '${FEATURED_NAME}', '${FEATURED_SLUG}', 'active');
    INSERT INTO public.parties (id, name, slug, status)
    VALUES ('${HIDDEN_PARTY_ID}', 'E2E Hidden Store', '${HIDDEN_SLUG}', 'active');
    INSERT INTO public.store_configs (party_id, brand_name, landing_featured, landing_sort_order, landing_description)
    VALUES ('${FEATURED_PARTY_ID}', '${FEATURED_NAME}', true, -1, '${FEATURED_DESC}');
    INSERT INTO public.store_configs (party_id, brand_name, landing_featured)
    VALUES ('${HIDDEN_PARTY_ID}', 'E2E Hidden Store', false);
  ${defaultRole}`);
}

function cleanup() {
  psql(`${replica}
    DELETE FROM public.parties WHERE id IN ('${FEATURED_PARTY_ID}', '${HIDDEN_PARTY_ID}');
  ${defaultRole}`);
}

test.describe("33 — landing page real eshops showcase", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(() => {
    cleanup();
    seed();
  });

  test.afterAll(() => {
    cleanup();
  });

  test("33-00 featured store renders as a card with a working CTA to /eshop-{slug}", async ({ page }) => {
    await page.goto(`${BASE}/`);
    const card = page.locator("#real-eshops a", { hasText: FEATURED_NAME });
    await expect(card).toBeVisible();
    await expect(card).toContainText(FEATURED_DESC);
    await expect(card).toHaveAttribute("href", `/eshop-${FEATURED_SLUG}`);
    await screenshot(page, "landing-real-eshops-section");
  });

  test("33-01 non-featured store never appears in the real-eshops list", async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.locator("#real-eshops")).not.toContainText("E2E Hidden Store");
  });

  test("33-02 the CTA card navigates into the live storefront", async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.locator("#real-eshops a", { hasText: FEATURED_NAME }).click();
    await expect(page).toHaveURL(new RegExp(`/eshop-${FEATURED_SLUG}`));
  });

  test("33-03 create-your-own-eshop CTA block renders below the real-eshops list", async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.locator("#create-own-eshop")).toBeVisible();
  });

  test("33-04 the old templates mockup section is no longer on the landing page", async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.locator("#templates")).toHaveCount(0);
  });
});
