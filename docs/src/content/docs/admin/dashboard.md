---
title: Dashboard
description: Understanding the admin dashboard and its KPI cards.
---

## What you see on the dashboard

When you log in to the admin panel, the **Dashboard** (`/admin`) shows a quick overview of your shop's current state.

## KPI cards

The dashboard shows **6 stat cards** at the top:

| Card | What it shows |
|------|---------------|
| Total Products | Count of all products in your catalog |
| Active Products | Products with status = "active" (visible to customers) |
| Total Orders | All orders ever placed |
| Pending Orders | Orders waiting to be processed |
| Total Customers | Registered customer accounts |
| Low Stock Items | Inventory items below their threshold |

These numbers update in real time every time you reload the page.

## Recent orders

Below the KPI cards, you see a list of the most recent orders. Click any order number to open its detail page and process it.

## Sidebar navigation

The left sidebar links to every section of the admin panel. Which links you see depends on your role and permissions — sections you don't have access to are hidden.

## Getting to the dashboard

- Direct URL: `http://localhost:4321/admin` (local) or your production domain `/admin`
- After logging in, you are redirected to `/dashboard` (public profile page). Click the "Admin" link to go to the admin panel.
- Bookmark `/admin` for quick access.

## No organization yet?

If you log in and see a message saying you need to join an organization, contact your Owner to add you to a party. Without an organization, you cannot manage any data.
