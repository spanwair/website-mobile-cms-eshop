---
title: Product Reviews
description: How to moderate customer reviews — approve, reject, hide, and delete.
---

Reviews appear on product pages and affect trust and conversion. All new reviews start as `pending` and are hidden from customers until you explicitly approve them. Reviews require the same permission as managing products.

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 8 | MANAGE_PRODUCTS | Owner, Admin, Eshop Admin (with this bit) |

This is the **same permission as [Products](/admin/products)** — anyone who can manage products can also moderate their reviews.

## Review list (`/admin/reviews`)

The page shows review **cards** (not a table) grouped by status tabs at the top:

| Tab | Shows |
|---|---|
| All | Every review regardless of status |
| Pending | New reviews awaiting your decision |
| Approved | Published reviews visible on the eshop |
| Rejected | Declined reviews (kept for records, not public) |
| Hidden | Reviews that were approved but later hidden |

Each card shows:
- Star rating (1–5)
- Author name and email
- **Verified Purchase** badge (if the reviewer has a completed order for this product)
- Status badge
- Date submitted
- Review title and body text
- Action buttons

## Review statuses explained

| Status | Visible to customers | Description |
|---|---|---|
| `pending` | No | New review — no decision made yet |
| `approved` | Yes | Published on the product page |
| `rejected` | No | Declined — not published, but kept in the database |
| `hidden` | No | Was approved, now hidden. Use for reviews that aged poorly or were later flagged. |

## What "Verified Purchase" means

A review is marked Verified Purchase when:
- The reviewer is a registered customer linked to a [customer record](/admin/customers)
- That customer has a completed order containing the reviewed product

This happens automatically. Verified Purchase reviews carry more weight with shoppers.

## Moderation workflow

**Check the Pending tab daily** (or set up notifications for new reviews):

1. Read the review fully before deciding.
2. Click **Approve** if the review is genuine — it immediately appears on the eshop.
3. Click **Reject** if the review violates your policy (spam, hate speech, fake reviews, etc.) — it stays in the database as `rejected` but is not shown.
4. Click **Hide** to temporarily remove an approved review from public view without permanently rejecting it.
5. Click **Delete** to permanently remove the review from the database. Use sparingly — rejection is usually sufficient.

### When to approve

- Any genuine customer experience, including negative ones
- Constructive criticism with specifics
- Reviews from Verified Purchase customers

### When to reject

- Spam or unrelated content
- Profanity or hate speech
- Reviews clearly about a different product
- Fake reviews (5 stars, no detail, no purchase history)

### Reject vs Hide

- **Reject**: Review never makes it public. Use for policy violations before they were ever approved.
- **Hide**: Review was approved and visible, now you're removing it. Use when a review aged poorly or when you discover a problem after approval. The reviewer can see their review is no longer shown.

## How ratings update

The product's average rating and review count update **automatically** via a database trigger whenever a review is approved or removed. You do not need to manually recalculate anything.

## Related pages

- [Products](/admin/products) — reviews are per-product; same MANAGE_PRODUCTS permission
- [Customers](/admin/customers) — reviewer's customer record linked in card email
- [Permissions](/users/permissions) — MANAGE_PRODUCTS permission (bit 8)
