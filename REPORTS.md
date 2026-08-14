# Packeta / Shipping Integration — Verification Report

Started: 2026-08-12
Scope: verify the Packeta (Zásilkovna) shipping integration end to end — ordering, DB
persistence, retrieval, customer-facing tracking access, pricing, admin controls —
per user request. Packeta has no sandbox environment (confirmed via the codebase's own
comment in `website/src/lib/integrations/shipping/packeta.ts:3` and via Packeta docs
search), so all app-level testing below runs against the project's own mock provider
(`website/src/lib/integrations/shipping/mock.ts`), which is the same approach the
existing `31-shipping-providers.spec.ts` suite already uses. A separate, isolated
live-API smoke test against the real Packeta account is tracked as its own section.

Testing is one scenario at a time; each finding is logged here as soon as it's confirmed,
before moving to the next scenario, per the user's instruction.

---

## Pre-flight notes (before any test ran)

- **No Packeta sandbox exists.** Real API calls with the real `PACKETA_API_PASSWORD`
  hit the live merchant account. Confirmed with the user before proceeding — agreed
  approach: full flow tested in mock mode, plus one isolated, self-contained live
  smoke test (create + immediately cancel one real packet) run outside the app.
- **Live-mode footgun found in current env config**: `.env.development` now has
  `PACKETA_API_PASSWORD` set (real credential) and `PUBLIC_SHIPPING_MOCK_MODE=false`.
  `getShippingProvider()` (`website/src/lib/integrations/shipping/index.ts:15`) decides
  mock-vs-real **only** by whether `PACKETA_API_PASSWORD` is set — it does not consult
  `PUBLIC_SHIPPING_MOCK_MODE` at all. That means simply running the existing
  `pnpm playwright test` suite as-is, right now, with this env file, would silently
  create real packets on the live Packeta account using fake E2E test addresses
  ("Testovací 10", "Domovská 5", etc.) — because the suite's own doc comment
  (`31-shipping-providers.spec.ts:4-7`) assumes the mock-fallback safety net that
  existed before a real password was added. **This is not itself a code bug — mock vs.
  live is meant to be controlled by whether the secret is provisioned — but it is a
  sharp edge worth knowing: adding the real credential to `.env.development` silently
  flips shipment *creation* to live for every environment that loads that file,
  independent of the widget-only `PUBLIC_SHIPPING_MOCK_MODE` flag**, and nothing warns
  about that at the point the credential is added. See Finding #2 for a fix suggestion.
- All mock-mode testing below was run against a dev server started with
  `PACKETA_API_PASSWORD=` / `PPL_CLIENT_ID=` / `PPL_CLIENT_SECRET=` /
  `PUBLIC_SHIPPING_MOCK_MODE=true` explicitly overridden in the process env, to
  guarantee no live calls regardless of what's in `.env.development`.

---

## Test log

### ✅ Baseline: `31-shipping-providers.spec.ts` (existing suite, mock mode)
Result: **10/10 passed.** Covers: owner configuring PPL/Packeta prices, non-owner
redirect from settings, checkout shows both providers with correct prices, PPL
pickup-point checkout end to end (mock pickup widget → Stripe test payment →
confirmation with tracking + TEST MODE badge + label link), order totals =
subtotal + shipping, label download returns a real PDF, admin order detail shows
shipment card + refresh-status action, orders list shows provider/status badge,
Packeta home-delivery checkout (no pickup point) completes and records correctly.
No issues.

### ✅ Migrations & types
- `20260103000069_shipping_providers.sql`, `..070_shipment_cancel_return.sql`,
  `..071_shipment_consignment_code.sql` all applied cleanly to local dev DB — schema
  matches `shared/supabase/types.ts` (`order_shipments` has all 25 expected columns,
  including `consignment_code`, `return_password`, `cancelled_at`, `return_created_at`).
- `pnpm typecheck` (website): **no errors.**

### ❌ Finding #1 — Guest customers never see their own tracking number or label link
**Severity: High.** Confirmed with a new E2E test (`32-packeta-verification.spec.ts`,
test `32-01`), screenshots attached below.

**Repro:**
1. As an unauthenticated (guest) visitor, add a product to cart, go to
   `/shop/checkout`, select Packeta, fill address + email, pay with a Stripe test card.
2. Land on `/shop/order-confirmation?order=...`.

