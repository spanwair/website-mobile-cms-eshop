---
title: Reports
description: How to view revenue, order, product, and customer summary metrics.
---

The Reports page provides a high-level summary of your organization's business performance. It shows the current month's numbers and totals for the key metrics. Data is scoped to your organization only.

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 512 | MANAGE_REPORTS | Owner, Admin (with this bit) |

## Reports page (`/admin/reports`)

The page displays four metric cards arranged in a grid:

### Revenue card

| Metric | Description |
|---|---|
| This month | Sum of all order grand totals for the current calendar month |
| YTD | Sum of all order grand totals from January 1st to today |

A chart placeholder is shown below the numbers. The **Export CSV** button is present but currently disabled — CSV export is a planned feature on the [roadmap](/roadmap/future).

### Orders card

| Metric | Description |
|---|---|
| This month | Total number of orders placed in the current calendar month |
| Total | Total number of orders across all time |

Chart placeholder and disabled Export CSV button — same as Revenue.

### Products card

| Metric | Description |
|---|---|
| Total | Total number of products in your organization's catalog |
| Active | Products with `status = 'active'` (visible on the eshop) |

### Customers card

Currently shows an empty placeholder. Customer metrics are on the roadmap.

## What "this month" means

"This month" always means the **current calendar month** — January 1–31, February 1–28/29, etc. It resets at midnight on the first day of each month.

## Limitations of the current reports

- **Charts are placeholders** — the visual graphs are not yet implemented
- **CSV export is disabled** — downloading data requires going to the Supabase dashboard directly
- **Customer metrics** are not yet implemented
- **No date range selector** — you cannot currently view reports for a custom time period

For detailed filtering and historical data, go to:
- [Orders](/admin/orders) — filter by status and review order-by-order
- [Products](/admin/products) — see all products with status filters
- [Customers](/admin/customers) — browse customer records

## Related pages

- [Orders](/admin/orders) — detailed order data underlying the revenue and order metrics
- [Products](/admin/products) — product count data underlying the products metric
- [Customers](/admin/customers) — customer data (metric coming soon)
- [Dashboard](/admin/dashboard) — similar KPIs shown at a glance on the home page
