# PPL shipment actions v seznamu objednávek + náhled štítku — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add inline PPL/Packeta shipment actions (create/refresh/cancel + tracking number) directly to the `/admin/orders` list, and replace the raw label download link with a visual PDF preview page — both reusing the existing, already-functional carrier layer.

**Architecture:** No new business logic or DB schema. Reuse `website/src/lib/shipmentActions.ts` (`createShipmentForOrder`, `refreshShipmentStatus`, `cancelShipmentForOrder`) from a new POST handler in the orders list page, and reuse the existing `/api/shipping-label/[orderId]` signed-URL endpoint inside a new `<iframe>`-based preview page.

**Tech Stack:** Astro SSR (server-rendered, POST-form interactions, no client JS framework), Supabase (Postgres + Storage), Playwright E2E tests.

## Global Constraints

- **Sandbox only.** Never modify `.env.production` / `.env.production.example`. Never point any code at the production PPL base URL. All verification happens against `.env.development` (`PPL_API_BASE_URL=https://api-sandbox.dhl.com/ecs/ppl/sandbox`) and the mock provider fallback in `website/src/lib/integrations/shipping/index.ts`.
- **No new migrations.** `order_shipments` already has every column needed (`provider_shipment_id`, `tracking_number`, `label_storage_path`, `is_mock`, `error_message`).
- **Permissions:** every page/action stays gated by `PERMISSIONS.MANAGE_ORDERS` (32) from `shared/constants/permissions.ts` — never a raw integer, never a new bit.
- **Interaction pattern:** plain server-rendered `<form method="POST">` per action, matching the existing pattern in `website/src/pages/admin/orders/[id].astro` — no new client-side JS.
- **i18n:** every new user-facing string gets a key in both `shared/i18n/locales/cs.ts` and `shared/i18n/locales/en.ts`. Delete keys that become unused as part of the same task that orphans them.
- No em dash (`—`) in code comments or commit messages — use a plain dash.

---

## Task 1: Fix the pre-existing broken shipment E2E tests (unrelated bug, blocks trustworthy verification later)

While auditing the current shipment flow, running `website/tests/e2e/31-shipping-providers.spec.ts` showed test `31-04` genuinely failing today, which — because the suite runs `mode: "serial"` — silently skips 6 downstream tests (`31-05`..`31-10`). Root cause: `createShipmentForOrder` (the real carrier booking call) is only ever invoked from the admin order-detail page's `create_shipment` action. Checkout (`website/src/pages/shop/checkout.astro`) only inserts a `pending` placeholder row via `createShipmentRecord`. The test wrongly asserted that tracking number/label/TEST MODE badge appear immediately after checkout. This is the correct, intended behavior (matches the product requirement that shipment booking happens later, when an admin processes the order) — the test is what's wrong, not the code.

This must be fixed first so later tasks can trust `pnpm test:e2e -- 31-shipping-providers` as a real signal.

**Files:**
- Modify: `website/tests/e2e/31-shipping-providers.spec.ts:136-243` (tests `31-04` through `31-10`, replaced/renumbered/extended as `31-04` through `31-12`)

**Interfaces:**
- Consumes: existing helpers `psql`, `screenshot`, `loginAs`, `BASE`, `USER`, `OWNER`, `PARTY_ID` from `./helpers` (unchanged); describe-scope vars `pplOrderNumber`, `packetaOrderNumber`, `ownerPage`, `buyerPage` (unchanged).
- Produces: nothing new consumed by other tasks — this task only repairs test accuracy.

- [ ] **Step 1: Run the suite to confirm the current failure**

Run: `cd website && npx playwright test tests/e2e/31-shipping-providers.spec.ts --reporter=list`
Expected: test `31-04` FAILS on the "TESTOVACÍ REŽIM"/"TEST MODE" visibility assertion; tests `31-05`-`31-10` show as "did not run".

- [ ] **Step 2: Replace test 31-04's post-checkout assertions**

