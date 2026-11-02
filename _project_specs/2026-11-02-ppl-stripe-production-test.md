# Production delivery test — PPL on-address + Stripe (postmortem)

Date: 2026-11-02.
Store: Kytka z Beskyd (`mamtodoma.cz/eshop-kytka-z-beskyd`), party `a0000000-0000-0000-0000-000000000003`.
Order under test: `ORD-00618076` (1 Kč test product `test-ppl-doprava-1kc` + 86 Kč PPL address shipping = 87 Kč).

## Objective

Prove the full production flow end to end with a real payable order: storefront checkout -> live Stripe payment -> real PPL on-address label.
This was the first time writing/operating production data over the Oracle self-hosted Supabase path.

## Outcome — CONFIRMED GOOD

Both halves are proven in production:

- Stripe: `payment_status=paid`, 87.00 CZK, `payment_method=stripe`, intent `pi_3UXKya1qEoXHgxGG0ulPeY6G` (Succeeded).
- PPL: real label booked, `is_mock=false`, tracking `80941896647`, valid printable PDF with correct recipient (Mělník) and sender (Smalljobs s.r.o. / Olomouc).

## What went wrong (in order of discovery) and how it was fixed

### 1. Stripe never charged shipping (commit 88d8f53)

`buildStripeLineItems` / `startOrderCheckout` in `website/src/lib/checkoutFlow.ts` built the Stripe session from product line items only.
The `shippingCost` passed by the checkout page was silently dropped, so card orders collected goods only — shipping revenue was lost on every card order.
The 1 Kč test exposed it by pushing the Stripe total below Stripe's 15 CZK minimum ("The Checkout Session's total amount due must add up to at least Kč15.00 CZK").
It slipped through because `.astro` frontmatter is not strictly excess-property-checked by `tsc`.
Fix: append shipping as its own Stripe line item so the charge equals `orders.total_amount`.

### 2. Stock leaked on unpaid / abandoned checkouts (commit fa0f79b)

Stock is deducted when `order_items` are inserted (DB trigger `trg_deduct_stock_on_order_item`) — at order creation, before payment.
It is only returned when the order is cancelled (trigger `return_stock_on_order_cancel`).
Failed or abandoned checkouts stayed `pending/unpaid` forever and permanently consumed inventory (seen as 3 "PRODEJ ZE SKLADU" events for 1 real sale + 2 dead checkouts).
Fix: both storefront checkouts now cancel the just-created order in the catch path (scoped to unpaid) when the Stripe session fails to start or any post-order step throws; Stripe sessions set `expires_at` 30 min and `checkout.session.expired` cancels abandoned orders.

### 3. Carrier env vars wiped on every deploy (commit 07da332)

`PPL_CLIENT_ID`, `PPL_LIVE_BOOKING`, `PPL_API_BASE_URL`, `PACKETA_SENDER_LABEL` were added only as plain-text dashboard Variables.
`wrangler deploy` governs the plain-text var set from `wrangler.toml [vars]`, so every CI/CD deploy wiped the dashboard-only plain vars.
Only encrypted Secrets survived, so `hasCreds` was false and `getShippingProvider` fell back to the mock provider.
Fix: move the non-secret carrier values into `wrangler.toml [vars]`; keep `PPL_CLIENT_SECRET` and `PACKETA_API_PASSWORD` as dashboard Secrets.
Also learned: a newly-added dashboard Secret sits in the edit form and is absent from the "Production" runtime tab until it is actually deployed.

### 4. ROOT CAUSE of the mock labels — wrong env accessor (commit b5493a4)

The shipping integration read credentials via `import.meta.env`, which does NOT reflect Cloudflare runtime vars/secrets at request time.
Proven by the debug page: `import.meta.env.SHOP_URL` was `undefined` in production while `Astro.locals.runtime.env.SHOP_URL` was set.
So `PPL_LIVE_BOOKING` evaluated `!== "true"` and the booking stayed mock even with creds and the flag correctly configured.
Fix: read all carrier credentials/flags through a `shipEnv()` helper (`website/src/lib/integrations/shipping/env.ts`) that uses `process.env[k] ?? import.meta.env[k]`, matching how the project reads `SHOP_URL` and other runtime `[vars]`.
This was isolated with a temporary owner-only debug page that printed, per key, the value via `import.meta.env` vs `Astro.locals.runtime.env` vs `process.env` plus the gate decision (removed after, commit f212866).

## What went well

Driving the real storefront checkout surfaced bugs that mocks never would have — the whole point of a production test.
The booking gate's silent mock fallback (`is_mock` persisted + "TESTOVACÍ REŽIM" admin badge) made the mock-vs-real state auditable at every step.
The cancel-on-order trigger let us restore leaked stock cleanly (just set `status='cancelled'`, the trigger does the rest).
The debug page comparing the three env sources turned a confusing build-vs-runtime problem into a one-glance answer.

## Config reference — where each carrier value must live

| Value | Type | Location | Why |
|-------|------|----------|-----|
| `PPL_CLIENT_ID` | non-secret | `wrangler.toml [vars]` | plain dashboard vars get wiped each deploy |
| `PPL_LIVE_BOOKING` | non-secret | `wrangler.toml [vars]` | must equal the string `"true"` |
| `PPL_API_BASE_URL` | non-secret | `wrangler.toml [vars]` | code defaults to `https://api.dhl.com/ecs/ppl/myapi2` |
| `PACKETA_SENDER_LABEL` | non-secret | `wrangler.toml [vars]` | |
| `PPL_CLIENT_SECRET` | secret | dashboard Secret | encrypted, survives deploys |
| `PACKETA_API_PASSWORD` | secret | dashboard Secret | encrypted, survives deploys |

Code must read these via `shipEnv()` (process.env), never `import.meta.env`.
Credentials never belong in `wrangler.toml` (git) — only the non-secret account id / flag / url / label do.

## Open items

- For the abandonment half of fix #2 to fire, confirm the Stripe webhook endpoint is subscribed to `checkout.session.expired`.
- `order_shipments.consignment_code` came back empty from PPL on this booking; the tracking barcode is present and the label is valid, but verify whether any PPL flow needs a separate consignment number.
- PPL account billing / parcel handover is separate from the Stripe payment — see the carrier-billing note below.

## Carrier billing vs Stripe (important distinction)

The Stripe charge is the customer paying the merchant (item + the shipping fee the merchant charges).
PPL carriage is billed to the merchant's PPL/CPL business account (client `SJ4802046`) per the PPL contract — a separate transaction from Stripe.
Creating a label via the CPL API creates a real shipment order on that account; PPL then carries it and bills the account per the agreed tariff.
Verify in the PPL/CPL contract whether the account is postpaid (invoice) or prepaid (requires funded balance), and whether a pickup must be ordered or the parcel dropped off.
