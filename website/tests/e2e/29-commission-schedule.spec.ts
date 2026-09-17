import { test, expect } from "@playwright/test";
import { loginAs, OWNER, PARTY_ID, psql, BASE } from "./helpers";

// psql() returns the full formatted table; wrap the value in a sentinel so we can parse it
// regardless of column formatting. Returns "NULL" when the override is cleared.
function readRateOverride(): string {
  const out = psql(
    `SELECT 'RATE=' || COALESCE(commission_rate_override::text, 'NULL') FROM parties WHERE id = '${PARTY_ID}';`,
  );
  const m = out.match(/RATE=(\S+)/);
  return m ? m[1] : "";
}

// Per-party commission-schedule editor on /admin/parties/[id] (MANAGE_AUDIT-gated).
// Verifies the override round-trips through the DB and that clearing a field falls back
// to the platform default. PARTY_ID ("Test Organisation") is own_company, so the card renders.
test.describe("29 commission schedule overrides", () => {
  test.beforeEach(() => {
    psql(
      `UPDATE parties SET commission_rate_override = NULL, reduced_commission_rate_override = NULL, commission_threshold_override = NULL WHERE id = '${PARTY_ID}';`,
    );
  });

  test.afterAll(() => {
    psql(
      `UPDATE parties SET commission_rate_override = NULL, reduced_commission_rate_override = NULL, commission_threshold_override = NULL WHERE id = '${PARTY_ID}';`,
    );
  });

  test("29-01 owner sets a custom standard rate and it persists to the DB", async ({ page }) => {
    await loginAs(page, OWNER.email, OWNER.password);
    await page.goto(`${BASE}/admin/parties/${PARTY_ID}`);
    await page.waitForLoadState("networkidle");

    const rateInput = page.locator("#commission_rate_pct");
    await expect(rateInput).toBeVisible();
    // Blank while no override is set — placeholder carries the platform default.
    await expect(rateInput).toHaveValue("");

    await rateInput.fill("8");
    await page.locator("form:has(#commission_rate_pct) button[type=submit]").click();
    await page.waitForLoadState("networkidle");

    expect(readRateOverride()).toBe("0.0800");

    // Reload: the stored override is shown back as a percentage.
    await page.goto(`${BASE}/admin/parties/${PARTY_ID}`);
    await expect(page.locator("#commission_rate_pct")).toHaveValue("8");
  });

  test("29-02 clearing the field removes the override (falls back to default)", async ({ page }) => {
    psql(
      `UPDATE parties SET commission_rate_override = 0.08 WHERE id = '${PARTY_ID}';`,
    );
    await loginAs(page, OWNER.email, OWNER.password);
    await page.goto(`${BASE}/admin/parties/${PARTY_ID}`);
    await page.waitForLoadState("networkidle");

    await expect(page.locator("#commission_rate_pct")).toHaveValue("8");
    await page.locator("#commission_rate_pct").fill("");
    await page.locator("form:has(#commission_rate_pct) button[type=submit]").click();
    await page.waitForLoadState("networkidle");

    expect(readRateOverride()).toBe("NULL");
  });
});