In `website/tests/e2e/31-shipping-providers.spec.ts`, replace the tail of the `"31-04 PPL pickup-point checkout..."` test (from `await buyerPage.locator("form.address-form button[type='submit']").click();` to the closing `});`) with:

```typescript
    await buyerPage.locator("form.address-form button[type='submit']").click();

    await payWithTestCard(buyerPage);
    await screenshot(buyerPage, "31-04-order-confirmation");

    const url = new URL(buyerPage.url());
    pplOrderNumber = url.searchParams.get("order") ?? "";
    expect(pplOrderNumber).toMatch(/^ORD-/);

    // Checkout only inserts the order_shipments "pending" placeholder (provider + pickup
    // point) - the real PPL booking (tracking number, label) happens later when an admin
    // processes the order, so neither should be visible on confirmation yet.
    await expect(buyerPage.locator(".shipment-info")).not.toBeVisible();
  });
```

- [ ] **Step 3: Insert a new test 31-06 that books the PPL shipment as admin, and renumber the old 31-06/31-07 to 31-07/31-08**

Replace the two tests `"31-06 label download link returns a real PDF"` and `"31-07 admin order detail shows the shipment card..."` (lines directly after the `"31-05 PPL order total..."` test, through the closing `});` of the old 31-07) with these three tests, in this order:

```typescript
  test("31-06 admin books the PPL shipment from the order detail page", async () => {
    const orderIdResult = psql(`SELECT id FROM public.orders WHERE order_number = '${pplOrderNumber}';`);
    const orderId = orderIdResult.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)?.[0];
    expect(orderId).toBeTruthy();

    await ownerPage.goto(`${BASE}/admin/orders/${orderId}`);
    await ownerPage.waitForLoadState("networkidle");
    await ownerPage.locator('form:has(input[value="create_shipment"]) button[type="submit"]').click();
    await ownerPage.waitForLoadState("networkidle");
    await screenshot(ownerPage, "31-06-admin-created-shipment");

    await expect(ownerPage.locator(".alert-error")).not.toBeVisible();
    await expect(ownerPage.getByText("PPL", { exact: true })).toBeVisible();
    await expect(ownerPage.getByText("TESTOVACÍ REŽIM").or(ownerPage.getByText("TEST MODE"))).toBeVisible();
    await expect(ownerPage.getByRole("link", { name: /Stáhnout štítek|Download label|Náhled štítku|Preview label/ })).toBeVisible();
  });

  test("31-07 label download link returns a real PDF", async () => {
    const orderIdResult = psql(`SELECT id FROM public.orders WHERE order_number = '${pplOrderNumber}';`);
    const orderId = orderIdResult.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)?.[0];
    expect(orderId).toBeTruthy();

    const resp = await buyerPage.context().request.get(`${BASE}/api/shipping-label/${orderId}`);
    expect(resp.status(), await resp.text().catch(() => "")).toBe(200);
    expect(resp.headers()["content-type"]).toContain("application/pdf");
  });

  test("31-08 admin can refresh the PPL shipment status without error", async () => {
    const orderIdResult = psql(`SELECT id FROM public.orders WHERE order_number = '${pplOrderNumber}';`);
    const orderId = orderIdResult.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)?.[0];

    await ownerPage.goto(`${BASE}/admin/orders/${orderId}`);
    await ownerPage.waitForLoadState("networkidle");

    // Refresh status must not error even though the mock provider has no real tracking API.
    await ownerPage.locator('form:has(input[value="refresh_shipment"]) button[type="submit"]').click();
    await ownerPage.waitForLoadState("networkidle");
    await screenshot(ownerPage, "31-08-admin-refresh-shipment");
    await expect(ownerPage.locator(".alert-error")).not.toBeVisible();
  });
```

- [ ] **Step 4: Renumber the orders-list badge test to 31-09**

Rename `"31-08 orders list shows a provider/status badge for the shipped order"` to `"31-09 orders list shows a provider/status badge for the shipped order"` (title text only, body unchanged, update the screenshot label to `"31-09-orders-list-badge"`).

- [ ] **Step 5: Fix and renumber the Packeta checkout test to 31-10**

