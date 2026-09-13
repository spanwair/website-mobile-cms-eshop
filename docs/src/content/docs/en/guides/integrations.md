---
title: Integrations Guide
description: How to wire up Stripe payments, Resend emails, and shipping providers.
---

## Payments — Stripe

**Status in this repo:** the `stripe` package is installed, and both routes exist — `website/src/pages/api/checkout.ts` (creates the Checkout session) and `website/src/pages/api/stripe/webhook.ts` (verifies the signature, updates `orders.payment_status`, sends the confirmation email on `paid`). All that's left is dropping in your own API keys.

**Why Stripe?** PCI DSS compliant by default when using Stripe Checkout. You never touch raw card numbers — Stripe hosts the payment form.

### 1. Create the account and find your keys

1. Sign up at [dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Every Stripe account has two parallel modes, switched with the toggle top-right of the dashboard: **Test mode** and **Live mode**. Use Test mode for everything until you're ready to take real payments.
3. Go to **Developers → API keys** (left sidebar, or [dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys))
4. You'll see two keys:
   - **Publishable key** (`pk_test_...`) — safe to expose, not used by this template (Stripe Checkout is server-redirected, no client-side Stripe.js needed)
   - **Secret key** (`sk_test_...`) — click **Reveal test key**, copy it
5. Put the secret key in `.env.development`:

```env
STRIPE_SECRET_KEY=sk_test_...
```

6. When you go live, repeat steps 2-5 with the toggle set to **Live mode** (keys become `sk_live_...`) and put that value in `.env.production` instead. **Never put a `sk_live_...` key in `.env.development`.**

### 2. Get the webhook signing secret

The webhook secret is different for local dev vs. production — each webhook *endpoint* Stripe knows about gets its own secret.

**Local development — use the Stripe CLI, not the dashboard:**

```bash
# Install once: https://docs.stripe.com/stripe-cli
stripe login
stripe listen --forward-to localhost:4321/api/stripe/webhook
```

This prints `Ready! Your webhook signing secret is whsec_...` — copy that into `.env.development` as `STRIPE_WEBHOOK_SECRET`. Keep the `stripe listen` process running in a terminal while you test checkout locally; it forwards real Stripe test events to your dev server.

**Production — register the endpoint in the dashboard:**

1. Stripe Dashboard → **Developers → Webhooks** → **Add endpoint**
2. Endpoint URL: `https://yourdomain.cz/api/stripe/webhook`
3. Select events to listen for: `checkout.session.completed`, `checkout.session.async_payment_failed`, `charge.refunded`
4. Click the created endpoint → **Signing secret** → **Reveal** → copy as `whsec_...`
5. Put it in `.env.production` as `STRIPE_WEBHOOK_SECRET`

### 3. Already done: package + routes

`stripe` is in `website/package.json`. The two routes already exist:

- **`website/src/pages/api/checkout.ts`** — takes `{ lineItems, orderId, customerId?, currency? }`, calls `createCheckoutSession()`, returns `{ url }` to redirect the customer to.
- **`website/src/pages/api/stripe/webhook.ts`** — verifies the `stripe-signature` header via `constructWebhookEvent()`, updates `orders.payment_status` via `handleWebhookEvent()`, and on `paid` fetches the order/customer/items and calls `sendOrderConfirmation()`.

The webhook route reads `request.text()` (not `.json()`) — that's required so the raw bytes match what Stripe signed.

### How checkout works end-to-end

```
Customer clicks "Pay"
  → POST /api/checkout creates Stripe Checkout session
  → Customer redirected to Stripe-hosted payment page (checkoutUrl)
  → Customer pays
  → Stripe fires webhook to /api/stripe/webhook
  → handleWebhookEvent() sets orders.payment_status = 'paid'
  → Confirmation email sent (wire sendOrderConfirmation() into the same webhook handler once you have order + customer data available)
```

### Testing it

```bash
# Terminal 1
cd website && pnpm dev

# Terminal 2 — forwards Stripe test events to your local webhook route
stripe listen --forward-to localhost:4321/api/stripe/webhook

# Terminal 3 — trigger a fake event without going through checkout
stripe trigger checkout.session.completed
```

Use [Stripe's test card numbers](https://docs.stripe.com/testing#cards) (`4242 4242 4242 4242`, any future expiry, any CVC) on the actual hosted checkout page.

### PCI compliance notes

Using Stripe Checkout: **SAQ A** level (simplest). You are NOT responsible for card data — Stripe is. Requirements:
- Always use HTTPS (SSL)
- Never log card numbers
- Use Stripe's hosted checkout — never build your own payment form

---

## Transactional Email — Resend

**Status in this repo:** `website/src/lib/integrations/email.ts` already has `sendPartyInvitation` (wired into `/admin/parties/[id].astro`) plus `sendOrderConfirmation`, `sendShippingNotification`, `sendPasswordReset`, `sendReviewRequest`, `sendAbandonedCartRecovery` — those five are written but nothing calls them yet. If `RESEND_API_KEY` is unset, `sendPartyInvitation` logs to the console instead of sending (see `website/src/lib/integrations/email.ts:175`), so invites still work in local dev without any key.

**Why Resend?** Modern, developer-friendly, free tier is 100 emails/day (3,000/month). Built-in React email support.

### 1. Create the account and find your key

1. Sign up at [resend.com](https://resend.com)
2. Go to **API Keys** (left sidebar) → **Create API Key**
3. Give it a name (e.g. `website-dev` or `website-prod`), permission **Full access**, no domain restriction needed to start
4. Copy the key — it's shown **once**, starting with `re_...`

### 2. Sandbox mode vs. verified domain

Until you verify a domain, your account is in **sandbox mode**:
- You can only send emails **to the email address you signed up with**
- `EMAIL_FROM` must be `onboarding@resend.dev` (Resend's shared sandbox sender)

This is fine for local development — put this in `.env.development`:

```env
RESEND_API_KEY=re_...
EMAIL_FROM=onboarding@resend.dev
```

### 3. Verify your domain for production

1. Resend Dashboard → **Domains** → **Add Domain** → enter `yourdomain.cz`
2. Resend shows you 3 DNS records to add at your domain registrar (values are unique per account, copy exactly what Resend shows — the ones below are illustrative):

```
TXT   send.yourdomain.cz            v=spf1 include:amazonses.com ~all
CNAME resend._domainkey.yourdomain.cz   <value from Resend dashboard>
TXT   _dmarc.yourdomain.cz          v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.cz
```

3. Back in the Resend dashboard, click **Verify DNS Records** — propagation can take a few minutes to a few hours
4. Once verified, status turns green and you can send from any address `@yourdomain.cz` to any recipient

Without these DNS records: emails either fail to send (outside sandbox) or land in spam.

5. Put the production values in `.env.production`:

```env
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.cz
PUBLIC_SHOP_URL=https://yourdomain.cz
```

### 4. Install the SDK

```bash
cd website && pnpm add resend
```

### Email functions available

| Function | Status | Trigger point to wire up |
|----------|--------|---------------------------|
| `sendPartyInvitation()` | ✅ wired | `/admin/parties/[id].astro` invite form |
| `sendOrderConfirmation()` | ✅ wired | `website/src/pages/api/stripe/webhook.ts`, after `payment_status = 'paid'` |
| `sendShippingNotification()` | written, not called | wherever order status is set to `shipped` (not yet built — see `/admin/orders`) |
| `sendPasswordReset()` | written, not called | Supabase Auth already handles password reset via magic link; only needed if you build a custom reset flow |
| `sendReviewRequest()` | written, not called | needs a scheduled job (e.g. Supabase cron / Edge Function) firing 7 days post-delivery |
| `sendAbandonedCartRecovery()` | written, not called | needs a scheduled job checking carts with no order after N hours |

All functions are in `website/src/lib/integrations/email.ts`.

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
