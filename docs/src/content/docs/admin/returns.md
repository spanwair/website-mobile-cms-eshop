---
title: Returns & Refunds
description: How to process RMA (Return Merchandise Authorization) requests from customers.
---

Returns allow customers to send back products for a refund, exchange, or store credit. Every return is linked to an original [order](/admin/orders) and [customer](/admin/customers). Completed returns with restockable items automatically update [inventory](/admin/inventory).

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 32 | MANAGE_ORDERS | Owner, Admin, Eshop Admin (with this bit) |

This is the **same permission as [Orders](/admin/orders)**.

## Return list (`/admin/returns`)

Status tabs filter the list:

| Tab | Shows |
|---|---|
| All | Every return request |
| Pending | New requests awaiting your decision |
| Approved | Approved — customer is sending the item back |
| Received | Parcel arrived at your warehouse |
| Processing | You are processing the resolution |
| Completed | Fully resolved |
| Rejected | Declined returns |
| Cancelled | Cancelled before being received |

Each row shows: RMA number, order link, customer link, return reason, status badge, refund amount, and date.

## Return lifecycle

```
pending → approved → received → processing → completed
        ↘ rejected
        ↘ cancelled
```

| Status | Your action |
|---|---|
| `pending` | Review the request — approve or reject |
| `approved` | Send the customer a return shipping label |
| `received` | Parcel arrived — inspect items |
| `processing` | Issue the actual refund/exchange in your payment provider |
| `completed` | Mark done — inventory auto-restocks items with `restock = true` |
| `rejected` | Send the customer an explanation |
| `cancelled` | No action needed |

## Processing a return step by step

1. Go to `/admin/returns` → **Pending** tab → click **Detail**.
2. Read the customer's **reason** and **notes**.
3. Check the **items table** — each returned item shows: product name, SKU, quantity ordered, quantity being returned, condition, and restock checkbox.
4. Set status to **Approved** and save → contact the customer with a shipping label.
5. When the parcel arrives at your warehouse, set status to **Received** → the `received_at` timestamp is recorded automatically.
6. Inspect items. For items in sellable condition, ensure `restock = true` is checked.
7. Fill in the **resolution form**:
   - **Resolution**: `refund`, `exchange`, or `store_credit`
   - **Refund amount**: exact amount to return
   - **Refund method**: how to return the money (see below)
   - **Notes**: internal notes about the decision
8. Set status to **Processing**.
9. Issue the refund in your payment provider (Stripe, etc.) — the system does not do this automatically.
10. Set status to **Completed**. Items with `restock = true` are automatically added back to inventory.

## Return reason labels

| Reason code | Meaning |
|---|---|
| `wrong_item` | Customer received the wrong product |
| `damaged` | Item arrived damaged in transit |
| `defective` | Product stopped working / manufacturing defect |
| `not_as_described` | Product differs from what was shown on the eshop |
| `changed_mind` | Customer changed their mind after purchase |
| `quality_issue` | Quality below expectations |
| `size_issue` | Size doesn't fit (typically clothing/shoes) |
| `other` | Other reason — see customer notes |

## Resolution types

| Resolution | When to use | Effect |
|---|---|---|
| `refund` | Customer wants money back | Issue refund in your payment provider |
| `exchange` | Customer wants a different item/size | Ship replacement product |
| `store_credit` | Customer accepts credit for future purchase | Add credit to customer account |

## Refund methods

| Method | Description |
|---|---|
| `original_payment` | Refund to the original payment card/method |
| `store_credit` | Issue as credit for future purchases |
| `bank_transfer` | Manual bank transfer (for cases where original method is unavailable) |

## Inventory auto-restock

When you set a return to `completed`, the system checks every returned item where `restock = true` and:
1. Increases `qty_on_hand` in [Inventory](/admin/inventory) by the returned quantity
2. Records a `stock_movements` entry of type `return`

This happens automatically — you do not need to manually adjust stock.

Set `restock = false` for items that are damaged, defective, or otherwise not resellable.

## Related pages

- [Orders](/admin/orders) — returns are always linked to an original order
- [Customers](/admin/customers) — return customer record linked from the detail page
- [Inventory](/admin/inventory) — stock levels updated automatically on completion
- [Permissions](/users/permissions) — MANAGE_ORDERS permission (bit 32)