Rename `"31-09 Packeta home-delivery checkout..."` to `"31-10 Packeta home-delivery checkout..."` and replace its tail (from `await payWithTestCard(buyerPage);` to the closing `});`) with:

```typescript
    await payWithTestCard(buyerPage);
    await screenshot(buyerPage, "31-10-packeta-home-confirmation");

    const url = new URL(buyerPage.url());
    packetaOrderNumber = url.searchParams.get("order") ?? "";
    expect(packetaOrderNumber).toMatch(/^ORD-/);
    // Same as PPL - checkout only records the pending placeholder, the real Packeta booking
    // (and its Z-prefixed tracking number) only exists after an admin creates the shipment.
    await expect(buyerPage.locator(".shipment-info")).not.toBeVisible();
  });
```

- [ ] **Step 6: Insert a new test 31-11 that books the Packeta shipment as admin, before the final DB-row test**

Insert this test directly after the (now renumbered) `31-10` test, before the last test in the file:

```typescript
  test("31-11 admin books the Packeta shipment from the order detail page", async () => {
    const orderIdResult = psql(`SELECT id FROM public.orders WHERE order_number = '${packetaOrderNumber}';`);
    const orderId = orderIdResult.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)?.[0];
    expect(orderId).toBeTruthy();

    await ownerPage.goto(`${BASE}/admin/orders/${orderId}`);
    await ownerPage.waitForLoadState("networkidle");
    await ownerPage.locator('form:has(input[value="create_shipment"]) button[type="submit"]').click();
    await ownerPage.waitForLoadState("networkidle");
    await screenshot(ownerPage, "31-11-admin-created-packeta-shipment");

    await expect(ownerPage.locator(".alert-error")).not.toBeVisible();
    await expect(ownerPage.locator("text=/Sledovací číslo: Z|Tracking number: Z/")).toBeVisible();
  });
```

- [ ] **Step 7: Renumber the final DB-row test to 31-12**

Rename `"31-10 Packeta shipment row has no pickup point recorded (home delivery)"` to `"31-12 Packeta shipment row has no pickup point recorded (home delivery)"` (title only, body unchanged).

- [ ] **Step 8: Run the full suite and verify all 12 tests pass**

Run: `cd website && npx playwright test tests/e2e/31-shipping-providers.spec.ts --reporter=list`
Expected: all tests `31-01` through `31-12` PASS.

- [ ] **Step 9: Commit**

```bash
git add website/tests/e2e/31-shipping-providers.spec.ts
git commit -m "fix(website): correct shipment E2E test to match admin-triggered booking

Checkout only creates a pending order_shipments placeholder; the real PPL/Packeta
booking happens when an admin processes the order, not automatically at checkout.
The test asserted the opposite and was silently failing, skipping 6 downstream tests."
```

---

## Task 2: Add i18n keys for the label preview page

**Files:**
- Modify: `shared/i18n/locales/cs.ts:486` (end of `orders` block)
- Modify: `shared/i18n/locales/en.ts:484` (end of `orders` block)

**Interfaces:**
- Produces: `t.admin.orders.shipmentPreviewLabel`, `t.admin.orders.labelPreviewTitle`, `t.admin.orders.labelPreviewBack` — consumed by Task 3, Task 4, Task 5.

- [ ] **Step 1: Add the new keys to `shared/i18n/locales/cs.ts`**

Find this line (end of the `orders` block):

```typescript
      shipmentConsignmentHint: "Zadejte tento kód na klávesnici kteréhokoli Z-BOXu, poté zvolte velikost boxu (1=S, 2=M, 3=L) a zásilku vložte.",
    },
```

Replace with:

```typescript
      shipmentConsignmentHint: "Zadejte tento kód na klávesnici kteréhokoli Z-BOXu, poté zvolte velikost boxu (1=S, 2=M, 3=L) a zásilku vložte.",
      shipmentPreviewLabel: "Náhled štítku",
      labelPreviewTitle: "Náhled přepravního štítku",
      labelPreviewBack: "← Zpět na objednávku",
    },
```

