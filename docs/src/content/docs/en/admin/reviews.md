---
title: Reviews
description: Moderate customer product reviews - approve, reject, hide, or delete ratings and written feedback
---

The Reviews page is where customer-submitted product ratings are moderated before they appear on the storefront.
Reviews attach to [products](/docs/en/admin/products) and are only shown publicly once approved, and only when the store has reviews enabled (the `enable_reviews` store config toggled in [Branding](/docs/en/admin/settings-branding)).

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 8 | MANAGE_PRODUCTS | Owner, Admin, Eshop Admin (with this bit) |

Reviews share the `MANAGE_PRODUCTS` bit with [Products](/docs/en/admin/products) and [Product Conditions](/docs/en/admin/product-conditions).
Without it you are redirected to `/admin`.

## Review list (`/admin/reviews`)

Reviews load 20 per page through `fetchReviews`, newest first, with a total count next to the title.

### Status tabs

Five tabs filter by moderation status:

| Tab | `product_reviews.status` |
|---|---|
| All | (no filter) |
| Pending | `pending` - the default for a freshly submitted review, awaiting moderation. |
| Approved | `approved` - publicly visible. |
| Rejected | `rejected` - refused, never shown. |
| Hidden | `hidden` - previously visible, now pulled from the storefront. |

### The review card

Each review renders as a card, not a table row:

- **Stars** - the rating drawn as filled/empty stars (1 to 5), titled with the numeric value.
- **Author name** and **author email**.
- **Verified purchase** badge when `is_verified` is true (the reviewer actually bought the item).
- **Status badge** - color-coded: pending amber, approved green, rejected red, hidden grey.
- **Date** - `created_at` in the current locale.
- **Pros / Cons** - two columns, pros prefixed with a green `+`, cons with a red minus.
- **Body** - the free-text review, when present.

### Moderation actions

Each card shows the actions that make sense for its current status, plus Delete:

| Button | Effect (POST `action`) |
|---|---|
| Approve | Sets status to `approved` (hidden when already approved). |
| Reject | Sets status to `rejected` (hidden when already rejected). |
| Hide | Sets status to `hidden` (hidden when already hidden). |
| Delete | Permanently removes the review, after a `confirm()` dialog. |

Approve / reject / hide update the row in place; delete removes it entirely.
After any action the page redirects back to `/admin/reviews`.

## Empty state and pagination

When a tab has no reviews, a centered "No reviews" card is shown.
Previous / Next links with a "Page X / Y" indicator appear when there is more than one page, preserving the active status filter.

## Data & storage (cloud)

- **Table:** `product_reviews` (`product_id`, `author_name`, `author_email`, `rating`, `pros[]`, `cons[]`, `body`, `is_verified`, `status`, `created_at`).
- **Denormalized on the product:** approved reviews feed `products.rating_avg` and `products.review_count`.
- **Service:** `fetchReviews` (`reviewService`); status/delete writes go straight to `product_reviews`.
- **Store config:** `enable_reviews` decides whether approved reviews render on the storefront at all.
- Scoped to `ctx.partyId`.

## Related pages

- [Products](/docs/en/admin/products) - reviews attach to products; rating average and count show on the product
- [Branding](/docs/en/admin/settings-branding) - the `enable_reviews` toggle that turns storefront reviews on or off
