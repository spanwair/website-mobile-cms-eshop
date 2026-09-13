---
title: Customers
description: Browse and edit customer records, manage their addresses, and review their order history
---

The Customers section is your CRM: every buyer who has an account or has placed an order with your organization.
From here you edit contact details, manage saved addresses, and see the customer's full [order history](/docs/en/admin/orders).
Customers are scoped to the active organization, so you only ever see your own store's buyers.

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 256 | MANAGE_CUSTOMERS | Owner, Admin, Eshop Admin (with this bit) |

Both pages call `requireAdminCtx`.
Not signed in goes to `/login`.
No admin role goes to `/dashboard`.
No active organization goes to `/admin/parties/new` (owner) or `/admin/setup`.
Missing the MANAGE_CUSTOMERS bit redirects to `/admin`.

## Customers vs sellers (roles)

A shopper who signs up on a storefront becomes a **customer**, not a seller.
In the auth layer they are `profiles.role = 1` (USER) and their `profiles.signup_party_id` records the organization whose storefront they signed up through.
A USER has no admin panel access at all and is sent to `/dashboard`; sellers are `eshop_admin`, `admin`, or `owner` (roles 2/4/8).

The record you edit on this page is the `customers` row, which is per-organization commerce data (name, addresses, order stats, GDPR consent).
Its optional `user_id` links a customer record to an authenticated account.
So a customer can exist as a pure buyer record (guest checkout, no login) or be tied to a signed-up USER account - either way they appear here, scoped by `customers.party_id`.

## Customer list (`/admin/customers`)

The toolbar has a search form and a total count.
The list shows 20 customers per page for the active organization, newest first.

### Search

The search box (GET form) matches on first name, last name, or email using a case-insensitive `ilike` OR across `first_name`, `last_name`, and `email`.
Submit with the search button; the query persists in the URL.

### Columns

| Column | Source column |
|---|---|
| Name | `first_name` + `last_name` (bold) |
| Email | `email` |
| Phone | `phone`, or a dash |
| Status | Badge: green `Active` when `is_active`, muted `Inactive` otherwise |
| Joined | `created_at` short local date |
| Actions | View link to the customer detail |

When no customers match, a centered "no customers" row spans the table.
Previous / Next links and a "Page X of Y (Total N)" counter appear when there is more than one page.

## Customer detail (`/admin/customers/{id}`)

A back link returns to the list, and any save error appears in a red alert box.
The layout is two columns: personal info + addresses on the left, order history on the right.

### Personal information (editable)

This form posts with the default `_action` (update) and saves via `updateCustomer`.

| Field | Required | Source column |
|---|---|---|
| First name | Yes | `first_name` |
| Last name | Yes | `last_name` |
| Email | Yes | `email` |
| Phone | No | `phone` (null when blank) |
| Notes | No | `notes` (internal staff notes) |
| Active | Checkbox | `is_active` |

Click Save to persist.

### Addresses

The addresses card header shows a count and, when the add form is closed, an "Add address" button.
Each saved address renders as a card:

- A badge showing the address type: `Shipping` or `Billing`.
- A "Default" badge when `is_default` is true.
- A Delete button (posts `_action=delete_address`, confirms first) that removes the address via `deleteAddress`.
- The formatted address block: name, `line1` (+ `line2`), then `postal_code city, country_code`.

When there are no addresses and the form is closed, a "no addresses" message shows.

#### Add address form

Opened via the `?addAddress=1` query param.
It posts `_action=add_address` and saves via `addAddress`.

| Field | Required | Notes / column |
|---|---|---|
| Street | Yes | mapped to `line1` |
| Building number | Yes | mapped to `line2` |
| Postal code | Yes | `postal_code` |
| City | Yes | `city` |
| Country | No | `country_code`, defaults to `CZ`, 2-letter uppercase |
| Address type | Select | `shipping` (default) or `billing` |
| First name | Yes | prefilled with the customer's first name |
| Last name | Yes | prefilled with the customer's last name |
| Set as default | Checkbox | `is_default` |

Save with "Save address", or Cancel to return to the customer page.

### Order history

The right column shows the customer's orders (up to 10 most recent), with a total count from `order_count`.
Each row links to the order detail.

| Column | Source |
|---|---|
| Order number | `order_number`, links to `/admin/orders/{id}` |
| Status | Color-coded order status badge |
| Total | `total_amount`, formatted in the order currency |
| Date | `created_at` short local date |

When the customer has no orders, a "no orders" message shows instead of the table.

## Data & storage (cloud)

- `customers` - the CRM record: `first_name`, `last_name`, `email`, `phone`, `notes`, `is_active`, `customer_group`, `lifetime_value`, `loyalty_points`, `marketing_opt_in`, `gdpr_consent` (+ `gdpr_consent_at`, `gdpr_consent_ip`), `tags`, `preferred_language`, `user_id`, `party_id`, `created_at`. The list/detail queries filter by `party_id`.
- `addresses` - saved addresses: `type`, `first_name`, `last_name`, `line1`, `line2`, `city`, `postal_code`, `country_code`, `state`, `company`, `is_default`, `customer_id`.
- `orders` - joined for order history and counted via `customer_id`.
- `profiles` - the auth-side role record (`role`, `signup_party_id`) that distinguishes a USER (customer) from a seller; not edited here.

## Related pages

- [Orders](/docs/en/admin/orders) - each order links back to its customer, and the customer detail lists their orders
- [Returns](/docs/en/admin/returns) - returns are attributed to a customer
- [Dashboard](/docs/en/admin/dashboard) - new-customer KPIs are derived from this table
- [Products](/docs/en/admin/products) - the catalog customers purchase