- [ ] **Step 2: Add the matching keys to `shared/i18n/locales/en.ts`**

Find this line (end of the `orders` block):

```typescript
      shipmentConsignmentHint: "Enter this code on any Z-BOX keypad, then select box size (1=S, 2=M, 3=L) to drop off the parcel.",
    },
```

Replace with:

```typescript
      shipmentConsignmentHint: "Enter this code on any Z-BOX keypad, then select box size (1=S, 2=M, 3=L) to drop off the parcel.",
      shipmentPreviewLabel: "Preview label",
      labelPreviewTitle: "Shipping label preview",
      labelPreviewBack: "← Back to order",
    },
```

- [ ] **Step 3: Typecheck**

Run: `cd website && pnpm typecheck`
Expected: no new errors (both locale files stay structurally identical, which the existing i18n type system enforces).

- [ ] **Step 4: Commit**

```bash
git add shared/i18n/locales/cs.ts shared/i18n/locales/en.ts
git commit -m "feat(website): add i18n keys for shipment label preview page"
```

---

## Task 3: Inline shipment actions and tracking number in the orders list

**Files:**
- Modify: `website/src/pages/admin/orders/index.astro`

**Interfaces:**
- Consumes: `createShipmentForOrder`, `refreshShipmentStatus`, `cancelShipmentForOrder` from `website/src/lib/shipmentActions.ts` (existing, unchanged signatures: `(adminClient: SupabaseClient<Database>, orderId: string) => Promise<{ error: string | null }>`); `createAdminClient` from `@/lib/supabase` (existing); `t.admin.orders.shipmentCreate/shipmentRetry/shipmentRefresh/shipmentCancel/shipmentPreviewLabel` (existing + Task 2).
- Produces: nothing new consumed elsewhere — this is a leaf page.

- [ ] **Step 1: Add the POST handler and widen the shipment select**

In `website/src/pages/admin/orders/index.astro`, replace the imports block:

```astro
import CmsLayout from "@/components/cms/CmsLayout.astro";
import { createSupabase } from "@/lib/supabase";
import { fetchOrders } from "@shared/services/orderService";
import { requireAdminCtx } from "@/lib/admin";
import { useT, getLang } from "@/lib/i18n";
import { PERMISSIONS, hasPermission } from "@shared/constants/permissions";
import type { Order } from "@shared/types/index";
import { formatPrice } from "@shared/utils/format";
```

with:

```astro
import CmsLayout from "@/components/cms/CmsLayout.astro";
import { createSupabase, createAdminClient } from "@/lib/supabase";
import { fetchOrders } from "@shared/services/orderService";
import { requireAdminCtx } from "@/lib/admin";
import { useT, getLang } from "@/lib/i18n";
import { PERMISSIONS, hasPermission } from "@shared/constants/permissions";
import type { Order } from "@shared/types/index";
import { formatPrice } from "@shared/utils/format";
import { createShipmentForOrder, refreshShipmentStatus, cancelShipmentForOrder } from "@/lib/shipmentActions";
```

Then, right after the line `if (!hasPermission(permissions, PERMISSIONS.MANAGE_ORDERS)) return Astro.redirect("/admin");` and before `const t = useT(Astro);`, insert:

```astro

if (Astro.request.method === "POST") {
  const form = await Astro.request.formData();
  const action = form.get("action") as string;
  const orderId = form.get("orderId") as string;

  const { data: ownedOrder } = await supabase.from("orders").select("id").eq("id", orderId).eq("party_id", partyId).maybeSingle();
  if (ownedOrder) {
    const adminClient = createAdminClient();
    if (action === "create_shipment") await createShipmentForOrder(adminClient, orderId);
    else if (action === "refresh_shipment") await refreshShipmentStatus(adminClient, orderId);
    else if (action === "cancel_shipment") await cancelShipmentForOrder(adminClient, orderId);
  }
  return Astro.redirect(Astro.url.pathname + Astro.url.search);
}
```

Then replace the shipment rows query:

