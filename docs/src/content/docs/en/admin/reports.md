---
title: Reports
description: Revenue, orders, products, and customer analytics with CSV exports and monthly billing periods
---

Reports turns the raw data behind [Orders](/docs/en/admin/orders), [Products](/docs/en/admin/products), and [Customers](/docs/en/admin/customers) into at-a-glance KPI cards, 12-month trend charts, and downloadable CSVs.
It also hosts the monthly **billing periods** table, which is the basis for income-tax exports and, for commission sellers, for [Payouts](/docs/en/admin/payouts).

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 512 | MANAGE_REPORTS | Owner, Admin, Eshop Admin (with this bit) |

Without `MANAGE_REPORTS` you are redirected to `/admin`.
The billing-period **write** actions (recompute, fee mode) additionally require `MANAGE_AUDIT` (bit 4096); a report-only viewer sees the periods but cannot trigger a recompute.

## The four KPI cards (`/admin/reports`)

Each card shows two headline stats, a chart, and an **Export CSV** button.

| Card | Stats | Chart |
|---|---|---|
| Revenue | This month, this year (summed `orders.total_amount`) | 12-month revenue bar chart (`MiniBarChart`) |
| Orders | This month, total orders | 12-month order-count bar chart |
| Products | Total products, active products | Top-5 products by revenue (`TopProductsBars`, with units sold) |
| Customers | Registered customers, guest customers | 12-month new-customer bar chart |

The series come from `fetchMonthlySeries`, `fetchTopProducts`, and `fetchCustomerStats` in `reportsAnalytics`, all scoped to the active party.

## CSV export (`/admin/reports/export.csv?type=`)

Each card's **Export CSV** button hits the same endpoint with a different `type`.
The export runs through the viewer's own session, so RLS keeps it scoped to their party.

| `type` | File | Columns |
|---|---|---|
| `revenue` | `reports-revenue.csv` | `month`, `revenue` (12 months) |
| `orders` | `reports-orders.csv` | `month`, `orders` (12 months) |
| `products` | `reports-products.csv` | `title`, `units`, `revenue` (top 50) |
| `customers` | `reports-customers.csv` | totals block (`total`, `registered`, `guests`), then a blank line, then `month`, `new_customers` |

Values are CSV-escaped (quotes doubled, fields with commas/newlines quoted); money is written with two decimals.

## Monthly billing periods

Below the KPI cards, the `BillingPeriodsSection` lists up to 13 recent monthly periods.
On page load the current month is recomputed automatically; if you hold `MANAGE_AUDIT` a **Recompute** action lets you force-recompute a past period.
All billing writes go through the service-role client (the same privilege boundary as the monthly-fee cron), never the viewer's own client.

### Billing-periods CSV (`/admin/reports/billing-periods.csv`)

This income-tax export returns up to 60 periods and deliberately puts gross and net figures in one file so there is nothing to reconcile across downloads.

Columns: `period_start`, `period_end`, `seller_mode`, `gross_revenue`, `real_costs`, `net_revenue`, `fee_mode`, `fee_rate`, `fee_amount`, `net_payout`, `currency`, `status`.

- **gross_revenue** - hrubý obrat (total taken).
- **net_revenue** - after real costs.
- **net_payout** - after platform fee, for commission sellers.
- **fee_rate** - four-decimal rate, blank when there is no fee.

## Data & storage (cloud)

- **Aggregated from:** `orders`, `order_items`, `products`, and customer profiles.
- **Services:** `fetchMonthlySeries`, `fetchTopProducts`, `fetchCustomerStats` (`reportsAnalytics`); `listBillingPeriods`, `recomputeBillingPeriod` (`billingPeriodService`).
- **Client:** billing recompute uses `createAdminClient()` (service role); reads use the session client.
- **Components:** `MiniBarChart`, `TopProductsBars`, `BillingPeriodsSection`.

## Related pages

- [Orders](/docs/en/admin/orders) - the source of revenue and order counts
- [Customers](/docs/en/admin/customers) - the source of registered vs guest counts
- [Billing](/docs/en/admin/billing) - the current period and platform fee for this org
- [Payouts](/docs/en/admin/payouts) - commission-seller payouts derived from billing periods
- [Audit Log](/docs/en/admin/audit) - the `MANAGE_AUDIT` bit that also unlocks billing-period recompute
