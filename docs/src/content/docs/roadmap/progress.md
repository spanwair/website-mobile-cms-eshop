---
title: Current Progress
description: What is implemented and working right now.
---

## Status as of 2026-07-18 (updated — full customer journey)

### ✅ Fully working

#### Infrastructure
- [x] Monorepo structure (mobile + website + shared + supabase)
- [x] Local Supabase setup with migrations
- [x] Two-environment setup (development + production)
- [x] Shared TypeScript types auto-generated from DB schema
- [x] Shared i18n (Czech + English)
- [x] pnpm workspaces

#### Authentication
- [x] Email + password login
- [x] Magic link (passwordless)
- [x] Google OAuth (configured)
- [x] Server-side session management (SSR cookies)
- [x] Role-based access control (Owner/Admin/EshopAdmin/User)
- [x] Per-organization user visibility (Admins only see their party's users)
- [x] Permission bitmask system for fine-grained feature access

#### Admin Website — All pages working
- [x] Dashboard with 6 KPI cards
- [x] Organizations (parties) — full CRUD + member management
- [x] Categories — tree view, parent-child hierarchy, full CRUD
- [x] Products — full CRUD, search, filter by status and category
- [x] Product images — upload via Supabase Storage, set primary, delete
- [x] **Categories connected to Products** — multi-select checkboxes on product form
- [x] Orders — status lifecycle, tracking number, customer link
- [x] Customers — CRUD, search, order history
- [x] Inventory — stock adjustments (purchase/sale/return/damage), low stock alerts
- [x] Pricing — discount rules (% and fixed), coupon codes with max uses
- [x] Users — role management with proper hierarchy enforcement
- [x] Custom roles — create with permission checkboxes, delete
- [x] Notifications — system notifications, unread status
- [x] Audit log — all data changes logged, filterable by table

#### Testing
- [x] **149 E2E tests — 100% passing**
- [x] Real browser (Playwright + Chromium), headed mode locally
- [x] Screenshots at every step
- [x] Global seed setup/teardown
- [x] Tests cover: auth, parties, categories, products, orders, customers, inventory, pricing, users, audit, dashboard, access control
- [x] Tests cover: categories on products (assign/unassign), image uploads (upload/set-primary/delete), user hierarchy visibility

#### Mobile App
- [x] Expo 55 / React Native 0.83 scaffold
- [x] NativeWind (Tailwind for React Native)
- [x] React Query for data fetching
- [x] MMKV for encrypted local storage
- [x] Zustand for global state
- [x] Auth screens (login, confirmation)
- [x] Item list and detail screens
- [x] Navigation structure (tabs + stack)

#### Supabase Storage
- [x] `product-images` bucket configured (public, 5MB limit, image types only)
- [x] RLS policies (authenticated upload, public read, authenticated delete)

#### Customer Journey — All stages implemented

- [x] **Public shop** — `/shop` product grid with category filter, search, sort
- [x] **Product detail** — `/shop/[slug]` with image gallery, variants, reviews, related products
- [x] **Review system** — submit, pending moderation, admin approve/reject/hide, aggregate rating
- [x] **Shopping cart** — persistent `carts` + `cart_items` tables, coupon support
- [x] **Wishlist** — `wishlists` + `wishlist_items`, price-drop notification ready
- [x] **Returns & RMA** — `return_requests` + `return_items`, admin `/admin/returns`, auto-restock trigger
- [x] **Customer enrichment** — GDPR consent, marketing opt-in, loyalty points, lifetime value, segments
- [x] **Loyalty transactions** — earn/redeem/expire log with balance tracking
- [x] **Stripe scaffold** — `website/src/lib/integrations/stripe.ts` ready to wire (needs API key)
- [x] **Email scaffold** — `website/src/lib/integrations/email.ts` — 5 templates via Resend (needs API key)
- [x] **Admin Reviews page** — `/admin/reviews` with approve/reject/hide/delete
- [x] **Admin Returns page** — `/admin/returns` + `/admin/returns/[id]` with full resolution workflow

## 🚧 Partially done

- [ ] Order cancellation button — backend supports it, no UI button yet
- [ ] Mobile app — screens exist but not connected to real data
- [ ] Reports page — placeholder, no charts yet
- [ ] Stripe checkout — scaffold ready, needs keys + `/api/checkout` endpoint
- [ ] Resend emails — scaffold ready, needs keys + trigger wiring on order events
- [ ] Customer self-service portal — `/account` pages for order history, addresses, wishlist
- [ ] Abandoned cart job — `abandoned_at` field exists, needs cron/Edge Function trigger

## ❌ Not started

- [ ] Public-facing shop (product listing, cart, checkout)
- [ ] Payment integration (Stripe, GoPay)
- [ ] Email notifications to customers
- [ ] Customer-group pricing
- [ ] Multi-language product content
- [ ] Product variants (size/color)
- [ ] Barcode scanning (mobile)
- [ ] Export to CSV (orders, customers)
- [ ] Production deployment pipeline