```astro
const { data: shipmentRows } = orders.length
  ? await supabase.from("order_shipments").select("order_id, provider, status").in("order_id", orders.map((o) => o.id))
  : { data: [] as { order_id: string; provider: string; status: string }[] };
```

with:

```astro
const { data: shipmentRows } = orders.length
  ? await supabase
      .from("order_shipments")
      .select("order_id, provider, status, provider_shipment_id, tracking_number, label_storage_path, is_mock")
      .in("order_id", orders.map((o) => o.id))
  : {
      data: [] as {
        order_id: string;
        provider: string;
        status: string;
        provider_shipment_id: string | null;
        tracking_number: string | null;
        label_storage_path: string | null;
        is_mock: boolean;
      }[],
    };
```

- [ ] **Step 2: Update the table markup — Shipment cell, Actions cell, and overflow wrapper**

Replace:

```astro
  <div class="card" style="padding:0;overflow:hidden;margin-top:16px">
    <table class="data-table">
```

with:

```astro
  <div class="card" style="padding:0;overflow:hidden;margin-top:16px">
    <div style="overflow-x:auto">
    <table class="data-table">
```

Replace the Shipment `<td>`:

```astro
            <td>
              {shipment ? (
                <span class="badge badge-inactive" style="font-size:11px">{shipment.provider.toUpperCase()} · {shipment.status}</span>
              ) : (
                <span style="color:var(--text-muted);font-size:12px">—</span>
              )}
            </td>
```

with:

```astro
            <td>
              {shipment ? (
                <div style="display:flex;flex-direction:column;gap:2px">
                  <span class="badge badge-inactive" style="font-size:11px">
                    {shipment.provider.toUpperCase()} · {shipment.status}{shipment.is_mock ? " · TEST" : ""}
                  </span>
                  {shipment.tracking_number && <span style="font-size:12px;font-weight:600">{shipment.tracking_number}</span>}
                </div>
              ) : (
                <span style="color:var(--text-muted);font-size:12px">—</span>
              )}
            </td>
```

Replace the Actions `<td>`:

```astro
            <td><a href={`/admin/orders/${o.id}`} class="btn btn-ghost" style="padding:6px 12px;font-size:13px">{t.admin.orders.detail}</a></td>
```

with:

```astro
            <td>
              <div class="list-shipment-actions">
                <a href={`/admin/orders/${o.id}`} class="btn btn-ghost" style="padding:6px 12px;font-size:13px">{t.admin.orders.detail}</a>
                {shipment && (shipment.status === "pending" || shipment.status === "failed") && (
                  <form method="POST">
                    <input type="hidden" name="action" value="create_shipment" />
                    <input type="hidden" name="orderId" value={o.id} />
                    <button type="submit" class="btn btn-primary" style="padding:6px 12px;font-size:12px">
                      {shipment.status === "failed" ? t.admin.orders.shipmentRetry : t.admin.orders.shipmentCreate}
                    </button>
                  </form>
                )}
                {shipment?.provider_shipment_id && !["in_transit", "delivered", "returned", "cancelled"].includes(shipment.status) && (
                  <form method="POST">
                    <input type="hidden" name="action" value="refresh_shipment" />
                    <input type="hidden" name="orderId" value={o.id} />
                    <button type="submit" class="btn btn-ghost" style="padding:6px 12px;font-size:12px">{t.admin.orders.shipmentRefresh}</button>
                  </form>
                )}
                {shipment?.provider_shipment_id && !["in_transit", "delivered", "returned", "cancelled"].includes(shipment.status) && (
                  <form method="POST">
                    <input type="hidden" name="action" value="cancel_shipment" />
                    <input type="hidden" name="orderId" value={o.id} />
                    <button type="submit" class="btn btn-ghost" style="padding:6px 12px;font-size:12px;color:var(--error)">{t.admin.orders.shipmentCancel}</button>
                  </form>
                )}
                {shipment?.label_storage_path && (
                  <a href={`/admin/orders/${o.id}/label`} target="_blank" class="btn btn-secondary" style="padding:6px 12px;font-size:12px">
                    {t.admin.orders.shipmentPreviewLabel}
                  </a>
                )}
              </div>
            </td>
```