**Expected:** the confirmation page shows the tracking number and (once ready) a
"download label" link, same as it does for a logged-in customer.

**Actual:** the confirmation page shows only "Objednávka přijata!" and the order
number — no shipment/tracking section renders at all, even though the shipment was
created successfully server-side.

**Proof:**
- DB check immediately after the guest's payment: `order_shipments.tracking_number`
  for the guest's order = `Z6530206907` — the shipment genuinely exists.
- Screenshot of the same guest's browser, same page, same moment:
  `website/tests/screenshots/004-32-01-guest-order-confirmation.png` — no tracking
  line, no label link, no mock badge. (Compare to the logged-in-customer version of
  this exact page in `website/tests/screenshots/010-31-04-order-confirmation.png` from
  the baseline suite, which does show the tracking line.)

**Root cause:** `website/src/pages/shop/order-confirmation.astro:18-24` fetches the
order/shipment using `createSupabase(Astro)` — the request's session-bound client. For
a guest, there is no Supabase auth session, so this query runs as Postgres role `anon`.
The only read policies on `orders` and `order_shipments`
(`20260103000057_customer_self_service_orders.sql:12-15`,
`20260103000069_shipping_providers.sql:98-105`, "Customers read own orders" /
"Customers read own order_shipments") are both scoped `TO authenticated` — there is no
`anon` grant or policy on either table. So the query returns zero rows for a guest,
`shipment` is `null`, and the whole `{shipment?.tracking_number && (...)}` block is
skipped. No error is thrown — it degrades silently, which is why this wasn't caught
before: nothing looks broken unless you check the DB.

This is the same page used by the `eshop-[partySlug]` storefront variant
(`website/src/pages/eshop-[partySlug]/order-confirmation.astro` uses the identical
pattern — not yet independently verified but very likely to have the same issue; worth
checking when this is fixed).

**Impact:** every guest checkout (a fully supported, first-class flow per
`getOrCreateGuestCartId`/`guestCart.ts`) loses the customer's only current way to see
their tracking number or download their label. There is also no persistent "my orders"
page anywhere on the storefront (checked `profile.astro` and the whole `pages/`
tree) — the confirmation page is the *only* place tracking is ever surfaced to a
customer, guest or logged-in. So for guests this information is not recoverable
through the UI at all after this page is left; they'd have to contact support.

**Suggested fix direction (not implemented — flagging for follow-up):** either (a) have
order-confirmation.astro fall back to `createAdminClient()` plus an app-level ownership
check for the guest case (mirroring the pattern already used for guest cart ownership
per the `project_guest_cart_checkout` precedent — session_id/order_number match, no
anon RLS), or (b) add a scoped anon RLS policy keyed off a token embedded in the
confirmation URL. (a) matches the codebase's existing guest-ownership idiom most
closely.

---

### ❌ Finding #2 — Forward Packeta/PPL shipment is created with no recipient phone and no recipient email
**Severity: High for Packeta specifically** (phone/email drive Packeta's SMS/email
delivery notifications and pickup-point-ready alerts — a core part of its customer
experience). Found while building a DB-seeded admin test for `create_shipment`
(seed used a `phone` column that turned out not to exist on `addresses` — chasing that
down surfaced this).

**Root cause:** `website/src/lib/checkoutFlow.ts`, `createShipmentForOrder()`
(lines 53-99):
- Line 60: `.select("order_number, total_amount, currency, shipping_address:shipping_address_id(*)")`
  — does **not** select `customer_id`, so the customer row (and their phone/email) is
  never fetched at all in this function.
- Line 79: `phone: address.phone ?? undefined` — `address` is the joined `addresses`
  row. The `addresses` table (`\d addresses`, confirmed directly against the local DB)
  has **no `phone` column** — columns are `id, customer_id, type, first_name,
  last_name, company, line1, line2, city, state, postal_code, country_code,
  is_default, created_at, updated_at`. So `address.phone` is always `undefined` in
  JS (silently — no error, no crash, TypeScript doesn't catch it either since the
  join is cast `as any`).
- The `recipient` object built at lines 76-84 also has **no `email` key at all** —
  not even an attempt to read one.

So every real forward shipment (Packeta or PPL) is created with the recipient's phone
and email both blank, regardless of what the customer entered at checkout.

