---
title: Payouts
description: Per-organization payout ledger for commission sellers and platform-fee history for own-company sellers
---

Payouts is the per-organization money page.
What it shows depends entirely on the active org's `seller_mode`: a commission seller sees an order-by-order payout ledger, while an own-company seller sees their monthly platform-fee history (with the option to pay a fee online through Stripe).
The cross-org summary lives in [Billing](/docs/en/admin/billing); this page is where you act on a single organization.

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 4096 | MANAGE_AUDIT | Owner, Admin, Eshop Admin (with this bit) |

Without `MANAGE_AUDIT` you are redirected to `/admin`.
An org with no active party sends you to `/admin/setup` (owner: `/admin/parties/new`).

## Commission sellers (`smalljobs_commission`)

### Summary tiles

- **Payout progress** - this month's payout total vs the 12 000 Kč monthly limit (`NO_ICO_MONTHLY_PAYOUT_LIMIT_CZK`), drawn as a progress bar.
- **Held**, **Eligible**, **Paid**, **Withheld** - running totals across the ledger.

### The ledger table

Each row is one order's commission entry (up to 200 most recent), with columns:
Order number, Gross, Tax, Commission, Net payable, Withheld, Hold until, Status, Actions.

| Status | Meaning |
|---|---|
| Held | Inside its hold window (`hold_until` in the future). A 60-day hold protects against refunds/chargebacks. |
| Eligible | `held` in the database but the hold has expired - ready to pay out. |
| Paid | Already paid out. |
| Reversed | Cancelled (e.g. the order was refunded); excluded from totals. |

### Releasing a payout

On an **Eligible** row, enter an optional **payout reference** (your bank transfer id) and click **Mark paid** (a `confirm()` guards it).
This posts `action=mark_paid`, which sets the ledger row to `paid` with `paid_at`, `paid_by`, and the reference - but only if the row is still `held` and belongs to your party (a guard against double-paying).

## Own-company sellers (`own_company`)

Instead of a ledger, this mode renders the `PlatformFeeHistory` of up to 24 monthly billing periods.
Kytka z Beskyd, which starts in own-company mode, would see its monthly 10% platform fees here.

### Paying a monthly fee online (Stripe)

The **Pay fee** action posts `action=pay_fee_online`, reads the period's `fee_amount` from `eshop_billing_periods`, and starts a Stripe Checkout session in CZK.
You are redirected to Stripe; on return the page verifies the checkout session actually reached `payment_status = "paid"` before recording it against the period.
Cancelling returns you with a "payment cancelled" notice.

### Marking a fee paid manually (owner only)

Confirming an offline payment as received is the platform's call, never the organization's own.
Only the global **owner** sees **Mark fee paid** (`action=mark_fee_paid_manual`), which marks the period's fee paid through the service-role client without an online payment.

## Data & storage (cloud)

- **Tables:** `order_commission_ledger` (`gross_amount`, `tax_amount`, `commission_amount`, `net_payable`, `withheld_amount`, `status`, `hold_until`, `paid_at`, `paid_by`, `payout_reference`), `eshop_billing_periods` (`period_start`, `fee_amount`), `parties` (`seller_mode`).
- **Services:** `listBillingPeriods`, `markBillingPeriodFeePaid` (`billingPeriodService`); `createCheckoutSession`, `retrieveCheckoutSession` (Stripe integration).
- **Client:** manual fee-paid and Stripe-confirmed writes use `createAdminClient()` (service role); the ledger mark-paid uses the session client with party/status guards.
- **Component:** `PlatformFeeHistory`.

## Related pages

- [Billing](/docs/en/admin/billing) - the cross-organization overview and the Resolve button that lands here
- [Organizations](/docs/en/admin/parties) - the Seller Mode card that determines which view this page shows
- [Reports](/docs/en/admin/reports) - billing periods and the income-tax CSV that summarizes the same figures
- [Orders](/docs/en/admin/orders) - each commission ledger entry corresponds to one order