Replace the closing of the card:

```astro
    </table>
  </div>
```

with:

```astro
    </table>
    </div>
  </div>
```

- [ ] **Step 3: Add the flex layout CSS for the new actions cell**

In the `<style>` block at the bottom of the file, after `.tab--active { ... }`, add:

```css
  .list-shipment-actions { display:flex; flex-direction:column; gap:6px; align-items:flex-start; }
  .list-shipment-actions form { display:contents; }
```

- [ ] **Step 4: Typecheck**

Run: `cd website && pnpm typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add website/src/pages/admin/orders/index.astro
git commit -m "feat(website): add inline PPL/Packeta shipment actions to the orders list

Create/refresh/cancel shipment and the tracking number are now visible directly
in /admin/orders, reusing the existing shipmentActions.ts business logic - no
more forced proklik to the order detail page while processing orders."
```

---

## Task 4: Shipment label preview page

**Files:**
- Create: `website/src/pages/admin/orders/[id]/label.astro`

**Interfaces:**
- Consumes: `requireAdminCtx` from `@/lib/admin` (existing); `PERMISSIONS`, `hasPermission` from `@shared/constants/permissions` (existing); `t.admin.orders.labelPreviewTitle/labelPreviewBack` (Task 2); `/api/shipping-label/[orderId].ts` (existing, unchanged — returns a 302 redirect to a 60s signed Supabase Storage URL for the PDF).
- Produces: route `/admin/orders/[id]/label` and `/admin/orders/[id]/label?type=return`, linked from Task 3 (list) and Task 5 (detail page).

- [ ] **Step 1: Create the page**

```astro
---
import CmsLayout from "@/components/cms/CmsLayout.astro";
import { createSupabase } from "@/lib/supabase";
import { requireAdminCtx } from "@/lib/admin";
import { PERMISSIONS, hasPermission } from "@shared/constants/permissions";
import { useT } from "@/lib/i18n";

const supabase = createSupabase(Astro);
const { data: { session } } = await supabase.auth.getSession();
if (!session) return Astro.redirect("/login");

const activePartyId = Astro.cookies.get("activePartyId")?.value ?? null;
const ctx = await requireAdminCtx(supabase, session.user.id, activePartyId);
if (!ctx) return Astro.redirect("/");
if (!ctx.partyId) return Astro.redirect(ctx.isOwner ? "/admin/parties/new" : "/admin/setup");
if (!hasPermission(ctx.permissions, PERMISSIONS.MANAGE_ORDERS)) return Astro.redirect("/admin");
const t = useT(Astro);

const { id } = Astro.params;
const isReturn = new URL(Astro.request.url).searchParams.get("type") === "return";

const { data: order } = await supabase
  .from("orders")
  .select("id, order_number")
  .eq("id", id)
  .eq("party_id", ctx.partyId)
  .maybeSingle();
if (!order) return Astro.redirect("/admin/orders");

const labelSrc = `/api/shipping-label/${order.id}${isReturn ? "?type=return" : ""}`;
---

<CmsLayout title={t.admin.orders.labelPreviewTitle} userPermissions={ctx.permissions} currentPath="/admin/orders" parties={ctx.parties} partyId={ctx.partyId} isOwner={ctx.isOwner}>
  <div class="preview-header">
    <a href={`/admin/orders/${order.id}`} class="back-link">{t.admin.orders.labelPreviewBack}</a>
    <h1 class="preview-title">{t.admin.orders.labelPreviewTitle} — {order.order_number}</h1>
  </div>
  <iframe title={t.admin.orders.labelPreviewTitle} src={labelSrc} class="label-frame"></iframe>
</CmsLayout>

<style>
  .preview-header { display:flex; align-items:center; gap:16px; margin-bottom:12px; }
  .back-link { font-size:13px; color:var(--text-muted); text-decoration:none; }
  .back-link:hover { color:var(--text-primary); }
  .preview-title { font-size:16px; font-weight:700; margin:0; }
  .label-frame { width:100%; height:calc(100vh - 160px); border:1px solid var(--border-default); border-radius:8px; }
</style>
```

