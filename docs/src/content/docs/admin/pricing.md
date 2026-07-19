---
title: Pricing & Coupons
description: How to manage price lists, discount rules, and coupon codes for your eshop.
---

The Pricing section controls three distinct tools: **Price Lists** (different prices for different customer groups), **Discounts** (automatic reductions applied at checkout), and **Coupons** (codes customers enter to get a discount). All are scoped to your organization.

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 128 | MANAGE_PRICING | Owner, Admin, Eshop Admin (with this bit) |

## The three pricing tools

| Tool | How it works | Applied by |
|---|---|---|
| Price List | An alternative set of prices for specific products | Automatic, based on customer group assignment |
| Discount Rule | An automatic reduction (% or fixed) applied at checkout | Automatic, based on conditions (date, category, etc.) |
| Coupon | A code the customer manually enters at checkout | Customer |

## Price Lists tab

Price lists let you offer different prices to different customer groups (e.g. wholesale buyers, VIP members).

| Column | Description |
|---|---|
| Name | Label for this price list (e.g. "Wholesale", "VIP") |
| Currency | Currency for this price list |
| Default | Badge — the default price list used when no specific list applies |
| Active | Whether this list is currently in effect |
| Valid from / Valid to | Optional date range for seasonal price lists |

Price lists are currently **read-only** in the admin UI — they are managed via database migrations. Contact your developer to add or change price lists.

## Discounts tab

Discount rules automatically reduce prices at checkout when their conditions are met.

| Column | Description |
|---|---|
| Name | Internal label (e.g. "Summer 10% Off") |
| Type | `percentage` (e.g. 10% off) or `fixed` (e.g. 50 Kč off) |
| Value | The discount amount |
| Active | Whether this rule is currently live |
| Starts at / Ends at | Date range when the rule is active |

Discount rules are currently **read-only** in the admin UI — they are managed via database migrations. Contact your developer to create or modify discount rules.

## Coupons tab

Coupon codes are manageable directly in the admin UI. Customers enter the code at checkout to apply the associated discount.

### How to create a coupon

1. Go to **Admin → Pricing** and click the **Coupons** tab.
2. Click **New Coupon**.
3. Fill in the fields (see below).
4. Click **Save**. The coupon is immediately active if you checked the Active box.

### Coupon fields

| Field | Required | Description |
|---|---|---|
| Code | Yes | The code customers type (e.g. `WELCOME10`). Must be unique within your organization. |
| Active | Yes | Toggle — only active coupons can be used at checkout |
| Max uses | No | Maximum total redemptions allowed. Leave blank for unlimited. |

The **uses count** (how many times the coupon has been redeemed) is shown in the table and is read-only.

### Coupon best practices

- Use uppercase codes — they are easier for customers to type and copy
- Set `max_uses` for time-sensitive promotions to prevent over-redemption
- Deactivate (rather than delete) a coupon when a promotion ends — this preserves the history of how many times it was used
- Codes must be unique per organization — you cannot reuse the same code twice in your org

## Relationship to orders

When a customer applies a coupon or when a discount rule triggers at checkout:
- The discount amount is recorded on the [order](/admin/orders) in the `discount` field
- The order's grand total reflects the reduced amount
- The coupon's `uses_count` increments by 1

## Related pages

- [Orders](/admin/orders) — coupon discounts appear in the order totals breakdown
- [Products](/admin/products) — price list items reference specific products
- [Roles](/users/permissions) — MANAGE_PRICING permission (bit 128)
