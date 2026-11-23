import { test, expect } from "@playwright/test";
import { loginAs, OWNER, ADMIN, PARTY_ID, psql, BASE } from "./helpers";

// psql() returns the full formatted table; wrap the value in a sentinel so we can parse it
// regardless of column formatting. Returns "NULL" when the override is cleared.
function readTiersOverride(): string {
  const out = psql(
    `SELECT 'TIERS=' || COALESCE(commission_tiers_override::text, 'NULL') FROM parties WHERE id = '${PARTY_ID}';`,
  );
  const m = out.match(/TIERS=(.*)$/m);
  return m ? m[1].trim() : "";
}

// Per-party commission-tier editor on /admin/parties/[id] (MANAGE_AUDIT-gated), rendered by
// website/src/components/admin/CommissionTierEditor.astro. Verifies the override round-trips
// through the DB as a JSONB tier array and that resetting falls back to the platform default.
// PARTY_ID ("Test Organisation") is own_company, so the card renders.
test.describe("29 commission schedule overrides", () => {
  test.beforeEach(() => {
    psql(`UPDATE parties SET commission_tiers_override = NULL WHERE id = '${PARTY_ID}';`);
  });

  test.afterAll(() => {
    psql(`UPDATE parties SET commission_tiers_override = NULL WHERE id = '${PARTY_ID}';`);
  });

  test("29-01 owner edits the first band's rate and it persists as a tier array", async ({ page }) => {
    await loginAs(page, OWNER.email, OWNER.password);
    await page.goto(`${BASE}/admin/parties/${PARTY_ID}`);
    await page.waitForLoadState("networkidle");

    const firstRateInput = page.locator("[data-tier-rows] [data-tier-row] input[name=tier_rate]").first();
    await expect(firstRateInput).toBeVisible();
    await expect(firstRateInput).toHaveValue("1.99");

    await firstRateInput.fill("8");
    await page.locator("[data-tier-form] button[type=submit]").click();
    await page.waitForLoadState("networkidle");

    const stored = JSON.parse(readTiersOverride());
    expect(stored[0].rate).toBeCloseTo(0.08, 4);
    expect(stored[stored.length - 1].uptoKc).toBeNull();

    // Reload: the stored override is shown back, and the "custom" badge now renders.
    await page.goto(`${BASE}/admin/parties/${PARTY_ID}`);
    await expect(page.locator("[data-tier-rows] [data-tier-row] input[name=tier_rate]").first()).toHaveValue("8");
    await expect(page.locator(".tier-source-badge--custom")).toBeVisible();
  });

  test("29-02 adding a band submits an extra tier", async ({ page }) => {
    await loginAs(page, OWNER.email, OWNER.password);
    await page.goto(`${BASE}/admin/parties/${PARTY_ID}`);
    await page.waitForLoadState("networkidle");

    const rateCountBefore = await page.locator("[data-tier-form] input[name=tier_rate]").count();
    await page.locator("[data-tier-add]").click();
    await expect(page.locator("[data-tier-form] input[name=tier_rate]")).toHaveCount(rateCountBefore + 1);

    const rows = page.locator("[data-tier-rows] [data-tier-row]");
    const newRow = rows.last();
    await newRow.locator("input[name=tier_rate]").fill("2.5");
    await newRow.locator("input[name=tier_upto]").fill("120000");
    await page.locator("[data-tier-form] button[type=submit]").click();
    await page.waitForLoadState("networkidle");

    const stored = JSON.parse(readTiersOverride());
    expect(stored.length).toBe(rateCountBefore + 1);
    expect(stored.some((t: { uptoKc: number | null }) => t.uptoKc === 120000)).toBe(true);
  });

  test("29-03 resetting removes the override (falls back to the platform default)", async ({ page }) => {
    psql(
      `UPDATE parties SET commission_tiers_override = '[{"uptoKc": null, "rate": 0.08}]'::jsonb WHERE id = '${PARTY_ID}';`,
    );
    await loginAs(page, OWNER.email, OWNER.password);
    await page.goto(`${BASE}/admin/parties/${PARTY_ID}`);
    await page.waitForLoadState("networkidle");

    await expect(page.locator(".tier-source-badge--custom")).toBeVisible();
    await page.getByRole("button", { name: /platform default|výchozí sazbu platformy/i }).click();
    await page.waitForLoadState("networkidle");

    expect(readTiersOverride()).toBe("NULL");
  });

  // Owner-only, deliberately narrower than MANAGE_AUDIT -- an Admin assigned to this party (who
  // does hold MANAGE_AUDIT here, same as the Organization info / Seller Mode cards they CAN see
  // and edit) must still never see or change the platform's commission schedule.
  test("29-04 a non-owner Admin cannot see or submit the commission schedule", async ({ page }) => {
    await loginAs(page, ADMIN.email, ADMIN.password);
    await page.goto(`${BASE}/admin/parties/${PARTY_ID}`);
    await page.waitForLoadState("networkidle");

    // The Admin still sees the rest of the party-settings column (proves they're not just
    // redirected away entirely) -- only this one card is missing.
    await expect(page.getByRole("heading", { name: "Informace o organizaci" })).toBeVisible();
    await expect(page.locator("[data-tier-form]")).toHaveCount(0);

    // Defense in depth: a crafted raw POST (bypassing the UI entirely) must also be rejected
    // server-side, not just hidden client-side.
    const before = readTiersOverride();
    await page.request.post(`${BASE}/admin/parties/${PARTY_ID}`, {
      headers: { "content-type": "application/x-www-form-urlencoded" },
      data: "action=update_fee_schedule&tier_rate=1&tier_rate=1&tier_rate=1&tier_rate=1&tier_rate=1&tier_upto=10000&tier_upto=30000&tier_upto=60000&tier_upto=90000",
    });
    expect(readTiersOverride()).toBe(before);
  });
});
