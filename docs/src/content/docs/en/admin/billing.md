---
title: Billing
description: Cross-organization overview of every party's pricing mode, current-month charge, and outstanding balance
---

Billing is a platform-level, cross-party overview.
It puts every organization you can see - its pricing mode, this month's ledger activity, and its outstanding balance - on one screen, so you never have to switch the active party and hunt through each org's [Payouts](/docs/en/admin/payouts) individually.
It is always scoped to `ctx.parties`: an owner sees every party, an admin sees only the ones assigned to them.

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 4096 | MANAGE_AUDIT | Owner, Admin, Eshop Admin (with this bit) |

Without `MANAGE_AUDIT` you are redirected to `/admin`.
This is the same bit that gates the [Audit Log](/docs/en/admin/audit) and party-settings editing in [Organizations](/docs/en/admin/parties).

## The two pricing modes

Each organization has a `seller_mode` (set on the Seller Mode card in [Organizations](/docs/en/admin/parties)). Both modes are now sourced from the same per-order ledger (`order_commission_ledger`) — only the rate and hold rules differ:

| Mode | Badge | How it is charged |
|---|---|---|
| Own company (`own_company`) | green "Own company" | A tiered, marginal-bracket rate from `COMMISSION_TIERS` (5% down to 3%, by monthly-turnover band, see [Pricing](/docs/en)) per order — each order is a blend across every band its slice of the month's turnover touches, held for `OWN_COMPANY_PAYOUT_HOLD_DAYS` (14 days). Overridable per organization via `resolveFeeSchedule()` (see [Organizations](/docs/en/admin/parties)) — this is how a negotiated "own eshop" enterprise schedule above the public ladder's top band is set. Kytka z Beskyd starts in this mode. |
| Commission (`smalljobs_commission`) | amber "Commission" | A flat `NO_ICO_DEDUCTION_RATE` (30%) per order, held for `PAYOUT_HOLD_DAYS` (60 days), with a `NO_ICO_MONTHLY_PAYOUT_LIMIT_CZK` (12 000 Kč) monthly payout limit. |

## The overview table (`/admin/billing`)

| Column | Own-company org | Commission org |
|---|---|---|
| Organization | Party name. | Party name. |
| Mode | Pricing-mode badge. | Pricing-mode badge. |
| This month | This month's gross turnover and commission deducted; "no activity yet" when there are no ledger rows this month. | Payout so far this month vs the 12 000 Kč limit, drawn as a progress bar, plus a red "withheld" note when any amount was withheld. |
| Outstanding | Total eligible-to-pay amount and how many orders are ready, or how many are still in their hold period, or "nothing due". | Same. |
| Actions | **Resolve** button. | **Resolve** button. |

### The Resolve action

**Resolve** posts to `/api/switch-party`, switching your active party to that organization and redirecting you to its [Payouts](/docs/en/admin/payouts) page, where you actually release a payout.
Billing itself is read-only; it never changes a balance.

## Data & storage (cloud)

- **Tables:** `parties` (`seller_mode`), `order_commission_ledger` (`gross_amount`, `commission_amount`, `net_payable`, `withheld_amount`, `status`, `hold_until`, `created_at`) — the single source for both seller modes now.
- **Constants:** `SELLER_MODE`, `COMMISSION_TIERS`, `COMMISSION_ENTRY_RATE`, `COMMISSION_ENTERPRISE_THRESHOLD_CZK`, `OWN_COMPANY_PAYOUT_HOLD_DAYS`, `NO_ICO_DEDUCTION_RATE`, `PAYOUT_HOLD_DAYS`, `NO_ICO_MONTHLY_PAYOUT_LIMIT_CZK` from `shared/constants/sellerMode.ts`. The per-organization override lives on `parties` (`commission_tiers_override`, a JSONB tier array) and is resolved by `resolveFeeSchedule()` in `shared/utils/billingFeeCalc.ts`; the per-order blend is computed by `computeTieredCommission()` in the same file.
- Reads only; scoped to `ctx.parties`.

## Related pages

- [Payouts](/docs/en/admin/payouts) - the per-organization page where payouts are actually released
- [Organizations](/docs/en/admin/parties) - the Seller Mode card that decides which pricing model an org is on
- [Reports](/docs/en/admin/reports) - monthly statements and the income-tax CSV export
