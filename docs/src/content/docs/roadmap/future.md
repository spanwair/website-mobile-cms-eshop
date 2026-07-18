---
title: Roadmap
description: What's planned for future versions.
---

## Near-term (next sprint)

### Activate integrations (ready to wire, need credentials)
- [ ] Wire Stripe checkout (`/api/checkout` + `/api/stripe/webhook` endpoints)
- [ ] Wire Resend emails on order status changes (confirmation, shipping, review request)
- [ ] Abandoned cart cron job (Edge Function, fires 1h after `abandoned_at` set)
- [ ] Customer self-service portal (`/account`, `/account/orders`, `/account/wishlist`)

### Feature completion
- [ ] Order cancellation button in admin UI
- [ ] Inventory item creation UI (currently requires SQL or API)
- [ ] Sitemap.xml generation for SEO

## Medium-term

### Payments
- [ ] Stripe integration for card payments
- [ ] GoPay integration (Czech market)
- [ ] Order status auto-update on payment webhook

### Mobile app
- [ ] Connect mobile screens to real Supabase data
- [ ] Product browsing with category filter
- [ ] Cart and checkout flow
- [ ] Order history in mobile app
- [ ] Push notifications for order updates

### Product enhancements
- [ ] Product variants (size/color/material combinations)
- [ ] Bulk product import from CSV
- [ ] Product duplication (clone a product)
- [ ] Related products

### Customer features
- [ ] Customer registration via mobile app
- [ ] Customer login linked to user account
- [ ] Loyalty points / rewards

## Long-term

### Analytics
- [ ] Sales reports with charts
- [ ] Revenue by category
- [ ] Customer lifetime value
- [ ] Inventory turnover

### Multi-tenancy at scale
- [ ] Self-service organization creation
- [ ] Billing per organization (subscription tiers)
- [ ] White-label option (custom domain per org)

### Integrations
- [ ] Shipping providers (DHL, PPL, Zásilkovna)
- [ ] Accounting software export (POHODA, FAKTUROID)
- [ ] Google Shopping feed
- [ ] Facebook Catalog integration

### Mobile
- [ ] iOS App Store deployment
- [ ] Android Play Store deployment
- [ ] Barcode scanner for inventory
- [ ] Offline mode for stock counts

## How to contribute

The `_project_specs/todos/` folder tracks active work:
- `active.md` — current sprint tasks
- `backlog.md` — approved but not started
- `completed.md` — done work

When implementing a feature, update the progress page in this documentation to reflect what changed.
