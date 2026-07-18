---
title: Complete Customer Journey
description: Every step a customer takes from discovering the shop to becoming a loyal repeat buyer.
---

## The 7-Stage Customer Journey

Every customer goes through these stages. The CMS has features for all of them.

```
AWARENESS → BROWSING → CONSIDERATION → CHECKOUT → FULFILLMENT → POST-PURCHASE → RETENTION
```

---

## Stage 1: Awareness

The customer finds the shop via Google, social media, or word of mouth.

**What we provide:**
- SEO title and description on every product (`seo_title`, `seo_description` columns)
- Clean URLs: `/shop/product-slug`
- Public product pages accessible without login (anon RLS policies)

**To do before launch:**
- Add Google Search Console
- Set up sitemap.xml (see [SEO guide](../guides/seo))
- Set `seo_title` and `seo_description` on all products in the admin

---

## Stage 2: Browsing

Customer lands on the shop, browses categories, searches for products.

**Pages:**
- `/shop` — product grid with category sidebar, search, price sort
- `/shop?category=electronics` — filtered by category
- `/shop?q=laptop` — full-text search

**Features:**
- Category tree with parent/child hierarchy
- Price sort: newest, lowest, highest, top rated
- Product cards show: image, name, price, sale price, star rating

---

## Stage 3: Consideration

Customer reads product details, checks reviews, adds to wishlist.

**Product detail page (`/shop/[slug]`):**
- Full image gallery with thumbnail switcher
- Multiple images with primary flagged
- Variants (size, color) if defined
- Category tags (clickable, back to filtered list)
- Brand name
- Star ratings with count
- Customer reviews (name, rating, title, body, verified purchase badge)
- "Write a Review" form (any visitor, login optional)
- Related products (same categories)
- "Add to Cart" button

**What we know about reviews:**
- Status: `pending` → must be approved by admin before showing
- `is_verified` = true when the reviewer has an order for this product
- Aggregate rating (`rating_avg`, `review_count`) auto-updated by DB trigger

---

## Stage 4: Checkout

Customer enters address, picks shipping method, pays.

**Current state:** Checkout flow is scaffolded but requires Stripe keys to go live.

**To activate payments:**

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Copy your Secret Key and Webhook Secret
3. Add to `.env.production`:
   ```
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
4. Deploy the webhook endpoint at `/api/stripe/webhook`
5. Register the webhook URL in the Stripe dashboard

**Order flow:**
1. Customer fills cart (`carts` + `cart_items` tables)
2. Clicks "Checkout" → Stripe Checkout session created
3. Stripe redirects back to `/shop/checkout/success?order_id=...`
4. Webhook fires `checkout.session.completed` → order `payment_status` set to `paid`
5. Order confirmation email sent via Resend

---

## Stage 5: Fulfillment

Admin processes the order in the CMS.

**Order lifecycle in admin:**

| Status | What it means | Action |
|--------|--------------|--------|
| `pending` | Order placed, payment received | Review order |
| `confirmed` | Admin acknowledged | Start picking |
| `processing` | Items being picked/packed | Assign picker |
| `shipped` | Parcel sent | Enter tracking number |
| `delivered` | Customer received it | Auto or manual |
| `cancelled` | Cancelled before shipment | Refund if paid |
| `refunded` | Returned and refunded | See Returns |

**Pick & Pack workflow:**
1. Go to `/admin/orders` → click order number
2. Change status to `confirmed`, add internal note
3. Print the order detail page as pick slip
4. Pick items from warehouse (scan barcode if using WMS)
5. Pack and label the parcel
6. Enter tracking number in the order detail
7. Set status to `shipped` → customer gets shipping email (when email integration active)

---

## Stage 6: Post-Purchase

Customer receives the order and optionally returns it or leaves a review.

### Leaving a Review

- Customer visits `/shop/product-slug` → scrolls to "Write a Review"
- Fills name, email, star rating, optional title and body
- Review goes to `pending` status
- Admin approves/rejects in `/admin/reviews`
- Approved reviews appear publicly with star rating

**Review email trigger** (manual for now, automatic once email is set up):
- After delivery, send `sendReviewRequest()` email linking to product pages

### Returns & Refunds

Customer wants to return an item:

1. Customer contacts you (or uses self-service portal once built)
2. Admin goes to `/admin/returns` → they see all Return Requests (RMAs)
3. Admin creates a return linked to the order and specific items
4. Approve the return → send shipping label
5. Receive the items → inspect condition
6. Set `restock: true` on each item in good condition → inventory auto-restored
7. Set resolution: `refund`, `exchange`, or `store_credit`
8. Set `completed` → `completed_at` timestamp set automatically

**Refund rules:**
- Full refund: if item is defective, wrong, or not as described
- Partial refund: damage or customer fault
- Store credit: offered as an alternative to keep the sale
- 9% of returns are fraudulent — check order history before approving

---

## Stage 7: Retention

Turn one-time buyers into loyal repeat customers.

### Loyalty Points

Every customer has a `loyalty_points` balance. The `loyalty_transactions` table records every earn/spend event.

**Default rules (implement in admin):**
- Earn 1 point per 10 Kč spent
- 100 points = 10 Kč store credit
- Bonus points for leaving a verified review

### Abandoned Cart Recovery

When a cart hasn't been updated for 1 hour, `abandoned_at` is set automatically.

**Recovery email sequence:**
1. **1 hour**: Soft reminder — "You left something behind"
2. **24 hours**: Highlight a product benefit
3. **72 hours**: Offer a 10% discount coupon

Use `sendAbandonedCartRecovery()` from `website/src/lib/integrations/email.ts`.

### Wishlist Price Drops

When a product in a customer's wishlist drops in price:
1. Query `wishlist_items` joined to `products` where `discount_price < old_price`
2. Send "Price drop!" notification email
3. Set `notified_at` on the wishlist item to avoid spam

---

## What We Know About Customers

Every customer record (`customers` table) contains:

| Field | Purpose |
|-------|---------|
| `first_name`, `last_name` | Personalise emails |
| `email` | All communication |
| `phone` | SMS shipping updates |
| `addresses[]` | Shipping + billing |
| `is_active` | Disable without deleting |
| `marketing_opt_in` | **GDPR required** — only email if true |
| `gdpr_consent` + `gdpr_consent_at` | **Legal** — record when consent was given |
| `gdpr_consent_ip` | **Legal** — IP at consent time |
| `loyalty_points` | Current balance |
| `customer_group` | standard / vip / wholesale / staff |
| `preferred_language` | cs / en |
| `lifetime_value` | Auto-calculated from paid orders |
| `tags[]` | Free-form segmentation |
| `notes` | Staff-only internal notes |
| `user_id` | Linked Supabase auth account (if registered) |

---

## GDPR Compliance Checklist

Before going live with any marketing emails:

- [ ] `marketing_opt_in = true` before sending newsletters
- [ ] `gdpr_consent = true` recorded at registration/checkout
- [ ] `gdpr_consent_at` timestamped
- [ ] Privacy policy page linked at checkout and registration
- [ ] Cookie consent banner on first visit
- [ ] "Delete my data" request handling (delete customer + order PII)
- [ ] Data retention policy documented (recommend: delete inactive after 3 years)
