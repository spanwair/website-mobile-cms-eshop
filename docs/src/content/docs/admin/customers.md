---
title: Customers
description: How to view, search, and manage customer records and their order history.
---

Customers are contact records attached to your organization — people who have placed or will place orders. A customer record is separate from a user login account. Customers are scoped to your organization; you cannot see another organization's customers.

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 256 | MANAGE_CUSTOMERS | Owner, Admin, Eshop Admin (with this bit) |

## Customer list (`/admin/customers`)

The list page shows all customers in your organization.

- **Search bar** — searches by first name, last name, or email address in real time
- **Table columns**: name, email, phone, active status badge, join date, View button

## Viewing a customer (`/admin/customers/{id}`)

The detail page has two columns:

**Left column — personal info & addresses:**

| Field | Editable | Description |
|---|---|---|
| First name | Yes | Customer's first name |
| Last name | Yes | Customer's last name |
| Email | Yes | Contact email |
| Phone | Yes | Phone number |
| Notes | Yes | Internal notes (not visible to customer) |
| Active | Yes | Whether this customer is active (see below) |
| Addresses | No (view only) | All saved addresses with type and default badge |

**Right column — recent orders:**

Shows the customer's last 10 orders. Each row links directly to the [order detail](/admin/orders).

## Editing a customer

1. Click **View** on a customer row in the list.
2. Edit any field in the left column.
3. Click **Save**. Changes take effect immediately.

## Customer address types

| Type | Description |
|---|---|
| `billing` | Used for invoices |
| `shipping` | Used for deliveries |
| `both` | Serves as both billing and shipping |

The **default** badge marks which address is pre-selected at checkout. A customer can have multiple addresses of each type; the one marked default is used automatically.

Addresses are managed by the customer themselves through the eshop. Admins currently have read-only access to the address list.

## What `is_active` means

| State | Effect |
|---|---|
| Active (checked) | Customer can log in and place orders normally |
| Inactive (unchecked) | Customer cannot log in or place new orders; existing order history is preserved |

Use `is_active = false` to suspend a customer without losing their history. There is no delete button — this is intentional to preserve order records.

## When to deactivate a customer

- Suspected fraud
- Chargeback abuse
- Customer requested account closure (set inactive, keep records for legal purposes)
- Duplicate account (keep the one with more history, deactivate the duplicate)

## Related pages

- [Orders](/admin/orders) — view all orders; customer detail links directly to recent orders
- [Returns & Refunds](/admin/returns) — returns are linked to customer records
- [Roles](/users/roles) — customers are not admin users; they access the eshop only
