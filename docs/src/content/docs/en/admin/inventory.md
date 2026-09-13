---
title: Inventory
description: Track stock per product variant, set low-stock and max thresholds, and record stock movements
---

Inventory tracks stock levels for every sellable item.
Because a [product](/docs/en/admin/products) is always a group of variants, there is exactly one inventory row per variant (`inventory_items`), and the storefront stock label a customer sees is derived from these numbers, never typed by hand.
You can adjust the same numbers from inside the product editor, but this page gives you the whole catalog at once.

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 64 | MANAGE_INVENTORY | Owner, Admin, Eshop Admin (with this bit) |

Without `MANAGE_INVENTORY` you are redirected to `/admin`.
An eshop admin with no organization is sent to `/admin/setup` (owner: `/admin/parties/new`).

## Inventory list (`/admin/inventory`)

Rows are paginated 30 at a time and can be narrowed with three filter tabs, each showing a live count:

| Tab | Shows |
|---|---|
| All | Every tracked item (`inventoryResult.total`). |
| Low stock | Items where `qty_on_hand <= low_stock_threshold` and still above zero. |
| Out of stock | Items where `qty_on_hand <= 0`. |

### Columns

| Column | Description |
|---|---|
| Product | Title, linking to `/admin/products/{id}`. Falls back to a truncated id if the title is missing. |
| Variant | The variant name, or a dash for single-variant products. |
| On hand | `qty_on_hand`. Turns red when the item is at or below its low-stock threshold. |
| Reserved | `qty_reserved` - units held by open orders/carts. |
| Available | `qty_available` - the sellable figure (on hand minus reserved). |
| Threshold | The Min (low-stock) and Max thresholds stacked; a red "Low stock" badge appears when tripped. |
| Update thresholds | Inline form (see below). |
| Adjust | Inline stock-movement form (see below). |

### Update thresholds form

Two number inputs (Min / Max) plus **Apply**.
Posts `action=update_thresholds` and calls `updateThresholds`.
A value of `0` or blank is stored as `null` (meaning "no threshold"), so the Min column shows a dash rather than zero.

- **Min (`low_stock_threshold`)** - the point at which the item counts as low stock and the red badge appears.
- **Max (`max_threshold`)** - the target ceiling, useful for restock planning.

### Adjust stock form

A signed quantity, a movement type, an optional note, then **Apply**.
Posts to `updateStock`, which writes both the new `qty_on_hand` and a row in `stock_movements` stamped with `created_by`.

| Movement type | Meaning |
|---|---|
| adjustment | Manual correction (e.g. stock take). |
| purchase | New units received. |
| return | Units coming back from a customer return. |
| damage | Units written off. |

Enter a positive number to add units, a negative number to remove them.

### On-demand (always in stock)

Some products are made to order and should never show "out of stock" - Kytka z Beskyd's "Na zakázku" wreaths are the example.
For those, open the item in the [product editor](/docs/en/admin/products) and tick **On demand**, which sets `inventory_items.track_inventory = false`.
Untracked items surface an "on demand" storefront badge instead of a stock count, and they are not filtered out for anonymous shoppers.

## Empty state and pagination

When no rows match the current tab, a centered "No inventory" row is shown.
Previous / Next links and a "Page X of Y" indicator appear when there is more than one page; the active filter is preserved across pages.

## Data & storage (cloud)

- **Tables:** `inventory_items` (`product_id`, `variant_id`, `variant_name`, `qty_on_hand`, `qty_reserved`, `qty_available`, `low_stock_threshold`, `max_threshold`, `track_inventory`), `stock_movements` (`inventory_item_id`, `party_id`, `quantity`, `type`, `note`, `created_by`).
- **Services:** `fetchInventory`, `updateStock`, `updateThresholds` (`inventoryService`).
- **Triggers:** inventory rows are auto-created for each product/variant (`create_default_inventory_item` / `ensure_variant_inventory_item`).
- All queries are scoped to `ctx.partyId`.

## Related pages

- [Products](/docs/en/admin/products) - the same adjust/threshold/on-demand controls live in the product editor per variant
- [Orders](/docs/en/admin/orders) - open orders drive the Reserved quantity; returns can feed a "return" movement here
- [Returns](/docs/en/admin/returns) - restocking a returned item is where a "return" movement typically originates
