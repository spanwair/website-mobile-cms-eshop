---
title: Dashboard
description: The admin home page with KPI tiles, a product overview, recent orders, and a revenue panel, all gated per role and permission
---

The dashboard at `/admin` is the landing page of the admin panel.
It shows a set of KPI tiles, an optional product overview, a recent-orders table, a revenue panel, and a recent-activity panel.
Crucially, **which of these blocks you see depends entirely on your permission bits** - the page builds itself from the exact set of things you are allowed to manage.

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 1 | VIEW_DASHBOARD | Owner, Admin, Eshop Admin (with this bit) |

If you lack `VIEW_DASHBOARD` you are redirected to [`/admin/notifications`](/docs/en/admin/notifications) rather than to `/admin`, because notifications are the one page every admin can always reach.

## Access and redirect chain

The page applies these checks in order before rendering anything:

| Condition | Redirect |
|---|---|
| No login session | `/login` |
| `requireAdminCtx` returns `null` | `/dashboard` |
| Not an owner and no `ctx.partyId` | `/admin/setup` |
| Role = ADMIN with a party, but 0 categories or 0 products | `/admin/onboarding/tutorial` (see [Onboarding](/docs/en/admin/onboarding)) |
| Missing `VIEW_DASHBOARD` | `/admin/notifications` |

## Info banners

Depending on state, one of several banners appears above the tiles.

- **Tables not ready**: if a probe query against `parties` fails, a warning banner explains the database is not set up yet.
- **Owner with no organization**: a banner invites the owner to [create their first organization](/docs/en/admin/parties).
- **Non-owner with no organization**: a warning banner points to the [Organizations](/docs/en/admin/parties) list.
- **Onboarding checklist**: for a non-admin who can manage products but whose org has no categories or products, a banner links to the [onboarding tutorial](/docs/en/admin/onboarding).

## KPI tiles

The tiles row is assembled conditionally.
Each group only appears if you hold the matching permission, so an eshop admin with a narrow custom role may see just one or two tiles.

| Tile | Shown when you have | Value source |
|---|---|---|
| Total users | MANAGE_USERS (2) | Count of all users returned by `fetchUsersForAdmin`, scoped to your role and party |
| Active users | MANAGE_USERS (2) | Count of those users whose role is above plain USER |
| Total products | MANAGE_PRODUCTS (8) | Total product count for the party |
| Active products | MANAGE_PRODUCTS (8) | Count of products with status `active` |
| Total orders | MANAGE_ORDERS (32) | Total order count for the party |
| Revenue (this month) | MANAGE_ORDERS (32) or MANAGE_REPORTS (512) | Sum of `total_amount` across orders created since the 1st of the current month |

Revenue is formatted in the organization's currency.
For [Kytka z Beskyd](/docs/en/admin/parties) that means CZK.

## Product overview

If you can manage products and overview data is available, a **Products Overview** section renders below the tiles.
It is built from `fetchProductOverview` (a 30-day window) plus a `fetchProductActivityLog` feed (the 40 most recent product events), and shows aggregate product stats and a recent-activity timeline.

## Recent orders and revenue

When you can manage orders or view reports, a two-column grid appears.

- **Recent orders** (needs MANAGE_ORDERS): a table of the last 5 orders with columns Order number (links to the [order detail](/docs/en/admin/orders)), Status, Total, and Date.
  Status is shown as a color-coded badge: pending is amber, confirmed / shipped / delivered are green, processing is a draft/grey badge, and cancelled is red.
  Refunded and any unknown status fall back to a neutral badge.
  If there are no orders, an empty-state message shows instead of the table.
- **Revenue panel** (needs MANAGE_ORDERS or MANAGE_REPORTS): currently a placeholder box reading that the chart is coming soon.

## Recent activity

If you hold MANAGE_AUDIT (4096), a **Recent activity** card renders at the bottom.
Today it displays an empty-state placeholder; the full [audit log](/docs/en/admin/audit) is the dedicated page for that data.

## Data & storage (cloud)

- `profiles` and `parties` via `requireAdminCtx`.
- `categories` and `products` count queries (used for the onboarding redirect and banner).
- `fetchUsersForAdmin` reads `profiles` (and membership) for the user KPIs.
- `fetchProducts` reads `products` for the product KPIs.
- `fetchOrders` reads `orders` for the recent-orders table and the monthly revenue sum.
- `fetchProductOverview` and `fetchProductActivityLog` read product statistics and the product activity log.
- The page writes nothing.

## Related pages

- [Notifications](/docs/en/admin/notifications) - fallback destination when you lack VIEW_DASHBOARD
- [Onboarding](/docs/en/admin/onboarding) - where admins are sent while their catalog is empty
- [Orders](/docs/en/admin/orders) - full order management behind the recent-orders table
- [Reports](/docs/en/admin/reports) - detailed revenue and sales reporting
- [Products](/docs/en/admin/products) - catalog behind the product KPIs and overview
- [Organizations](/docs/en/admin/parties) - create or switch the organization the dashboard reports on
