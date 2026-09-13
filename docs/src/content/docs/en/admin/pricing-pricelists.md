---
title: Price Lists
description: Currency-specific, optionally time-boxed price lists with per-product price overrides
---

A price list is a named set of per-product price overrides in a single currency, optionally valid only for a date range.
Use them for a seasonal price sheet, a second-currency catalogue, or a default list that governs the whole store.
Price lists live under the **Price Lists** tab of the [Pricing](/docs/en/admin/pricing) hub.

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 128 | MANAGE_PRICING | Owner, Admin, Eshop Admin (with this bit) |

Without `MANAGE_PRICING` you are redirected to `/admin`.

## Creating a price list (`/admin/pricing/pricelists/new`)

### Field reference

| Field | Required | Column | Notes |
|---|---|---|---|
| Name | Yes | `price_lists.name` | e.g. "Standard Price List". |
| Currency | Yes | `price_lists.currency` | One of USD, EUR, CZK (default), GBP. |
| Default | No | `price_lists.is_default` | Marks this as the store's default list. |
| Active | No | `price_lists.is_active` | Checkbox, ticked by default. |
| Valid from | No | `price_lists.valid_from` | `date`; start of the validity window. |
| Valid to | No | `price_lists.valid_to` | `date`; end of the validity window. |

If **Valid from** is after **Valid to**, the server rejects it with an "invalid date range" error.
On save you return to `/admin/pricing?tab=pricelists`.

## Editing a price list (`/admin/pricing/pricelists/{id}`)

The top form edits the same fields (with the same date-range validation).
Below it, the **price list items** panel (`PriceListItems` component) manages the per-product overrides.

### Managing items

- **Add item** (`action=add_item`) - pick a product (loaded from up to 500 of the org's products) and enter a price in the list's currency.
  The product must belong to the active org, or you get an "product not found" error.
  Items are stored per product (`variant_id` is null at this level).
- **Delete item** (`action=delete_item`) - removes a single override.

Each add/delete redirects back to the same price-list page so the item table refreshes.

### Deleting the list

A separate red **Delete** button (with a `confirm()` dialog) removes the whole price list and returns to the Price Lists tab.

A price list whose party does not match the active org redirects to `/admin/pricing`.

## Data & storage (cloud)

- **Tables:** `price_lists` (`party_id`, `name`, `currency`, `is_default`, `is_active`, `valid_from`, `valid_to`), `price_list_items` (`price_list_id`, `product_id`, `variant_id`, `price`).
- **Services:** `createPriceList`, `fetchPriceList`, `updatePriceList`, `deletePriceList`, `fetchPriceListItems`, `upsertPriceListItem`, `deletePriceListItem` (`pricingService`); `fetchProducts`, `fetchProduct` (`productService`).
- **Component:** `PriceListItems`.
- Scoped to `ctx.partyId`; ownership re-checked on edit and on every item add.

## Related pages

- [Pricing](/docs/en/admin/pricing) - the hub with the Discounts / Coupons / Price Lists tabs
- [Products](/docs/en/admin/products) - the products whose prices a list overrides
- [Discount Rules](/docs/en/admin/pricing-discounts) - promotions that stack on top of list prices
