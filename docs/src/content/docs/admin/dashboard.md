---
title: Dashboard
description: The admin dashboard gives you an at-a-glance overview of your store's key performance indicators, recent orders, and activity.
---

The Dashboard is the home page of your admin panel. It shows live KPIs, your five most recent orders, and a summary of recent activity. Every admin with the **VIEW_DASHBOARD** permission lands here after login.

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 1 | VIEW_DASHBOARD | Owner, Admin, Eshop Admin |

If your role does not include VIEW_DASHBOARD, you are redirected to [Notifications](/admin/notifications) instead.

## Understanding the KPI cards

Four cards appear at the top of the dashboard:

| Card | What it shows |
|---|---|
| Total Users | Count of all profiles in your organization |
| Active Users | Profiles where `is_active = true` |
| Products | Total products belonging to your organization |
| Orders | Total order count across all statuses |
| Revenue | Sum of all order totals (all time) |

These numbers update on every page load — they always reflect the current state of the database.

## Recent orders table

The table shows the **5 most recent orders** for your organization. Each row contains:

| Column | Description |
|---|---|
| Order number | Unique identifier — click to open the full [order detail](/admin/orders) |
| Status | Current order status (Pending, Confirmed, Processing, etc.) |
| Total | Order grand total including tax and shipping |
| Date | When the order was placed |

Click any row to go directly to that order's detail page.

## Revenue chart

The revenue chart area is currently a placeholder. Full chart functionality is on the [roadmap](/roadmap/future).

## Recent activity

The recent activity section shows a stub of the audit log. For the full audit trail, go to [Audit Log](/admin/audit) (requires MANAGE_AUDIT permission).

## How to use

1. Check the KPI cards each morning to spot unexpected drops in active users or orders.
2. Use the Recent Orders table to quickly open and process orders that just came in.
3. If a KPI looks wrong, navigate to the relevant section — [Orders](/admin/orders), [Products](/admin/products), or [Customers](/admin/customers) — to investigate.
4. If you see "No organization yet" instead of the dashboard, ask your Owner to add you via [Organizations](/admin/parties).

## Related pages

- [Orders](/admin/orders) — full order list and processing
- [Products](/admin/products) — manage your product catalog
- [Reports](/admin/reports) — revenue and order aggregations
- [Organizations](/admin/parties) — manage your organization settings
- [Audit Log](/admin/audit) — full activity history
