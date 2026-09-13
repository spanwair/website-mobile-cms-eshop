---
title: Pricing
description: The pricing hub - manage price lists, discount rules, and coupon codes for your store
---

The Pricing section is the hub for everything that changes what a customer pays.
It has three tabs, each backed by its own set of records: **price lists** (currency-scoped product price overrides), **discount rules** (the reusable math of a promotion), and **coupons** (redeemable codes that point at a discount rule).
Each tab links out to a dedicated create/edit page documented separately: [Price lists](/docs/en/admin/pricing-pricelists), [Discounts](/docs/en/admin/pricing-discounts), and [Coupons](/docs/en/admin/pricing-coupons).

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 128 | MANAGE_PRICING | Owner, Admin, Eshop Admin (with this bit) |

The hub and every coupon/discount/price-list page call `requireAdminCtx`.
Not signed in goes to `/login`.
No admin role goes to `/dashboard`.
No active organization goes to `/admin/parties/new` (owner) or `/admin/setup`.
Missing the MANAGE_PRICING bit redirects to `/admin`.

## The hub (`/admin/pricing`)

The page opens with three tabs; the `?tab=` query param selects which one is shown (default `pricelists`).
Each tab label carries a live count of its records.

| Tab | Query value | Shows |
|---|---|---|
| Price lists | `pricelists` | Price lists table |
| Discounts | `discounts` | Discount rules table |
| Coupons | `coupons` | Coupons table |

All three data sets are loaded together on page load via `fetchPriceLists`, `fetchDiscountRules`, and `fetchCoupons`, each scoped to the active organization's `party_id`.

### Price lists tab

A toolbar shows the count and a "New price list" button linking to [`/admin/pricing/pricelists/new`](/docs/en/admin/pricing-pricelists).

| Column | Source column |
|---|---|
| Name | `name` |
| Currency | `currency` |
| Default | Green "Default" badge when `is_default`, else a dash |
| Status | Green `Active` / muted `Inactive` from `is_active` |
| Valid from | `valid_from` date, or a dash |
| Valid to | `valid_to` date, or a dash |
| Actions | Edit link to `/admin/pricing/pricelists/{id}` |

Empty state: a "no price lists" row spans the table.

### Discounts tab

A toolbar shows the count and a "New discount" button linking to [`/admin/pricing/discounts/new`](/docs/en/admin/pricing-discounts).

| Column | Source column |
|---|---|
| Name | `name` |
| Type | Amber badge with the discount type label (see below) |
| Value | `${value}%` for percentage discounts, otherwise `value` formatted as money |
| Status | Green `Active` / muted `Inactive` from `is_active` |
| Starts | `starts_at` date, or a dash |
| Ends | `ends_at` date, or a dash |
| Actions | Edit link to `/admin/pricing/discounts/{id}` |

Discount type labels: `percentage`, `fixed`, `buy_x_get_y`, `free_shipping`.
Empty state: a "no discounts" row.

### Coupons tab

A toolbar shows the count and a "New coupon" button linking to [`/admin/pricing/coupons/new`](/docs/en/admin/pricing-coupons).

| Column | Source column |
|---|---|
| Code | `code` (bold monospace) |
| Status | Green `Active` / muted `Inactive` from `is_active` |
| Max uses | `max_uses`, or "Unlimited" when null |
| Used | `uses_count` |
| Created | `created_at` date |
| Actions | Edit link to `/admin/pricing/coupons/{id}` |

Empty state: a "no coupons" row.

## How the three pieces fit together

- A **discount rule** defines the promotion math (10% off, free shipping over a threshold, etc.). It can be applied on its own or referenced by a coupon.
- A **coupon** is just a redeemable code that points at exactly one discount rule via `discount_rule_id`. You cannot create a coupon before at least one discount rule exists.
- A **price list** is a separate mechanism: a currency-scoped set of explicit per-product prices that override the product's default price, optionally date-bounded and marked default.

## Data & storage (cloud)

- `price_lists` - `name`, `currency`, `is_default`, `is_active`, `valid_from`, `valid_to`, `party_id`.
- `discount_rules` - `name`, `type`, `value`, `min_order_amount`, `min_quantity`, `applies_to`, `applies_to_ids`, `customer_group`, `starts_at`, `ends_at`, `usage_limit`, `usage_count`, `is_active`, `party_id`.
- `coupons` - `code`, `discount_rule_id`, `max_uses`, `uses_count`, `is_active`, `party_id`, `created_at`.
- All three are read filtered by `party_id` (via `pricingService`).

## Related pages

- [Coupons](/docs/en/admin/pricing-coupons) - create and edit redeemable codes
- [Discounts](/docs/en/admin/pricing-discounts) - create and edit discount rules
- [Price lists](/docs/en/admin/pricing-pricelists) - create and edit per-product price overrides
- [Products](/docs/en/admin/products) - the catalog that price lists and discounts reference
- [Orders](/docs/en/admin/orders) - where a redeemed coupon's discount lands on the order total