- [ ] **Step 2: Typecheck**

Run: `cd website && pnpm typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add website/src/pages/admin/orders/\[id\]/label.astro
git commit -m "feat(website): add shipment label preview page with embedded PDF iframe"
```

---

## Task 5: Wire the detail page's label links to the preview page, remove the now-dead i18n key

**Files:**
- Modify: `website/src/pages/admin/orders/[id].astro:202-204,241-243`
- Modify: `shared/i18n/locales/cs.ts` (remove `shipmentDownloadLabel`)
- Modify: `shared/i18n/locales/en.ts` (remove `shipmentDownloadLabel`)

**Interfaces:**
- Consumes: `t.admin.orders.shipmentPreviewLabel` (Task 2), route `/admin/orders/[id]/label` (Task 4).
- Produces: nothing new — this is the last consumer-facing wiring step.

- [ ] **Step 1: Replace the forward-shipment label link**

In `website/src/pages/admin/orders/[id].astro`, replace:

```astro
            {order.shipment.label_storage_path && (
              <a href={`/api/shipping-label/${order.id}`} target="_blank" class="btn btn-secondary" style="font-size:13px">{t.admin.orders.shipmentDownloadLabel}</a>
            )}
```

with:

```astro
            {order.shipment.label_storage_path && (
              <a href={`/admin/orders/${order.id}/label`} target="_blank" class="btn btn-secondary" style="font-size:13px">{t.admin.orders.shipmentPreviewLabel}</a>
            )}
```

- [ ] **Step 2: Replace the return-shipment label link**

Replace:

```astro
              {order.shipment.return_label_storage_path && (
                <a href={`/api/shipping-label/${order.id}?type=return`} target="_blank" class="btn btn-secondary" style="font-size:13px">{t.admin.orders.shipmentDownloadLabel}</a>
              )}
```

with:

```astro
              {order.shipment.return_label_storage_path && (
                <a href={`/admin/orders/${order.id}/label?type=return`} target="_blank" class="btn btn-secondary" style="font-size:13px">{t.admin.orders.shipmentPreviewLabel}</a>
              )}
```

- [ ] **Step 3: Remove the now-unused `shipmentDownloadLabel` key**

Confirm no remaining references:

Run: `grep -rn "shipmentDownloadLabel" website/src shared`
Expected: no output.

Remove the line `shipmentDownloadLabel: "Stáhnout štítek",` from `shared/i18n/locales/cs.ts` and `shipmentDownloadLabel: "Download label",` from `shared/i18n/locales/en.ts`.

- [ ] **Step 4: Typecheck**

Run: `cd website && pnpm typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add website/src/pages/admin/orders/\[id\].astro shared/i18n/locales/cs.ts shared/i18n/locales/en.ts
git commit -m "refactor(website): point order-detail label links at the new preview page

Replaces the raw PDF download link with the embedded iframe preview page on both
the forward and return shipment cards, and drops the now-unused download-label
translation key."
```

---

## Task 6: E2E coverage for the new list actions and the label preview page

**Files:**
- Modify: `website/tests/e2e/31-shipping-providers.spec.ts` (append after the final test)

**Interfaces:**
- Consumes: `pplOrderNumber`, `ownerPage`, `USER`, `loginAs`, `psql`, `screenshot`, `BASE` from the same file/`./helpers` (all already in scope from Task 1).
- Produces: nothing consumed elsewhere — final verification layer.

- [ ] **Step 1: Append the new tests**

Add these four tests at the end of the `describe` block in `website/tests/e2e/31-shipping-providers.spec.ts`, after test `31-12` and before the closing `});` of the `describe`:

