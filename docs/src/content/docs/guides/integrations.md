---
title: Integrations Guide
description: How to wire up Stripe payments, Resend emails, and shipping providers.
---

## Payments — Stripe

**Why Stripe?** PCI DSS compliant by default when using Stripe Checkout. You never touch raw card numbers — Stripe hosts the payment form.

### Setup

1. Create a Stripe account: [stripe.com](https://stripe.com)
2. Go to **Developers → API keys**
3. Copy the **Secret key** (`sk_live_...`)
4. Add to `.env.production`:

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

5. Install the SDK:

```bash
cd website && pnpm add stripe
```

### How checkout works

```
Customer clicks "Pay" 
  → /api/checkout (POST) creates Stripe Checkout session
  → Customer redirected to Stripe-hosted payment page
  → Customer pays
  → Stripe fires webhook to /api/stripe/webhook
  → We update order payment_status = 'paid'
  → Confirmation email sent
```

### Webhook setup

In Stripe Dashboard → **Developers → Webhooks** → Add endpoint:

- URL: `https://yourdomain.cz/api/stripe/webhook`
- Events: `checkout.session.completed`, `checkout.session.async_payment_failed`, `charge.refunded`

Copy the **Signing secret** as `STRIPE_WEBHOOK_SECRET`.

### PCI compliance notes

Using Stripe Checkout: **SAQ A** level (simplest). You are NOT responsible for card data — Stripe is. Requirements:
- Always use HTTPS (SSL)
- Never log card numbers
- Use Stripe's hosted checkout — never build your own payment form

---

## Transactional Email — Resend

**Why Resend?** Modern, developer-friendly, free tier is 100 emails/day (3,000/month). Built-in React email support.

### Setup

1. Create account: [resend.com](https://resend.com)
2. **Add your domain** under Domains and verify DNS records (SPF + DKIM)
3. Go to **API Keys** → create key
4. Add to `.env.production`:

```
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.cz
```

5. Install:

```bash
cd website && pnpm add resend
```

### Email templates available

| Function | Trigger |
|----------|---------|
| `sendOrderConfirmation()` | After order payment confirmed |
| `sendShippingNotification()` | When order status → `shipped` |
| `sendPasswordReset()` | When customer requests password reset |
| `sendReviewRequest()` | 7 days after delivery |
| `sendAbandonedCartRecovery()` | 1 hour after cart abandoned |

All functions are in `website/src/lib/integrations/email.ts`.

### DNS records to add

```
TXT  send.yourdomain.cz   v=spf1 include:amazonses.com ~all
CNAME resend._domainkey.yourdomain.cz  (provided by Resend)
TXT  _dmarc.yourdomain.cz  v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.cz
```

Without these: emails land in spam.

---

## Shipping — Czech Market

For Czech e-commerce, the most important carriers are:

### Zásilkovna (Packeta)

Most popular in Czech Republic and Slovakia. Offers pickup points (Z-BOX), home delivery, and international.

- API docs: [client.packeta.com/api](https://client.packeta.com/)
- Free to use, pay per shipment
- Integration: send parcel data via REST API, get tracking number back

```typescript
// Future: website/src/lib/integrations/packeta.ts
// POST https://www.zasilkovna.cz/api/rest
// Creates a shipment, returns barcode/tracking
```

### PPL (DHL affiliate)

Business deliveries, signature required. Good for higher-value items.

### Česká pošta

Standard Czech postal service. Good for small packages under 2kg.

### ShipStation (international)

If you ship internationally, ShipStation connects to 200+ carriers via single API.

---

## Storage — Image Capacity

| Plan | DB Storage | File Storage | Monthly Egress |
|------|-----------|-------------|---------------|
| Free | 500 MB | 1 GB | 5 GB |
| Pro ($25/mo) | 8 GB | 100 GB | 250 GB |

**Rule of thumb:** At 500 KB per product image × 5 images × 200 products = 500 MB. You'll hit the free storage limit at around 200 products with 5 images each.

**Recommendation before launch:**
1. Compress all images before upload (target ≤ 500 KB)
2. Use Supabase Image Transformations for thumbnails (resize on-the-fly)
3. Upgrade to Pro once you have 150+ products

**Current bucket:** `product-images` — public, 5 MB max per file, image types only.

---

## Search

Currently: basic `ilike` search in PostgreSQL (works for small catalogs up to ~1000 products).

**When to upgrade:**

At 1000+ products, switch to one of:

- **Supabase pg_search** — PostgreSQL full-text search, free, already in your DB
- **Algolia** — instant search-as-you-type, free tier 10k records
- **Typesense** — self-hosted alternative to Algolia, open source

---

## Analytics

**Recommended: Plausible Analytics**

- Privacy-friendly (no cookies needed, GDPR compliant out of the box)
- €9/month for unlimited sites
- Add to `Layout.astro`:

```html
<script defer data-domain="yourdomain.cz" src="https://plausible.io/js/plausible.js"></script>
```

No consent banner needed for Plausible (no personal data collected).
