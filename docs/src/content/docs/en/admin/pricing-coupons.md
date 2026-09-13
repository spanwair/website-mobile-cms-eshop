---
title: Coupons
description: Coupon codes that customers enter at checkout to trigger a discount rule
---

A coupon is a code a customer types at checkout to unlock a discount.
The coupon itself carries no discount maths - it points at a [Discount Rule](/docs/en/admin/pricing-discounts), which defines what the discount actually does.
So you must create at least one discount rule before you can create a coupon.
Coupons live under the **Coupons** tab of the [Pricing](/docs/en/admin/pricing) hub.

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 128 | MANAGE_PRICING | Owner, Admin, Eshop Admin (with this bit) |

Without `MANAGE_PRICING` you are redirected to `/admin`.

## Creating a coupon (`/admin/pricing/coupons/new`)

If your organization has no discount rules yet, the form shows a warning and the **Create** button is disabled, with a prompt to make a [discount rule](/docs/en/admin/pricing-discounts) first.

### Field reference

| Field | Required | Column | Notes |
|---|---|---|---|
| Code | Yes | `coupons.code` | Uppercased and trimmed on save, e.g. `SUMMER20`. This is what the shopper types. |
| Discount rule | Yes | `coupons.discount_rule_id` | Dropdown of the org's discount rules; each option shows its effect (e.g. "Summer Sale (10%)"). |
| Max uses | No | `coupons.max_uses` | Total redemptions allowed; blank means unlimited. |
| Active | No | `coupons.is_active` | Checkbox, ticked by default. |

On save you return to `/admin/pricing?tab=coupons`.

## Editing a coupon (`/admin/pricing/coupons/{id}`)

The edit form mirrors create, pre-filled.
The **Max uses** field shows a live "used X of Y" hint (or "unlimited") from `uses_count`.
A coupon whose party does not match the active org redirects to `/admin/pricing`.

### Deleting

A separate red **Delete** button (with a `confirm()` dialog) removes the coupon and returns to the Coupons tab.

## Coupon versus discount rule

| | Discount rule | Coupon |
|---|---|---|
| Triggers | Automatically when conditions are met | Only when the shopper enters the code |
| Holds the maths | Yes (type + value + conditions) | No - it references a rule |
| Usage cap | `usage_limit` on the rule | `max_uses` on the coupon |

## Data & storage (cloud)

- **Tables:** `coupons` (`party_id`, `code`, `discount_rule_id`, `max_uses`, `uses_count`, `is_active`), `discount_rules` (the referenced rule).
- **Services:** `createCoupon`, `fetchCoupon`, `updateCoupon`, `deleteCoupon`, `fetchDiscountRules` (`pricingService`).
- Scoped to `ctx.partyId`; ownership re-checked on edit.

## Related pages

- [Discount Rules](/docs/en/admin/pricing-discounts) - the rule a coupon must reference (create one first)
- [Pricing](/docs/en/admin/pricing) - the hub with all pricing tabs
- [Orders](/docs/en/admin/orders) - redeemed coupons show against the orders that used them
