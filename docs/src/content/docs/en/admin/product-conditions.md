---
title: Product Conditions
description: Define the color-coded condition labels products and variants can carry - including the made-to-order pattern
---

Product conditions are the short, color-coded labels a product or variant can wear on the storefront - "Nové", "Zánovní", "Stav A", or Kytka z Beskyd's "Na zakázku".
Conditions are defined per organization, then chosen from the **Condition** dropdown when editing a [product](/docs/en/admin/products).
This page lives at `/admin/products/conditions`.

A condition is a *label*, not a stock state.
Whether an item is "in stock" is derived from [Inventory](/docs/en/admin/inventory), never set here as a manual condition.

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 8 | MANAGE_PRODUCTS | Owner, Admin, Eshop Admin (with this bit) |

This is the same bit that gates [Products](/docs/en/admin/products) and [Reviews](/docs/en/admin/reviews).
Without it you are redirected to `/admin`; with no admin role at all to `/dashboard`; an eshop admin with no org goes to `/admin/setup`.

## The page (`/admin/products/conditions`)

The screen has two parts: a create/edit form card at the top, and a table of existing conditions below.
A **Products** back-link at the top returns you to the product list.

### Create / edit form

The form heading reads "New condition" or "Edit condition" depending on whether you arrived with `?edit={id}`.

| Field | Required | Column | Notes |
|---|---|---|---|
| Code | Yes | `product_conditions.code` | Short internal key, trimmed on save, e.g. `made_to_order`, `a`, `new`. |
| Label | Yes | `product_conditions.label` | The customer-facing text, trimmed, e.g. `Na zakázku`, `Stav A`. |
| Color | No | `product_conditions.color_hex` | A native color-picker input; defaults to `#7CB342` when left unset. |
| Sort order | No | `product_conditions.sort_order` | Integer ordering, defaults to `0`. |
| Active | No | `product_conditions.is_active` | Checkbox, ticked by default for new conditions. |

Buttons: **Create** (new) or **Save** (edit), plus a **Cancel** link that only appears while editing (it clears `?edit`).
On success the page redirects back to `/admin/products/conditions`.

### Conditions table

| Column | Source | Notes |
|---|---|---|
| Code | `code` | Bold. |
| Label | `label` | |
| Color | `color_hex` | A small rounded swatch filled with the hex color, followed by the hex string. |
| Sort | `sort_order` | |
| Status | `is_active` | `badge-active` ("Active") or `badge-inactive` ("Inactive"). |
| Actions | | **Edit** link and a **Delete** button (confirm dialog). |

When there are no conditions the table shows a single centered "No conditions" row.

## The made-to-order pattern (Kytka z Beskyd)

Kytka z Beskyd repurposes the condition concept for a made-to-order florist shop.
The org seeds exactly one condition:

| Code | Label | Color | Sort |
|---|---|---|---|
| `made_to_order` | Na zakázku | `#C97B4A` | 1 |

How it is used across the catalog:

- Products and variants that are crafted to order carry this `condition_id`; in-stock items carry `NULL` (no label at all).
- There is deliberately **no** "in stock" condition - being in stock is derived from inventory, so a manual label would be redundant and could drift out of sync.
- Made-to-order variants are set `track_inventory = false` in [Inventory](/docs/en/admin/inventory), so a craft business is never wrongly shown as sold out - it can always take the order.

The storefront reads the assigned condition to render the "Na zakázku" tag, and reads inventory (not any condition) to decide the in-stock / out-of-stock state.

## Data & storage (cloud)

- **Table:** `product_conditions` (id, party_id, code, label, color_hex, sort_order, is_active, created_at, updated_at). Rows are scoped to the current org via `party_id`.
- **Referenced by:** `products.condition_id` and `product_variants.condition_id`.
- **Service:** `productConditionService` (`fetchProductConditions`, `createProductCondition`, `updateProductCondition`, `deleteProductCondition`).
- No Storage buckets or Edge Functions are involved.

## Related pages

- [Products](/docs/en/admin/products) - the Condition dropdown in the product editor picks from these labels
- [Inventory](/docs/en/admin/inventory) - where the real in-stock / made-to-order (`track_inventory`) behavior lives
- [Categories](/docs/en/admin/categories) - the other way products are organized for browsing
