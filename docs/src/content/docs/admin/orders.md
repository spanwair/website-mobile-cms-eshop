---
title: Orders
description: How to view, process, and manage the full lifecycle of customer orders.
---

The Orders section shows every purchase made through the eshop. Orders are automatically scoped to your organization — you only see orders placed by your customers.

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 32 | MANAGE_ORDERS | Owner, Admin, Eshop Admin (with this bit) |

The same permission also gates [Returns & Refunds](/admin/returns).

## Order list (`/admin/orders`)

The list uses **status tabs** at the top to filter:

| Tab | Shows |
|---|---|
| All | Every order regardless of status |
| Pending | New orders awaiting confirmation |
| Confirmed | Accepted orders being prepared |
| Processing | Orders being picked and packed |
| Shipped | Orders in transit |
| Delivered | Completed orders |
| Cancelled | Cancelled orders |

Each row shows: order number, status badge, payment status badge, total amount, and date. Click **Detail** to open the order.

## Order status workflow

Orders move through a fixed sequence:

```
pending → confirmed → processing → shipped → delivered
       ↘          ↘           ↘
        cancelled   cancelled   cancelled
```

| Status | Meaning | Your action |
|---|---|---|
| `pending` | New order, not yet reviewed | Review and confirm or cancel |
| `confirmed` | Accepted, awaiting fulfillment | Start picking items |
| `processing` | Being picked and packed | Pack and prepare shipment |
| `shipped` | Handed to carrier | Enter tracking number |
| `delivered` | Customer received | No action needed |
| `cancelled` | Cancelled at any pre-delivery stage | Add a note explaining why |

Once an order reaches `delivered`, it cannot be changed. To handle a post-delivery issue, use [Returns & Refunds](/admin/returns).

## Processing an order step by step

1. Go to `/admin/orders` and open the **Pending** tab.
2. Click **Detail** on an order to open it.
3. Review:
   - **Order items** — product name, SKU, quantity, unit price, line total
   - **Totals** — subtotal, discount applied, tax, shipping, grand total
   - **Customer info** — name, email (links to [Customer record](/admin/customers))
   - **Shipping address** — where to deliver
4. Click **Confirm** to accept the order (moves to `confirmed`).
5. When you start packing, click **Mark as Processing**.
6. When handed to the carrier, enter the **tracking number** and click **Mark as Shipped**.
7. After delivery confirmation, click **Mark as Delivered**.

## Payment status vs order status

These are two independent statuses:

| Field | Tracks |
|---|---|
| Order status | Fulfillment progress (confirmed, shipped, etc.) |
| Payment status | Whether money was received |

| Payment status | Meaning |
|---|---|
| `unpaid` | Payment not yet received or pending |
| `paid` | Payment confirmed |
| `refunded` | Money returned to customer |

Update payment status separately when you confirm payment from your payment provider.

## Order detail fields

| Field | Description |
|---|---|
| Order number | Auto-generated unique ID (e.g. `ORD-2026-001`) |
| Status | Current fulfillment status |
| Payment status | Whether payment was received |
| Subtotal | Sum of all line items |
| Discount | Total discount applied (from coupons or discount rules) |
| Tax | Tax amount |
| Shipping | Shipping fee |
| Grand total | Final amount customer paid |
| Tracking number | Carrier tracking code — enter when shipping |
| Notes | Internal notes (not shown to customer) |

## Adding a tracking number

1. Open the order detail.
2. Find the **Tracking Number** input in the left column.
3. Enter the carrier's tracking code.
4. Click **Save Tracking**.

The tracking number is stored on the order but not yet sent to the customer automatically — notify them separately via email or your carrier's notification system.

## Cancelling an order

You can cancel orders at any stage up to `shipped`. On the order detail, click **Cancel Order**. Add an internal note to explain why. Cancellation:
- Sets order status to `cancelled`
- Does **not** automatically issue a refund — handle that in your payment provider
- Does **not** automatically restore inventory — adjust manually in [Inventory](/admin/inventory) if needed

## Related pages

- [Returns & Refunds](/admin/returns) — for post-delivery issues (same MANAGE_ORDERS permission)
- [Customers](/admin/customers) — customer profile linked from order detail
- [Inventory](/admin/inventory) — adjust stock after cancellations
- [Pricing](/admin/pricing) — coupons and discount rules that affect order totals
- [Reports](/admin/reports) — order count and revenue aggregations
