---
title: Inventory
description: How to track stock levels, make adjustments, and monitor low-stock items.
---

Inventory tracks how many units of each product are physically available, reserved for orders, and available to sell. Every stock change is recorded as a movement so you have a full audit trail.

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 64 | MANAGE_INVENTORY | Owner, Admin, Eshop Admin (with this bit) |

## Inventory list (`/admin/inventory`)

### Filters

| Toggle | Shows |
|---|---|
| All | Every inventory item |
| Low Stock | Only items where `qty_on_hand` is at or below `low_stock_threshold` |

Low stock items display the quantity in **red**.

### Table columns

| Column | Description |
|---|---|
| Product | The product this inventory item belongs to |
| Variant | Product variant (e.g. size, color) if applicable |
| Qty on hand | Units physically in stock |
| Qty reserved | Units allocated to confirmed/processing orders (not yet shipped) |
| Qty available | `qty_on_hand − qty_reserved` — what can actually be sold right now |
| Low stock threshold | Alert level — when `qty_on_hand` drops to or below this, item shows in Low Stock filter |

## Understanding the three quantities

```
qty_on_hand = qty_reserved + qty_available
```

- **On hand**: physical count of units in your warehouse
- **Reserved**: units "held" for orders that have been confirmed but not yet shipped — the customer has paid, the item is committed
- **Available**: what's actually free to sell to new customers

When a new order is confirmed, `qty_reserved` increases. When the order ships, `qty_reserved` decreases and `qty_on_hand` decreases (the item left the warehouse).

## Adjusting stock

Each row has an inline form. To adjust:

1. Enter the **quantity** as a signed integer:
   - Positive number (e.g. `+50`) to add stock
   - Negative number (e.g. `-3`) to reduce stock
2. Select the **movement type** (see below)
3. Add an optional **note** (e.g. "Restock from supplier ABC, invoice #1234")
4. Click **Apply**

The adjustment records a new entry in `stock_movements` and updates `qty_on_hand` immediately.

### Movement types

| Type | When to use | Effect |
|---|---|---|
| `purchase` | New stock arrived from supplier | Increases `qty_on_hand` |
| `adjustment` | Manual correction (count discrepancy, data fix) | Increases or decreases depending on signed quantity |
| `return` | Customer return restocked (usually done automatically via [Returns](/admin/returns)) | Increases `qty_on_hand` |
| `damage` | Items damaged/expired/lost and written off | Decreases `qty_on_hand` |

## What happens when stock hits 0

When `qty_available = 0`:
- The product is shown as "out of stock" on the eshop
- Customers cannot add it to their cart
- Existing reserved quantities (from confirmed orders) are not affected

When `qty_on_hand = 0`:
- All of the above, plus reserved stock becomes a problem — orders may be stuck without product to ship

Keep an eye on the Low Stock filter to restock before hitting zero.

## Setting up inventory for a new product

When you create a product in [Products](/admin/products), an inventory item is not created automatically. To set up inventory:

1. Go to `/admin/inventory`
2. Find the product's inventory row (created automatically by a DB trigger when a product is saved, or check with your Owner if the row is missing)
3. Make a `purchase` adjustment with your initial stock quantity
4. Set the `low_stock_threshold` to your reorder point

## Related pages

- [Products](/admin/products) — products that have inventory items
- [Orders](/admin/orders) — confirmed orders increase `qty_reserved`
- [Returns & Refunds](/admin/returns) — completed returns with `restock = true` automatically add back to inventory
