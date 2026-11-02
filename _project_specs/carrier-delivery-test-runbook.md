# Carrier delivery test runbook (production)

Reusable procedure for a real, payable production delivery test of a shipping carrier.
Proven first with PPL on-address on 2026-11-02 (see `2026-11-02-ppl-stripe-production-test.md`).
Use for the remaining matrix: Packeta to address, and PPL + Packeta to pickup point (výdejní místo).

## Trigger

Say, in any session: "Run the carrier delivery test: `<PPL|Packeta>` to `<address|pickup>`" and point me to this file.
I then follow the Procedure below for that carrier + delivery type.

## Money model (read first — Stripe does NOT pay the carrier)

- Customer -> merchant (Stripe): the customer pays item + the shipping fee the merchant charges. This is merchant revenue, not a payment to the carrier.
- Merchant -> carrier: the carrier bills the merchant's business account per contract (PPL/CPL client `SJ4802046`; Packeta account). Creating a label places a real shipment order on that account; the carrier carries it and invoices/deducts per the account's postpaid (invoice) or prepaid (funded balance) terms.
- Card-prepaid orders (`payment_method=stripe`) are NOT COD — the carrier collects nothing from the recipient. For a COD (dobírka) test, the carrier collects the total from the recipient and `codAmount` is sent in the booking.
- Verify postpaid vs prepaid in the carrier portal (PPL: `klient.ppl.cz`); a prepaid account with no balance can create labels that never get collected.

## Prerequisites for LIVE (non-mock) booking

- Code reads carrier env via `shipEnv()` (`website/src/lib/integrations/shipping/env.ts`) = `process.env ?? import.meta.env`. NEVER `import.meta.env` directly — it is undefined for Cloudflare runtime vars at request time.
- Non-secret carrier values live in `website/wrangler.toml [vars]` (plain dashboard vars get wiped every `wrangler deploy`). Secrets live as dashboard Secrets (survive deploys) and must actually be deployed (present in the Worker's "Production" runtime tab, not just the edit form).
- Quick live check: open `/admin/settings/shipping` as owner — the carrier card shows a "testovací režim (mock)" notice only when its credentials are missing. Note: that notice checks creds only; PPL also needs `PPL_LIVE_BOOKING="true"` (Packeta has no such flag).
- Gate in `website/src/lib/integrations/shipping/index.ts`:
  - PPL: `shipEnv("PPL_CLIENT_ID") && shipEnv("PPL_CLIENT_SECRET")` AND `shipEnv("PPL_LIVE_BOOKING")==="true"`.
  - Packeta: `shipEnv("PACKETA_API_PASSWORD")` present (no live flag).

As of 2026-11-02 these are all deployed and live in prod (PPL + Packeta creds present, PPL_LIVE_BOOKING="true").

## Procedure

1. Test product: ensure a cheap live product exists in the target store (reuse `test-ppl-doprava-1kc` in Kytka z Beskyd, or seed a new idempotent 1 Kč product). Confirm it renders and is in stock.
2. Checkout on the live storefront (`mamtodoma.cz/eshop-<slug>/checkout`):
   - Select the carrier (PPL or Zásilkovna/Packeta).
   - Select delivery type: "Doručení na adresu" (address) or "Výdejní místo" (pickup).
   - For pickup: open the carrier map widget, pick a point (sets `pickup_point_id`/name/address); the server re-validates via `verifyPickupPoint`.
   - Fill recipient details; choose "Platba kartou online" (Stripe). Confirm the summary total = item + the correct shipping price.
3. Submit (Objednat) -> drive to the Stripe page. I stop here; JAN pays with a real card. (I never enter card details.)
4. After payment, book the label: admin -> order detail -> "Vytvořit zásilku" (shows only when shipment `status` is pending/failed; if a mock shipment exists, reset the row to pending first). This calls the live carrier API.
5. Verify (connect to prod DB via `scripts/oci-prod-db.md`):
   - `orders`: `payment_status=paid`, correct `total_amount`.
   - `order_shipments`: `is_mock=false`, real `provider_shipment_id` (not `MOCK-...`), `tracking_number`, `label_storage_path` set, `error_message` null.
   - Open the label (admin "Náhled štítku") and confirm the PDF shows the real carrier branding, correct recipient + sender, and the tracking barcode.

## Carrier-specific notes

- PPL: needs `PPL_CLIENT_ID`+`PPL_CLIENT_SECRET`+`PPL_LIVE_BOOKING="true"`; pickup map widget needs `PPL_WIDGET_API_KEY` (in `[vars]`, from `klient.ppl.cz/widgetadmin`). PPL requires a full sender address on every shipment. Tracking number IS the shipment number. `consignment_code` may come back empty (non-blocking).
- Packeta (Zásilkovna): needs `PACKETA_API_PASSWORD` (secret) + `PACKETA_SENDER_LABEL`; pickup widget needs `PACKETA_WIDGET_API_KEY`. Home delivery (address) requires the HD carrier id `addressId` (CZ106 / SK131) in the payload — confirm this is set for the address test. Returns use a drop-off password, label appears only after the customer submits at a point.

## Delivery-type notes

- Address (home): no pickup point; recipient street/city/zip required; price = `base_price`.
- Pickup point (výdejní místo): `pickup_point_id` required and re-validated; price = `pickup_price`.

## Prices live in prod (shipping_provider_configs)

| Carrier | Address (base_price) | Pickup (pickup_price) |
|---------|----------------------|-----------------------|
| PPL     | 86 Kč                | 57 Kč                 |
| Packeta | 108 Kč               | 75 Kč                 |

## Cleanup after a test

- If a mock shipment was created during setup, reset the `order_shipments` row to pending before the real booking.
- Cancel any unpaid/abandoned test orders (`status='cancelled'`) — the `return_stock_on_order_cancel` trigger restores stock automatically; never edit `qty_on_hand` directly.
- Remove any temporary debug pages before finishing.
