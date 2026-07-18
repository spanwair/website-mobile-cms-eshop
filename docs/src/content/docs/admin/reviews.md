---
title: Product Reviews
description: How to manage customer reviews — approve, reject, hide, and monitor ratings.
---

## Where to find it

**Admin → Reviews** (`/admin/reviews`)

## How reviews work

1. A customer visits a product page and fills in the review form
2. The review is saved with status `pending`
3. You see it appear in the Pending tab
4. You approve, reject, or hide it
5. Approved reviews appear immediately on the product page for all visitors
6. The product's star rating and review count update automatically

## Review statuses

| Status | Meaning | Visible on shop? |
|--------|---------|-----------------|
| `pending` | Awaiting moderation | No |
| `approved` | Published | Yes |
| `rejected` | Not published, spam/inappropriate | No |
| `hidden` | Published before but now hidden | No |

## Verified Purchase badge

When a reviewer has a completed order containing that product, their review gets a **Verified Purchase** badge. This happens automatically if:
- The reviewer is a registered customer (`customer_id` linked)
- Their account has an order containing that product (`order_id` linked)

## Aggregate rating

The product's `rating_avg` and `review_count` are updated automatically by a database trigger whenever a review is approved or removed. No manual action needed.

## Responding to negative reviews

Currently: contact the customer directly via email (visible on the review card).

Future feature: public admin reply on the review.

## What to look for in moderation

**Approve when:**
- Genuine customer experience
- Constructive criticism (even if negative — 1-star reviews build trust)
- Photo of the actual product

**Reject/Hide when:**
- Spam or advertising
- Profanity or hate speech
- Review is about a competitor's product
- Clearly fake (5 stars, "Great product!" with no purchase history)
- Incentivised review that doesn't disclose the incentive (FTC violation)

## Bulk actions

Currently: one review at a time. Future feature: bulk approve (e.g. "approve all pending with rating ≥ 4").
