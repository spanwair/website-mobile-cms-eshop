import { type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

export const BASE = "http://localhost:4321";

export const OWNER = { email: "owner@test.com", password: "Owner1234!" };
export const ADMIN = { email: "admin@test.com", password: "Admin1234!" };
export const USER = { email: "user@test.com", password: "User1234!" };
export const ESHOP = { email: "eshop@test.com", password: "Eshop1234!" };

export const OWNER_ID = "ffffffff-0000-0000-0000-000000000008";
export const ADMIN_ID = "27d68c79-fb83-43e4-83fa-b2d3a6f15c7f";
export const USER_ID = "6f9296bf-3073-4c85-a7b6-ec227ff1b758";
export const ESHOP_ID = "bf11ea77-6a24-4fc8-8487-882d6a48c8ba";

// Role for eshop_admin with only MANAGE_PRODUCTS permission (perm bit = 8)
export const LIMITED_ESHOP_ROLE_ID = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";
// Role with VIEW_DASHBOARD + MANAGE_PRODUCTS + MANAGE_CATEGORIES (1|8|16 = 25) — tests dashboard section gating
export const DASHBOARD_PROD_CAT_ROLE_ID = "dddddddd-dddd-dddd-dddd-dddddddddddd";

export const PARTY_ID = "11111111-1111-1111-1111-111111111111";
export const PARTY2_ID = "11111111-2222-2222-2222-111111111111";
export const CUSTOMER_ID = "22222222-2222-2222-2222-111111111111";
export const WAREHOUSE_ID = "33333333-3333-3333-3333-111111111111";
export const PRODUCT_ID = "44444444-4444-4444-4444-111111111111";
export const INVENTORY_ID = "55555555-5555-5555-5555-111111111111";
export const ORDER_ID = "66666666-6666-6666-6666-111111111111";
export const RULE_ID = "77777777-7777-7777-7777-111111111111";
export const COUPON_ID = "88888888-8888-8888-8888-111111111111";
export const NOTIF_ID = "99999999-9999-9999-9999-111111111111";
export const CATEGORY_ID = "aa111111-1111-1111-1111-111111111111";

let screenshotCounter = 0;
const SCREENSHOTS_DIR = path.join(process.cwd(), "tests", "screenshots");

export async function screenshot(page: Page, name: string) {
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  screenshotCounter++;
  const safe = name.replace(/[^a-z0-9-_]/gi, "_");
  const file = path.join(SCREENSHOTS_DIR, `${String(screenshotCounter).padStart(3, "0")}-${safe}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`[screenshot] ${file}`);
}

export async function login(page: Page) {
  await loginAs(page, ADMIN.email, ADMIN.password);
}

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState("networkidle");
  await page.fill("#si-email", email);
  await page.fill("#si-password", password);
  await screenshot(page, `login-fill-${email.split("@")[0]}`);
  await page.click("#signin-btn");
  await page.waitForURL(`${BASE}/dashboard`, { timeout: 20000 });
  await screenshot(page, `after-login-dashboard`);
}

export async function goAdmin(page: Page) {
  await page.goto(`${BASE}/admin`);
  await page.waitForLoadState("networkidle");
}
