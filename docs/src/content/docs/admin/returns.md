---
title: Returns & Refunds
description: How to handle RMA requests — approve, process, restock items, and issue refunds.
---

## Where to find it

**Admin → Returns** (`/admin/returns`)

## Return number format

Every return gets a unique RMA number: `RMA-000001`. Auto-generated, sequential per organization.

## Return lifecycle

```
pending → approved → received → processing → completed
                  ↘ rejected
                  ↘ cancelled
```

| Status | What it means | Your action |
|--------|--------------|------------|
| `pending` | Customer submitted a return request | Review and decide |
| `approved` | You approved the return | Send customer a shipping label |
| `rejected` | You declined the return | No further action |
| `received` | Customer's parcel arrived | Inspect items |
| `processing` | You are processing refund/exchange | Issue refund in Stripe |
| `completed` | Done — refund issued or exchange sent | Archive |
| `cancelled` | Cancelled before receiving | No further action |

## Processing a return step by step

1. Go to `/admin/returns` → click **Detail** on the return
2. Review the customer's reason and notes
3. Change status to **approved** → click Save
4. Generate a shipping label (via your carrier portal) and send it to the customer
5. When parcel arrives: change status to **received** → set `received_at` automatically
6. Inspect each item — set `condition` and `restock = true` for sellable items
7. Choose resolution: `refund`, `exchange`, or `store_credit`
8. Set `refund_amount` and `refund_method`
9. Issue the actual refund in Stripe (dashboard or via the API)
10. Change status to **completed** → inventory auto-restocked for items with `restock = true`

## Inventory auto-restock

When you set a return to `completed`, the database trigger checks each return item where `restock = true` and automatically:
- Adds back the quantity to `inventory_items`
- Creates a `stock_movements` entry of type `return`

This means your inventory stays accurate without manual stock adjustment.

## Refund rules (recommended)

| Reason | Recommended resolution | Refund % |
|--------|----------------------|---------|
| Wrong item sent | Full refund + free return label | 100% |
| Defective/damaged | Full refund or exchange | 100% |
| Not as described | Full refund | 100% |
| Changed mind | Refund minus shipping (or store credit) | 80-100% |
| Size issue | Exchange encouraged | 100% for exchange |
| Quality issue | Partial or full depending on severity | 50-100% |

## Fraud prevention

~9% of returns are fraudulent. Red flags:
- Customer has 3+ returns in 90 days
- Return of expensive item with cheap replacement inside
- "Defective" claim on product with no prior contact with support
- Return submitted within hours of delivery

When fraud is suspected: reject with a clear explanation and keep the order in audit log.

## Store credit vs refund

Offering store credit instead of a refund:
- Keeps the cash in your business
- Conversion rate: up to 40% of would-be refunds become exchanges or store credit
- Add the credit as loyalty points in the customer profile (`loyalty_points` column)
