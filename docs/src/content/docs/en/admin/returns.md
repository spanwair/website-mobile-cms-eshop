---
title: Returns
description: Handle return merchandise authorizations (RMA), record resolutions, refunds, and restocking
---

The Returns section manages return merchandise authorizations (RMAs) raised against past [Orders](/docs/en/admin/orders).
Each return links back to its order and to the [Customer](/docs/en/admin/customers) who raised it, and it drives the resolution: refund, exchange, or store credit.
Returns share the same permission as orders, so anyone who can fulfil orders can also process returns.

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 32 | MANAGE_ORDERS | Owner, Admin, Eshop Admin (with this bit) |

Both returns pages call `requireAdminCtx`.
Not signed in goes to `/login`.
No admin role goes to `/dashboard`.
No active organization goes to `/admin/parties/new` (owner) or `/admin/setup`.
Missing the MANAGE_ORDERS bit redirects to `/admin`.

## Return list (`/admin/returns`)

The page header shows the title and a count of matching returns.
The list shows 20 returns per page for the active organization, newest first.

### Status tabs

Rounded pill tabs filter by status.
The active pill is filled with the primary color.

| Tab | Filter value |
|---|---|
| All | (no filter) |
| Pending | `pending` |
| Approved | `approved` |
| Received | `received` |
| Processing | `processing` |
| Completed | `completed` |
| Rejected | `rejected` |
| Cancelled | `cancelled` |

### Columns

| Column | Description |
|---|---|
| RMA | `return_number` shown as monospace code |
| Order | Link to the source order; shows the order number, or the first 8 chars of `order_id` when the order number is missing |
| Customer | Link to the customer; shows first + last name, or a dash |
| Reason | Human-readable reason label (see reasons below) |
| Status | Color-coded status badge |
| Refund | `refund_amount` formatted, or a dash when not set |
| Created | `created_at` short local date |
| Actions | Detail link to the RMA |

### Status badge colors

| Status | Badge style |
|---|---|
| pending | `badge-pending` (amber) |
| approved | `badge-draft` |
| received | `badge-draft` |
| processing | `badge-draft` |
| completed | `badge-active` (green) |
| rejected | `badge-error` (red) |
| cancelled | `badge-inactive` (muted) |

### Return reasons

The customer's reason is stored as a code and shown with a friendly label.

| Reason code | Label |
|---|---|
| wrong_item | Wrong item |
| damaged | Damaged |
| defective | Defective |
| not_as_described | Not as described |
| changed_mind | Changed mind |
| quality_issue | Quality issue |
| size_issue | Size issue |
| other | Other |

### Empty state and pagination

When nothing matches, a card shows a "no returns" message.
When more than one page exists, Previous / Next links and a "Page X / Y" counter appear.

## Return detail (`/admin/returns/{id}`)

The toolbar shows a back button, the RMA number, and the current status badge.
The body is a two-column layout: read-only details on the left, the editable resolution form on the right, with an optional returned-items table below.

### Details card (read-only)

| Field | Source column |
|---|---|
| Order | Link to `/admin/orders/{order_id}` (first 8 chars of the id shown as label) |
| Reason | `reason` (friendly label) |
| Customer notes | `customer_notes`, or a dash |
| Created | `created_at`, full local date-time |
| Received | `received_at`, shown only when set |
| Completed | `completed_at`, shown only when set |

### Resolution form (the RMA workflow)

This form is how you move a return through its lifecycle and record the refund.
Submitting saves all fields at once via `updateReturnStatus`.

| Field | Control | Options / notes |
|---|---|---|
| Status | Select | pending, approved, rejected, received, processing, completed, cancelled |
| Resolution | Select | (not set), refund, exchange, store_credit |
| Refund amount | Number (step 0.01) | Stored in `refund_amount` |
| Refund method | Select | (not set), original_payment, store_credit, bank_transfer |
| Notes | Textarea | Internal staff notes, stored in `notes` |

Two side effects are applied automatically on save based on the chosen status:

- Setting status to `received` stamps `received_at` with the current time.
- Setting status to `completed` stamps `completed_at` with the current time.
- Any status change also records `processed_by` as your user id.

### Refund handling

There is no automatic money movement from this page.
The refund is recorded on the return (`refund_amount` + `refund_method`) as the seller's decision and ledger.
Choosing `original_payment` means you refund through the original card/Stripe charge, `store_credit` credits the customer's account, and `bank_transfer` is a manual out-of-band transfer.
The actual payout must be carried out in your payment provider or bank; this page tracks what was agreed and marks the RMA completed.

A physical return label for the parcel is created from the order itself, not here: use the return-shipment card on the [order detail page](/docs/en/admin/orders) to book a reverse shipment.

### Returned items table

Shown when the RMA has `return_items` rows.

| Column | Source |
|---|---|
| Item | `order_item.title` |
| SKU | `order_item.sku` |
| Qty ordered | `order_item.quantity` |
| Qty returned | `return_items.quantity` |
| Condition | `return_items.condition` |
| Restock | check mark when `return_items.restock` is true, otherwise a dash |

The `restock` flag records whether the returned unit should go back into sellable stock.
Reconcile actual stock levels in [Inventory](/docs/en/admin/inventory) after processing.

## Data & storage (cloud)

- `return_requests` - the RMA header: `return_number`, `status`, `reason`, `resolution`, `refund_amount`, `refund_method`, `notes`, `customer_notes`, `processed_by`, `received_at`, `completed_at`, `order_id`, `customer_id`, `party_id`, `created_at`.
- `return_items` - one row per returned line: `quantity`, `condition`, `restock`, `order_item_id`, `return_request_id`.
- Joined for display: `orders` (`order_number`), `customers` (`first_name`, `last_name`, `email`), and `order_items` (`title`, `sku`, `quantity`, `unit_price`).
- Reverse shipment data (return tracking, drop-off password, return label) lives on the order's `order_shipments` row in the `return_*` columns, booked from the order detail page.

## Related pages

- [Orders](/docs/en/admin/orders) - the source order and where you book the physical return shipment/label
- [Customers](/docs/en/admin/customers) - the customer who raised the return and their history
- [Inventory](/docs/en/admin/inventory) - restock returned units flagged with the restock check
- [Products](/docs/en/admin/products) - the catalog items being returned