```typescript
  test("31-13 orders list shows tracking number and inline shipment actions for the PPL order", async () => {
    await ownerPage.goto(`${BASE}/admin/orders`);
    await ownerPage.waitForLoadState("networkidle");
    const row = ownerPage.locator("tr", { hasText: pplOrderNumber });
    await screenshot(ownerPage, "31-13-orders-list-inline-actions");

    const trackingResult = psql(
      `SELECT tracking_number FROM public.order_shipments os JOIN public.orders o ON o.id = os.order_id WHERE o.order_number = '${pplOrderNumber}';`
    );
    const trackingNumber = trackingResult.trim().split("\n").pop()?.trim() ?? "";
    expect(trackingNumber.length).toBeGreaterThan(0);

    await expect(row).toContainText(trackingNumber);
    await expect(row.getByRole("link", { name: /Náhled štítku|Preview label/ })).toBeVisible();
    await expect(row.getByRole("button", { name: /Aktualizovat stav|Refresh status/ })).toBeVisible();
    await expect(row.getByRole("button", { name: /Zrušit zásilku|Cancel shipment/ })).toBeVisible();
  });

  test("31-14 inline 'refresh status' button in the orders list works without leaving the list", async () => {
    const row = ownerPage.locator("tr", { hasText: pplOrderNumber });
    await row.getByRole("button", { name: /Aktualizovat stav|Refresh status/ }).click();
    await ownerPage.waitForLoadState("networkidle");
    await screenshot(ownerPage, "31-14-orders-list-after-refresh");
    // Must redirect back to the same list URL, not to the order detail page.
    expect(ownerPage.url()).toContain("/admin/orders");
    expect(ownerPage.url()).not.toContain(pplOrderNumber);
  });

  test("31-15 label preview page embeds the PDF via iframe", async () => {
    const orderIdResult = psql(`SELECT id FROM public.orders WHERE order_number = '${pplOrderNumber}';`);
    const orderId = orderIdResult.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)?.[0];

    await ownerPage.goto(`${BASE}/admin/orders/${orderId}/label`);
    await ownerPage.waitForLoadState("networkidle");
    await screenshot(ownerPage, "31-15-label-preview-page");

    await expect(ownerPage.locator("iframe.label-frame")).toHaveAttribute("src", `/api/shipping-label/${orderId}`);
    await expect(ownerPage.getByRole("link", { name: /Zpět na objednávku|Back to order/ })).toBeVisible();
  });

  test("31-16 user without admin access cannot reach the label preview page", async ({ browser }: { browser: Browser }) => {
    const orderIdResult = psql(`SELECT id FROM public.orders WHERE order_number = '${pplOrderNumber}';`);
    const orderId = orderIdResult.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)?.[0];

    const page = await browser.newPage();
    await loginAs(page, USER.email, USER.password);
    await page.goto(`${BASE}/admin/orders/${orderId}/label`);
    await page.waitForLoadState("networkidle");
    expect(page.url()).not.toContain("/label");
    await page.close();
  });
```

- [ ] **Step 2: Run the full suite**

Run: `cd website && npx playwright test tests/e2e/31-shipping-providers.spec.ts --reporter=list`
Expected: all 16 tests PASS.

- [ ] **Step 3: Run the full admin role-access suite to confirm no permission regression**

Run: `cd website && npx playwright test tests/e2e/15-role-access.spec.ts --reporter=list`
Expected: all tests PASS (the new list actions and label page reuse the existing `MANAGE_ORDERS` gate, no new bit was introduced).

- [ ] **Step 4: Commit**

```bash
git add website/tests/e2e/31-shipping-providers.spec.ts
git commit -m "test(website): cover inline orders-list shipment actions and label preview page"
```

---

## Final verification

- [ ] Run `cd website && pnpm typecheck` — no errors.
- [ ] Run `cd website && npx playwright test tests/e2e/31-shipping-providers.spec.ts tests/e2e/15-role-access.spec.ts --reporter=list` — all pass.
- [ ] Manually open `/admin/orders?status=processing` in a browser, confirm tracking number + action buttons render per row, click "Náhled štítku" and confirm the PDF renders inline via the new preview page.
- [ ] Confirm `.env.production` and `.env.production.example` are untouched (`git diff` shows no changes to either file).
