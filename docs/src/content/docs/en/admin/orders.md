---
title: Orders
description: View, filter, and fulfil customer orders, update status, manage shipments, and print carrier labels
---

The Orders section is where every sale lands after checkout.
From here you track an order through its lifecycle, record payment and tracking, book a real shipment with a carrier, and print the shipping label.
Orders reference the same catalog managed in [Products](/docs/en/admin/products) and the buyer record in [Customers](/docs/en/admin/customers), and they feed the return workflow in [Returns](/docs/en/admin/returns).

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 32 | MANAGE_ORDERS | Owner, Admin, Eshop Admin (with this bit) |

Every orders page calls `requireAdminCtx` first.
If you are not signed in you go to `/login`.
If you have no admin role at all you are redirected to `/dashboard`.
If your account has no active organization you go to `/admin/parties/new` (owner) or `/admin/setup` (everyone else).
If you lack the MANAGE_ORDERS bit you are redirected to `/admin`.
This same bit also gates [Returns](/docs/en/admin/returns) and the revenue KPI on the [Dashboard](/docs/en/admin/dashboard).

## Order list (`/admin/orders`)

The list shows the 20 most recent orders per page for the active organization, newest first.

### Status tabs

A row of tabs filters the list by order status.
The active tab is underlined with the accent color.

| Tab | Filter value |
|---|---|
| All | (no filter) |
| Pending | `pending` |
| Confirmed | `confirmed` |
| Processing | `processing` |
| Shipped | `shipped` |
| Delivered | `delivered` |
| Cancelled | `cancelled` |

Orders in `refunded` status are not given a tab but still render with their own badge if present.

### Columns

| Column | Description |
|---|---|
| Number | The `order_number` (bold), e.g. the human-readable order reference |
| Status | Color-coded status badge (see the badge table below) |
| Payment | Badge: green (`badge-active`) when `payment_status` is `paid`, otherwise a neutral `badge-draft` badge showing `unpaid` |
| Shipment | Carrier + shipment status badge, e.g. `PPL · created`; appends ` · TEST` when the shipment is a mock; shows the tracking number underneath when present; a dash when no shipment row exists |
| Total | `total_amount` formatted in the order currency |
| Date | `created_at` as a short local date |
| Actions | Detail link plus contextual shipment buttons (see below) |

### Status badge colors

| Status | Badge style |
|---|---|
| pending | `badge-pending` (amber) |
| confirmed | `badge-active` (green) |
| processing | `badge-draft` (grey/blue) |
| shipped | `badge-active` (green) |
| delivered | `badge-active` (green) |
| cancelled | `badge-error` (red) |
| refunded | `badge-inactive` (muted) |

### Row action buttons

The Actions column shows a Detail link and up to four shipment buttons depending on the current shipment state.
These buttons submit a POST to the same list page.

| Button | Shown when | Action value | Effect |
|---|---|---|---|
| Detail | Always | - | Opens the order detail page |
| Create shipment | Shipment status is `pending` | `create_shipment` | Books the shipment with the carrier |
| Retry | Shipment status is `failed` | `create_shipment` | Re-attempts booking |
| Refresh | A `provider_shipment_id` exists | `refresh_shipment` | Polls the carrier for the latest status |
| Cancel | A `provider_shipment_id` exists and status is not `in_transit`, `delivered`, `returned`, or `cancelled` | `cancel_shipment` | Cancels the shipment at the carrier |
| Preview label | A `label_storage_path` exists | - | Opens the [label preview](/docs/en/admin/orders) in a new tab |

Every shipment POST first re-checks that the order belongs to your active organization (`orders.party_id = partyId`) before running, because these actions use the service-role admin client and bypass row-level security.

### Empty state and pagination

When no orders match the filter, a centered "no orders" message spans the table.
When more than one page exists, Previous / Next links and a "Page X of Y (Total N)" counter appear below the table.

## Order detail (`/admin/orders/{id}`)

The detail page is a two-column layout: line items and tracking on the left, status/customer/shipping/shipment/return cards on the right.
A back link returns to the list.
Any action error is shown in a red alert box at the top.

### Line items and totals

The Items table lists each `order_items` row.

| Column | Source column |
|---|---|
| Product | `title` |
| SKU | `sku` (dash when null) |
| Qty | `quantity` |
| Unit | `unit_price`, formatted |
| Total | `total_price`, formatted |

Below the table a totals block shows Subtotal (`subtotal`), Discount (shown as a negative of `discount_amount`), Tax (`tax_amount`), Shipping (`shipping_amount`), and a bold Grand total (`total_amount`).

### Tracking number

A single-field form lets you set or replace the manual `tracking_number` on the order.
This is independent of the carrier shipment tracking number and is a free-text field.
Submitting posts `action=tracking`.

### Status card and workflow

The status card shows the current status badge, the payment status and method (`Card`/`Stripe` or `COD`), and the COD fee (`payment_fee`) when greater than zero.
When the order can still advance, a "Move to" dropdown and an optional note field appear.
The dropdown only offers the statuses allowed by the forward-only workflow:

| Current status | Allowed next statuses |
|---|---|
| pending | confirmed, cancelled |
| confirmed | processing, cancelled |
| processing | shipped, cancelled |
| shipped | delivered |
| delivered | (none) |
| cancelled | (none) |
| refunded | (none) |

Submitting posts `action=status` and calls `updateOrderStatus`, which updates `orders.status` and appends a row to `order_status_history` recording `from_status`, `to_status`, `changed_by` (your user id), and the optional note.

### Customer card

When the order has a linked customer, this card shows the name, email, and phone, plus a "View customer" button linking to [`/admin/customers/{id}`](/docs/en/admin/customers).

### Shipping address card

Shows the delivery address (`line1`, optional `line2`, `city`, `postal_code`, `country_code`) from the linked `addresses` row.

### Shipment card

Present only when an `order_shipments` row exists.
A "Test mode" badge appears in the heading when the shipment `is_mock`.

| Field | Source column |
|---|---|
| Provider | `provider` (uppercased, e.g. PPL / PACKETA) |
| Status | `status` |
| Tracking | `tracking_number` |
| Consignment code | `consignment_code` (with a hint line) |
| Pickup point | `pickup_point_name` and `pickup_point_address` |
| Error | `error_message` shown in red when set |

The card carries the same action buttons as the list row: Preview label, Create/Retry, Refresh, and Cancel.
A "shipment cancelled" note appears when status is `cancelled`.

### Return shipment card

Present when the forward shipment has a `provider_shipment_id`.
If a return has already been booked, it shows the return tracking number (`return_tracking_number`), the drop-off password (`return_password`, Packeta only), and a Preview label button linking to the return label (`/admin/orders/{id}/label?type=return`).
If no return exists yet, a "Create return shipment" button posts `action=create_return_shipment` and books a reverse-direction shipment routed customer to seller.

### Which carriers

Shipments are booked through the configured carrier stored on the shipment `provider` field.
The supported providers are PPL and Packeta, each supporting address delivery and pickup-point / box delivery.
Sender addresses and carrier credentials come from the `shipping_provider_configs` table, managed in [Shipping settings](/docs/en/admin/settings-shipping).
Both carriers are poll-only, so shipment status only advances when you press Refresh (or the background cron poller runs) - there are no carrier webhooks.

## Shipping label preview (`/admin/orders/{id}/label`)

This page embeds the generated carrier label in a full-height iframe.
It re-verifies the order belongs to your organization, then loads the PDF via the API route `/api/shipping-label/{orderId}` (append `?type=return` for the return label).
The heading shows the order number and a back link to the order.

The label PDF lives in the private `shipping-labels` Storage bucket at `{party_id}/{orderId}/label.pdf` (or `return-label.pdf`).
That bucket has no public read policy: the API route mints a 60-second signed URL only after confirming staff access via MANAGE_ORDERS row-level security (or the owning customer).

## Data & storage (cloud)

- `orders` - the order header: `order_number`, `status`, `payment_status`, `payment_method`, `payment_fee`, `subtotal`, `discount_amount`, `tax_amount`, `shipping_amount`, `total_amount`, `currency`, `tracking_number`, `customer_id`, `shipping_address_id`, `party_id`, `created_at`, `paid_at`, `shipped_at`, `delivered_at`.
- `order_items` - one row per line item: `title`, `sku`, `quantity`, `unit_price`, `total_price`, `discount_amount`, `tax_amount`, `product_id`, `variant_id`.
- `order_status_history` - append-only audit of status changes: `from_status`, `to_status`, `changed_by`, `note`.
- `order_shipments` - carrier booking: `provider`, `status`, `provider_shipment_id`, `tracking_number`, `consignment_code`, `label_storage_path`, `pickup_point_*`, `is_mock`, `weight_kg`, `error_message`, and the `return_*` columns for reverse shipments.
- `customers`, `addresses` - joined for the customer and shipping-address cards.
- `shipping_provider_configs` - carrier credentials and sender address, read when booking a shipment.
- Storage bucket `shipping-labels` (private) - the label PDFs, served through `/api/shipping-label/{orderId}` signed URLs.
- Shipment actions run through the service-role admin client (`createAdminClient`) in `website/src/lib/shipmentActions.ts`.

## Related pages

- [Returns](/docs/en/admin/returns) - RMA and refunds for delivered orders (same MANAGE_ORDERS bit)
- [Customers](/docs/en/admin/customers) - the buyer record and their full order history
- [Products](/docs/en/admin/products) - the catalog that order line items reference
- [Inventory](/docs/en/admin/inventory) - stock is decremented when an order is placed and restored on cancel
- [Shipping settings](/docs/en/admin/settings-shipping) - carrier credentials and sender address used to book labels
- [Dashboard](/docs/en/admin/dashboard) - revenue and recent-order KPIs derived from orders