**Where the real phone/email actually live:** `customers.phone` and `customers.email`
(confirmed via `\d customers`) — populated correctly at checkout
(`website/src/pages/shop/checkout.astro:51,85`). Proof this data is captured
correctly and simply not being read by the shipment-creation path: the **return**
shipment flow, `createReturnShipmentForOrder()` in
`website/src/lib/shipmentActions.ts:58,72-74`, does it correctly —
`adminClient.from("customers").select("email, phone").eq("id", order.customer_id)`,
then `phone: customer?.phone ?? undefined, email: customer?.email ?? undefined`. The
forward-shipment function just never does the equivalent lookup.

**Impact:** for every real (non-mock) Packeta shipment created through normal checkout,
Packeta never receives a phone number or email for the recipient — so any
Packeta-side SMS/email notification to the customer (delivery updates, "ready for
pickup at Z-BOX" alerts) will not fire. Silent — no error surfaces anywhere in the
app; the shipment still gets created and shows as successful in the admin UI.

**Suggested fix direction (not implemented):** in `createShipmentForOrder`, add
`customer_id` to the `orders` select, fetch `customers.phone`/`email` the same way
`createReturnShipmentForOrder` already does, and add `email` to the `recipient` object
literal (currently missing the key entirely, not just unpopulated).

---

### ✅ 32-02 — Admin create-shipment → cancel-shipment (Packeta, mock mode)
Result: **passed.** Seeded a paid `processing` order directly in the DB with a
`pending` Packeta shipment row, then drove the real `create_shipment` and
`cancel_shipment` admin actions through the UI (not seeded/faked).
- Create: shipment flipped `pending` → `label_ready`, got a provider id, tracking
  number `Z6530417833`, and a 9-digit Z-BOX consignment code `629729464`. Admin UI
  correctly shows "TESTOVACÍ REŽIM" (test mode) badge, provider PACKETA, tracking
  number, consignment code + instructions, and a working "Stáhnout štítek" (download
  label) link. Screenshot: `website/tests/screenshots/004-32-02-admin-shipment-created.png`.
- Cancel: status flipped to `cancelled`, `cancelled_at` timestamp set, UI correctly
  replaced the cancel button with "Tato zásilka byla zrušena" (this shipment has been
  cancelled) and removed the now-invalid cancel action. No errors.
  Screenshot: `website/tests/screenshots/005-32-02-admin-shipment-cancelled.png`.

No issues found in this flow.

### ✅ 32-03 — Admin create-return-shipment + consignment/return-password display (Packeta, mock mode)
Result: **passed.** Seeded a `label_ready` forward Packeta shipment, then drove the
real `create_return_shipment` admin action.
- Return shipment created with its own tracking number `ZR530562085` and a 6-digit
  Packeta drop-off password `424853`, both displayed correctly in a distinct "Vratná
  zásilka" (return shipment) card with its own "Stáhnout štítek" link — independent of
  the forward shipment's card, as designed.
  Screenshot: `website/tests/screenshots/004-32-03-admin-return-created.png`.

No issues found in this flow.

**Note on running the whole `32-packeta-verification.spec.ts` file in one go:** 32-02
and 32-03 are correctly written to be independently seeded, but the file uses
`test.describe.configure({ mode: "serial" })` (matching the existing `31-` suite's
convention), so when 32-01 fails (a genuine bug, not a flake — see Finding #1),
Playwright skips the remaining tests in that file rather than treating them as
independent. Both were verified passing on their own (`-g "32-02"`, `-g "32-03"`);
this is a structural note for whoever fixes Finding #1 and re-runs the file as a whole,
not a new issue.

---

## Live Packeta API smoke test (real account, outside the app)

Ran a standalone script (not part of the Astro app or the E2E suite — kept outside
both deliberately) that called Packeta's real REST API (`https://www.zasilkovna.cz/api/rest`)
directly with the real `PACKETA_API_PASSWORD` from `.env.development`: one
`createPacket` with an obviously-fake test packet (name "TEST DO-NOT-SHIP", email
`e2e-smoketest@example.invalid`, reference number prefixed
`E2E-SMOKETEST-DELETE-ME-<timestamp>`, value 1 CZK, weight 0.1kg).

### ⚠️ Finding #3 — Packeta account is not approved for posting parcels
**Not a code bug — an account-provisioning/approval issue on the Packeta side.**

**Result:** `createPacket` returned HTTP 200 with a Packeta-level fault:
```xml
<response><status>fault</status><fault>PacketAttributesFault</fault>
<string>Failed to validate attributes. See detail.</string>
<detail><attributes><fault><name>user_id</name>
<fault>Order nr. E2E-SMOKETEST-DELETE-ME-1786530688500: The client account is not
approved for posting parcels.</fault></fault></attributes></detail></response>
```

**What this confirms:**
- `PACKETA_API_PASSWORD` is syntactically valid and **does authenticate** — Packeta
  resolved it to a real client/`user_id` (an invalid/garbage password would fail
  differently, at authentication, not attribute validation).
- That account is **not yet approved to create parcels** — this is Packeta's own
  account-status gate, unrelated to anything in this codebase. It needs to be resolved
  on Packeta's side (typically: complete their merchant/business verification or
  contract-activation step in the Packeta client portal) before any real
  `createShipment` call from this app can succeed.
- **No real packet was created** — `id`/`barcode` were both absent from the fault
  response, so there was nothing to cancel and no real-world side effect occurred.
  Safe outcome, no manual cleanup needed on the Packeta side.

**Practical implication for the rest of this integration:** until the Packeta account
is approved, every real (non-mock) Packeta shipment attempt in production will fail
the same way and land the order's shipment row in `status = 'failed'` with this exact
error message surfaced via `order_shipments.error_message` (per
`createShipmentForOrder`'s catch block in `checkoutFlow.ts:124-129`) — which the admin
UI already displays correctly. So functionally the app **fails safely** here (no
crash, no charge, order stays valid, admin sees a clear reason) — it just can't be
fully live-tested end-to-end until Packeta approves the account. Recommend resolving
approval with Packeta first, then re-running this same smoke script to confirm before
flipping any real store over to non-mock Packeta shipping.

---

## Summary so far

| Area | Result |
|---|---|
| DB migrations (069/070/071) apply cleanly, types in sync | ✅ |
| `pnpm typecheck` | ✅ no errors |
| Existing baseline suite `31-shipping-providers.spec.ts` (10 tests) | ✅ all pass |
| Checkout: provider selection, pricing (base price / free-above-amount), pickup-point vs. home delivery | ✅ |
| DB persistence: order + order_shipments rows created and correctly priced | ✅ |
| Admin: create shipment, refresh status, cancel shipment, create return shipment, consignment code, label download | ✅ all pass |
| **Logged-in customer** sees their own tracking number + label link | ✅ |
| **Guest customer** sees their own tracking number + label link | ❌ **Finding #1 — does not work at all** |
| Forward shipment recipient phone/email sent to carrier | ❌ **Finding #2 — both always blank** |
| Live Packeta API connectivity (real credentials) | ⚠️ credential valid, account not yet approved by Packeta — see Finding #3 |

---

## Overall verdict

The Packeta integration's **application-side plumbing is solid**: pricing, checkout
selection, DB persistence (order + shipment rows, correct amounts), admin controls
(create/refresh/cancel/return/consignment code, label PDFs, TEST MODE badges), and
failure handling (a failed carrier call leaves the order valid and shows a clear error
to admins, never crashes checkout) all work correctly against the mock provider, which
is the only way this can be fully exercised without a real Packeta sandbox.

Three real issues came out of this pass, in priority order:
1. **Finding #1 (High, app bug):** guest checkouts never see their own tracking
   number or label — an RLS/client-scoping gap in `order-confirmation.astro`.
2. **Finding #2 (High, app bug):** every real forward shipment is created with a
   blank recipient phone and email — a missing `customers` lookup in
   `checkoutFlow.ts`'s `createShipmentForOrder`.
3. **Finding #3 (blocking, not a code bug):** the live Packeta account itself isn't
   yet approved to post parcels — needs to be resolved with Packeta directly before
   any real (non-mock) Packeta shipment can succeed in production.

Findings #1 and #2 are both concrete, reproducible, and scoped to specific
files/lines above, ready to be picked up. Finding #3 blocks *live* verification only —
it doesn't block continuing to build/ship on the mock provider, which is functionally
complete.

Environment left as found: dev server restarted with default `.env.development` (no
overrides), local Supabase untouched, all E2E test data cleaned up, new test file
`website/tests/e2e/32-packeta-verification.spec.ts` added (2 of 3 tests pass; the
3rd — 32-01 — correctly fails, documenting Finding #1, and should start passing once
that's fixed).
