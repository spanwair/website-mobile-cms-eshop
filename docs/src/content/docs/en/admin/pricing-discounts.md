---
title: Discount Rules
description: Automatic discount rules - percentage, fixed, buy-x-get-y, and free shipping - with conditions and scheduling
---

Discount rules are the automatic promotions of your store.
A rule applies on its own when its conditions are met (no code required); if you want a rule that only activates when a shopper types a code, you attach it to a [Coupon](/docs/en/admin/pricing-coupons).
Discount rules live under the **Discounts** tab of the [Pricing](/docs/en/admin/pricing) hub.

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 128 | MANAGE_PRICING | Owner, Admin, Eshop Admin (with this bit) |

Without `MANAGE_PRICING` you are redirected to `/admin`.

## Creating a discount rule (`/admin/pricing/discounts/new`)

### Field reference

| Field | Required | Column | Notes |
|---|---|---|---|
| Name | Yes | `discount_rules.name` | Internal label, e.g. "Summer Sale". |
| Type | Yes | `discount_rules.type` | `percentage`, `fixed`, `buy_x_get_y`, or `free_shipping`. |
| Value | Yes | `discount_rules.value` | The amount. For percentage it is a percent (10 = 10%); for fixed it is a money amount; for buy-x-get-y it is the quantity. |
| Min order amount | No | `discount_rules.min_order_amount` | Rule only applies once the cart subtotal reaches this. |
| Min quantity | No | `discount_rules.min_quantity` | Rule only applies once this many qualifying items are in the cart. |
| Applies to | Yes | `discount_rules.applies_to` | `all`, `products`, `categories`, or `customers` (the target scope). |
| Starts at | No | `discount_rules.starts_at` | `datetime-local`; the rule is inactive before this moment. |
| Ends at | No | `discount_rules.ends_at` | `datetime-local`; the rule expires after this moment. |
| Usage limit | No | `discount_rules.usage_limit` | Total number of times the rule may be applied. |
| Active | No | `discount_rules.is_active` | Checkbox, ticked by default. |

On save you return to `/admin/pricing?tab=discounts`.

### Discount types

| Type | Effect |
|---|---|
| Percentage | Takes a percentage off the qualifying total. |
| Fixed | Takes a fixed money amount off. |
| Buy X get Y | Quantity-based promotion driven by the value + min quantity. |
| Free shipping | Waives the shipping cost. |

## Editing a discount rule (`/admin/pricing/discounts/{id}`)

The edit form mirrors the create form, pre-filled with the current values.
Date fields are shown in `datetime-local` format.
The **usage limit** field shows a live "used X of Y" hint (or "unlimited") from `usage_count`.

The page rejects any rule whose owning party does not match the active org (redirects to `/admin/pricing`), so you can never edit another org's rule.

### Deleting

A separate red **Delete** button (with a `confirm()` dialog) removes the rule and returns to the Discounts tab.

## Data & storage (cloud)

- **Table:** `discount_rules` (`party_id`, `name`, `type`, `value`, `min_order_amount`, `min_quantity`, `applies_to`, `applies_to_ids[]`, `customer_group`, `starts_at`, `ends_at`, `usage_limit`, `usage_count`, `is_active`).
- **Services:** `createDiscountRule`, `fetchDiscountRule`, `updateDiscountRule`, `deleteDiscountRule`, `fetchDiscountRules` (`pricingService`).
- Scoped to `ctx.partyId`; ownership re-checked on edit.

## Related pages

- [Pricing](/docs/en/admin/pricing) - the hub with the Discounts / Coupons / Price Lists tabs
- [Coupons](/docs/en/admin/pricing-coupons) - wrap a discount rule in a code customers must enter
- [Products](/docs/en/admin/products) and [Categories](/docs/en/admin/categories) - the targets when "applies to" is products or categories
- [Customers](/docs/en/admin/customers) - the target when "applies to" is a customer group
