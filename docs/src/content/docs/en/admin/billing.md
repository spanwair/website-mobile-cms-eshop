---
title: Billing
description: Cross-organization overview of every party's pricing mode, current-month charge, and outstanding balance
---

Billing is a platform-level, cross-party overview.
It puts every organization you can see - its pricing mode, this month's charge, and its outstanding balance - on one screen, so you never have to switch the active party and hunt through each org's [Payouts](/docs/en/admin/payouts) individually.
It is always scoped to `ctx.parties`: an owner sees every party, an admin sees only the ones assigned to them.

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 4096 | MANAGE_AUDIT | Owner, Admin, Eshop Admin (with this bit) |

Without `MANAGE_AUDIT` you are redirected to `/admin`.
This is the same bit that gates the [Audit Log](/docs/en/admin/audit) and party-settings editing in [Organizations](/docs/en/admin/parties).

## The two pricing modes

Each organization has a `seller_mode` (set on the Seller Mode card in [Organizations](/docs/en/admin/parties)), and Billing shows different numbers per mode:

| Mode | Badge | How it is charged |
|---|---|---|
| Own company (`own_company`) | green "Own company" | `COMMISSION_RATE` (10%) of monthly turnover, dropping to `REDUCED_COMMISSION_RATE` (5%) on the whole month once turnover passes `COMMISSION_REDUCED_THRESHOLD_CZK` (29 900 Kč), billed as a monthly platform fee. Any of these three can be overridden per organization (see [Organizations](/docs/en/admin/parties)). Kytka z Beskyd starts in this mode. |
| Commission (`smalljobs_commission`) | amber "Commission" | Per-order commission held in a ledger, with a `NO_ICO_MONTHLY_PAYOUT_LIMIT_CZK` (12 000 Kč) monthly payout limit. |

## The overview table (`/admin/billing`)

| Column | Own-company org | Commission org |
|---|---|---|
| Organization | Party name. | Party name. |
| Mode | Pricing-mode badge. | Pricing-mode badge. |
| This month | Current month's fee with the applied rate (10% or the reduced 5%), plus a paid/unpaid badge; "no activity yet" when there is no fee row. | Payout so far this month vs the 12 000 Kč limit, drawn as a progress bar, plus a red "withheld" note when any amount was withheld. |
| Outstanding | Total unpaid fee amount and how many unpaid months, or "nothing due". | Total eligible-to-pay amount and how many ledger entries are ready, or "nothing due". |
| Actions | **Resolve** button. | **Resolve** button. |

### The Resolve action

**Resolve** posts to `/api/switch-party`, switching your active party to that organization and redirecting you to its [Payouts](/docs/en/admin/payouts) page, where you actually mark a fee paid or release a payout.
Billing itself is read-only; it never changes a balance.

## Data & storage (cloud)

- **Tables:** `parties` (`seller_mode`), `monthly_platform_fees` (own-company fees: `period_month`, `fee_amount`, `status`), `order_commission_ledger` (commission entries: `net_payable`, `withheld_amount`, `status`, `hold_until`).
- **Constants:** `SELLER_MODE`, `COMMISSION_RATE`, `REDUCED_COMMISSION_RATE`, `COMMISSION_REDUCED_THRESHOLD_CZK`, `NO_ICO_MONTHLY_PAYOUT_LIMIT_CZK` from `shared/constants/sellerMode.ts`. Per-organization overrides live on `parties` (`commission_rate_override`, `reduced_commission_rate_override`, `commission_threshold_override`) and are resolved by `resolveFeeSchedule()` in `shared/utils/billingFeeCalc.ts`.
- Reads only; scoped to `ctx.parties`.

## Related pages

- [Payouts](/docs/en/admin/payouts) - the per-organization page where fees are paid and commission payouts released
- [Organizations](/docs/en/admin/parties) - the Seller Mode card that decides which pricing model an org is on
- [Reports](/docs/en/admin/reports) - monthly billing periods and the income-tax CSV export
