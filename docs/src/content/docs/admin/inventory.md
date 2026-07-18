---
title: Inventory
description: How to track and adjust stock levels.
---

## What inventory tracks

Each **inventory item** links a product to a warehouse and tracks:

- **Qty on hand** — how many units are physically in stock
- **Qty reserved** — units allocated to pending orders
- **Low stock threshold** — if qty drops below this, the item shows as "Low Stock"

## Where to find inventory

Go to **Admin → Inventory** (`/admin/inventory`).

## Filters

At the top, two buttons filter the list:

| Filter | Shows |
|--------|-------|
| **All** | Every inventory item |
| **Low Stock** | Only items where `qty_on_hand ≤ low_stock_threshold` |

Low stock items show a **red badge** and the quantity is displayed in red.

## Making a stock adjustment

Each row in the inventory table has an inline adjustment form:

1. Enter the **quantity** (positive number — the system handles direction based on type)
2. Select the **type**:
   - `purchase` — new stock arrived, quantity increases
   - `sale` — sold to customer, quantity decreases
   - `return` — customer returned item, quantity increases
   - `damage` — stock written off, quantity decreases
   - `adjustment` — manual correction
3. Optionally add a **note** (e.g. "Restock from supplier XYZ")
4. Click **Apply**

The quantity updates immediately and the change is recorded in the adjustment history.

## Warehouses

Inventory items are linked to a **warehouse**. Each organization can have multiple warehouses. One warehouse can be set as the **default**.

Warehouses are managed under **Admin → Inventory** (warehouse tab, if configured).

## Low stock alerts

When an inventory item's `qty_on_hand` drops below its `low_stock_threshold`:
- The dashboard KPI card "Low Stock Items" increments
- The item shows in the Low Stock filter
- The quantity is displayed in red in the inventory table

Set the threshold based on your reorder point — e.g. if you order a product when you have fewer than 10 units left, set the threshold to 10.

## Adding inventory for a new product

When you create a product, it doesn't automatically have inventory. You need to create an inventory item:

1. Go to **Admin → Inventory**
2. The product should appear if the database has an inventory item for it, or set it up via SQL or a future UI
3. Set initial `qty_on_hand` via a `purchase` adjustment
