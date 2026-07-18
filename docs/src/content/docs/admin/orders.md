---
title: Orders
description: How to view and process customer orders.
---

## Where to find orders

Go to **Admin → Orders** (`/admin/orders`). You see all orders for your organization.

## Order statuses

Orders move through a lifecycle:

```
pending → confirmed → processing → shipped → delivered
                                ↓
                            cancelled
```

| Status | Meaning |
|--------|---------|
| `pending` | New order, not yet confirmed |
| `confirmed` | Accepted, being prepared |
| `processing` | Being picked and packed |
| `shipped` | In transit, tracking number assigned |
| `delivered` | Customer received it |
| `cancelled` | Order was cancelled |

## Filtering by status

At the top of the orders page, use the **status tabs** or append `?status=pending` to the URL to filter by status. Useful for working through a queue of pending orders.

## Processing an order

1. Click the **order number** to open the detail page
2. Review the customer info, line items, and totals
3. Change the **Status** dropdown to the next state
4. Optionally add a **note** (visible internally)
5. If shipping, enter the **tracking number**
6. Click **Update**

## Payment status

Each order also has a payment status:

| Status | Meaning |
|--------|---------|
| `unpaid` | Payment not yet received |
| `paid` | Payment confirmed |
| `refunded` | Money returned to customer |

Update the payment status separately when you confirm payment.

## Order fields

| Field | Description |
|-------|-------------|
| Order number | Auto-generated (e.g. `ORD-2026-001`) |
| Customer | Linked to a customer record |
| Status | Current fulfillment status |
| Payment status | Whether money was received |
| Total amount | Order total in the set currency |
| Tracking number | Shipping tracking code |
| Notes | Internal notes about the order |

## Currency

Orders use the currency set at the organization level. The default is CZK (Czech Koruna). Change the default in organization settings.
