# PROJECT INITIALIZATION — website-mobile-template
**Last Updated:** 2026-07-21
**Branch:** master
**Root:** `/home/jan/PROJECTS/react-native/website-mobile-template`

---

## 1. PROJECT OVERVIEW

**website-mobile-template** is a **production-ready, multi-tenant SaaS e-commerce CMS** built as a monorepo with three primary deliverables:

| Component | Technology | Purpose |
|-----------|------------|---------|
| **website/** | Astro 5 (SSR) + TypeScript | Admin panel (22 pages), public shop, marketing site |
| **mobile/** | Expo 55 / React Native 0.83 | Native iOS/Android customer app |
| **shared/** | TypeScript | Services, types, i18n, constants — shared by both apps |
| **supabase/** | PostgreSQL + Edge Functions (Deno) | Database, auth, serverless logic, RLS |
| **docs/** | Starlight (Astro) | Full documentation site |

### Core Architecture
- **32 database tables** covering: products, orders, pricing, inventory, carts, wishlists, returns, reviews, audit, loyalty, parties, roles, permissions
- **22 admin pages** with full RBAC (Owner → Admin → Eshop Admin → User)
- **16 shared services** for business logic (auth, cart, orders, pricing, inventory, notifications, customers, reviews, returns, audit)
- **149 E2E tests passing** (Playwright + Chromium)
- **Multi-tenancy** enforced at 3 layers: RLS, cross-party triggers, application scope

---

## 2. MONETIZATION MODEL (from marketing strategist plan)

### Revenue Model: One-Time Platform License + Permanent Commission Tier

| Tier | One-Time Price | Commission | Includes |
|------|---------------|------------|----------|
| **Self-Hosted (OSS)** | Free | 0% (own Stripe) | User, Eshop Admin, Admin roles; community support |
| **Standard Cloud** | €499 | 10% per sale | Managed hosting; all features; docs |
| **Premium Cloud** | €799 | 5% per sale | Managed hosting; full source + 6mo updates |

**Template Add-ons (Cloud only):**
- Template Minimal / Bold / Warm: €49 each
- All-Templates Bundle: €99

### Money Flow
1. **Merchant acquisition:** One-time Stripe Checkout (mode: `payment`) → sets `parties.commission_rate` + `commission_tier` permanently
2. **Per-sale commission:** Stripe Connect splits at capture — `application_fee_amount` (10%/5%) to platform, `transfer_data.destination` (90%/95%) to merchant
3. **Never loses money:** Stripe processing fees non-refundable; chargeback fees (€15) borne by merchant; idempotency guards prevent double-grant

### Owner Role
- **Exclusively for platform operator** — never assignable to customers
- Bypasses all party RLS, global multi-tenant access
- Created only via direct DB insert by platform team

---

## 3. CURRENT STATE (from roadmap/progress.md)

### ✅ Fully Working (as of 2026-07-18)

**Infrastructure**
- Monorepo structure (mobile + website + shared + supabase)
- Local Supabase with 32 migrations
- Two-environment setup (development + production)
- Shared TypeScript types auto-generated from DB
- Shared i18n (Czech + English)
- pnpm workspaces

**Authentication**
- Email + password, Magic link, Google OAuth
- SSR session management (cookies)
- Role-based access control (Owner/Admin/EshopAdmin/User)
- Per-organization user visibility
- Permission bitmask system

**Admin Website — All 22 Pages Working**
- Dashboard with 6 KPI cards
- Organizations (parties) — full CRUD + member management
- Categories — tree view, hierarchy, full CRUD
- Products — full CRUD, search, filter by status/category
- Product images — Supabase Storage upload, set primary, delete
- Categories connected to Products (multi-select on product form)
- Orders — status lifecycle, tracking, customer link
- Customers — CRUD, search, order history
- Inventory — stock adjustments, low stock alerts
- Pricing — discount rules (%, fixed), coupon codes
- Users — role management with hierarchy enforcement
- Custom roles — create with permission checkboxes, delete
- Notifications — system notifications, unread status
- Audit log — all data changes logged, filterable

**Testing**
- 149 E2E tests — 100% passing
- Real browser (Playwright + Chromium)
- Screenshots at every step
- Global seed setup/teardown

**Mobile App Scaffold**
- Expo 55 / React Native 0.83
- NativeWind (Tailwind for RN)
- React Query for data fetching
- MMKV for encrypted storage
- Zustand for global state
- Auth screens, item list/detail, navigation

**Customer Journey — All Stages Implemented**
- Public shop (`/shop`) — product grid, category filter, search, sort
- Product detail (`/shop/[slug]`) — image gallery, variants, reviews, related
- Review system — submit, pending moderation, admin approve/reject/hide
- Shopping cart — persistent carts + cart_items, coupon support
- Wishlist — wishlists + wishlist_items, price-drop notification ready
- Returns & RMA — return_requests + return_items, admin workflow, auto-restock
- Customer enrichment — GDPR consent, marketing opt-in, loyalty points, LTV, segments
- Loyalty transactions — earn/redeem/expire with balance tracking
- Stripe scaffold ready (`website/src/lib/integrations/stripe.ts`)
- Email scaffold ready (`website/src/lib/integrations/email.ts` — 5 templates via Resend)
- Admin Reviews page
- Admin Returns page with full resolution workflow

### 🚧 Partially Done
- Order cancellation button — backend supports, no UI
- Mobile app — screens exist but not connected to real data
- Reports page — placeholder, no charts
- Stripe checkout — scaffold ready, needs keys + endpoint
- Resend emails — scaffold ready, needs keys + trigger wiring
- Customer self-service portal (`/account` pages)
- Abandoned cart job — field exists, needs cron/Edge Function

### ❌ Not Started
- Payment integration (Stripe, GoPay)
- Email notifications to customers
- Customer-group pricing
- Multi-language product content
- Product variants (size/color)
- Barcode scanning (mobile)
- CSV exports
- Production deployment pipeline

---

## 4. MONOREPO STRUCTURE

```
website-mobile-template/
├── mobile/                 # React Native / Expo app
├── website/                # Astro 5 SSR admin + public website
├── shared/                 # Code shared by both (services, types, i18n)
├── supabase/               # DB migrations and Edge Functions
├── docs/                   # Starlight documentation
├── scripts/                # Build, deploy, utility scripts
└── _project_specs/         # Project planning and session notes
```

### shared/ (most important folder)
```
shared/
├── constants/
│   ├── permissions.ts      # Role constants, bitmasks, helpers
│   └── theme.ts            # Colors and spacing
├── i18n/
│   ├── locales/cs.ts       # Czech translations
│   ├── locales/en.ts       # English translations
│   └── getT.ts             # Translation helper
├── services/               # 16 business logic services
│   ├── authService.ts
│   ├── categoryService.ts
│   ├── customerService.ts
│   ├── productService.ts
│   ├── productImageService.ts
│   ├── profileService.ts
│   ├── auditService.ts
│   ├── inventoryService.ts
│   ├── orderService.ts
│   ├── permissionsService.ts
│   ├── partyService.ts
│   ├── pricingService.ts
│   ├── returnService.ts
│   └── reviewService.ts
├── supabase/
│   └── types.ts            # Auto-generated DB types (never edit manually)
└── types/
    └── index.ts            # Shared TypeScript interfaces
```

### website/
```
website/
├── src/
│   ├── components/
│   │   └── cms/            # Admin UI components (CmsLayout, ProductImages, etc.)
│   ├── lib/
│   │   ├── admin.ts        # requireAdminCtx() — auth guard for admin pages
│   │   ├── i18n.ts         # useT() — translation helper for Astro
│   │   ├── supabase.ts     # createSupabase() — client factory
│   │   └── integrations/
│   │       ├── stripe.ts   # Stripe client + checkout helpers (scaffold)
│   │       └── email.ts    # Resend client + 5 templates (scaffold)
│   └── pages/
│       ├── admin/          # All 22 admin pages (SSR, protected)
│       ├── shop/           # Public shop (product grid, detail, cart)
│       ├── auth/           # Login, signup, password reset
│       ├── dashboard.astro
│       ├── index.astro     # Marketing landing page (placeholder)
│       ├── login.astro
│       ├── profile.astro
│       └── settings.astro
├── tests/
│   └── e2e/                # Playwright E2E tests (149 passing)
└── playwright.config.ts
```

### supabase/
```
supabase/
├── migrations/             # 32 SQL migration files (applied in order)
└── functions/              # Edge Functions (Deno)
    ├── delete-account/
    ├── hello-template/
    └── _shared/
```

---

## 5. DATABASE SCHEMA (Key Tables)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | Extends Supabase Auth | `id`, `email`, `display_name`, `role` (1/2/4/8), `avatar_url`, `lang` |
| `parties` | Organizations | `id`, `name`, `slug`, `company_name`, `vat_number`, `billing_email`, `is_active` |
| `user_party_roles` | User ↔ Party + Role | `user_id`, `party_id`, `role_id` |
| `products` | Product catalog | `id`, `party_id`, `title`, `slug`, `price`, `discount_price`, `status`, `is_featured` |
| `categories` | Category tree | `id`, `party_id`, `parent_id`, `name`, `slug`, `is_visible` |
| `orders` | Customer orders | `id`, `party_id`, `customer_id`, `order_number`, `status`, `payment_status`, `total_amount` |
| `customers` | Customer contacts | `id`, `party_id`, `first_name`, `last_name`, `email`, `phone` |
| `inventory_items` | Stock per product/warehouse | `id`, `party_id`, `product_id`, `warehouse_id`, `qty_on_hand`, `qty_reserved` |

**Storage:** `product-images` bucket (public read, authenticated upload/delete)

---

## 6. MULTI-TENANCY ARCHITECTURE

### Three Enforcement Layers

1. **Row Level Security (database)** — Every table has RLS enabled with functions:
   - `user_has_permission(auth.uid(), party_id, permission_bit)`
   - `is_admin_of(party_id)`
   - `is_owner()` — bypasses all party restrictions

2. **Cross-party integrity triggers** — Block cross-party data mixing:
   - `check_order_item_party`, `check_inventory_party`, `check_stock_movement_party`
   - `check_return_party`, `check_price_list_item_party`, `check_loyalty_party`

3. **Application layer** — `requireAdminCtx()` reads `activePartyId` cookie, validates against user's accessible parties, passes `partyId` to all service functions

### Critical Rules for Integrations
- **Never use `service_role` key** — bypasses all RLS, exposes all tenants
- **Always filter public endpoints by `party_id`** — otherwise get all orgs' data
- Public endpoints readable with `anon` key only: products, categories, brands, reviews (with filters)

---

## 7. ROLE & PERMISSION SYSTEM

### Roles (numeric, higher = more privilege)
| Role | Value | Description |
|------|-------|-------------|
| USER | 1 | Customer — no admin access |
| ESHOP_ADMIN | 2 | Limited admin — manages one org, permissions via custom role |
| ADMIN | 4 | Full org admin — can assign up to Admin, create orgs |
| OWNER | 8 | Platform operator — global access, bypasses party RLS |

### Permissions (bitmask — power of 2)
| Permission | Bit | Admin Pages |
|------------|-----|-------------|
| VIEW_DASHBOARD | 1 | `/admin` |
| MANAGE_USERS | 2 | `/admin/users`, `/admin/parties` |
| MANAGE_ROLES | 4 | `/admin/roles` |
| MANAGE_PRODUCTS | 8 | `/admin/products`, `/admin/reviews` |
| MANAGE_CATEGORIES | 16 | `/admin/categories` |
| MANAGE_ORDERS | 32 | `/admin/orders`, `/admin/returns` |
| MANAGE_INVENTORY | 64 | `/admin/inventory` |
| MANAGE_PRICING | 128 | `/admin/pricing` |
| MANAGE_CUSTOMERS | 256 | `/admin/customers` |
| MANAGE_REPORTS | 512 | `/admin/reports` |
| MANAGE_AUDIT | 4096 | `/admin/audit`, `/admin/parties/{id}` |

**ALL_PERMISSIONS = 65535** (0xffff) — granted to Owner and Admin

### Default Permissions by Role
- **Owner:** ALL_PERMISSIONS + bypasses party restrictions
- **Admin:** ALL_PERMISSIONS (party-scoped for catalog mutations)
- **Eshop Admin:** Custom role bitmask (per-party, no global default)
- **User:** VIEW_DASHBOARD (1) only — redirected from admin pages

---

## 8. IMPLEMENTATION EPICS (from marketing strategist plan)

### Phase 1 — Revenue On (Week 1–2) — CRITICAL PATH
- **EPIC A:** Stripe Edge Functions for License Purchase
  - A1: Migration — add `commission_rate`, `commission_tier`, `stripe_customer_id`, `stripe_connect_status` to `parties`; create `platform_purchase_sessions` table
  - A2: Edge Function `purchase-license` — creates Checkout Session for €499/€799
  - A3: Edge Function `confirm-license` — grants commission tier on redirect (idempotent)
  - A4: Webhook handler `stripe-webhook` — handles `checkout.session.completed` (backup)
  - A5: Payment success page `/payment-success.astro`
- **EPIC D (partial):** Legal pages — `/terms`, `/privacy`, `/refund-policy`

### Phase 2 — Commission Infrastructure (Week 2–3)
- **EPIC B:** Stripe Connect for Per-Sale Commission
  - B1: Edge Function `connect-stripe` — Stripe Connect Express OAuth
  - B2: Admin page `/admin/billing/connect.astro`
  - B3: Shop checkout Edge Function `create-checkout` — `application_fee_amount` + `transfer_data.destination`
  - B4: Webhook handler for customer purchases
  - B5: Refund enforcement — non-refundable Stripe fees on merchant
- **EPIC D (rest):** Legal acceptance tracking at signup

### Phase 3 — Merchant Acquisition (Week 3–4)
- **EPIC C:** Marketing site + onboarding
  - C1: Rebuild landing page (hero, features, pricing, templates, CTA)
  - C2: Create `/pricing` page
  - C3: Create `/signup` merchant flow (3 steps)
  - C4: Create `/admin/billing` dashboard
  - C5: Access guard middleware — redirect to `/pricing` if no tier

### Phase 4 — Retention (Week 4–5)
- **EPIC F:** Email system (Resend) — order confirmation, shipping, welcome, abandoned cart
- **EPIC E:** Customer self-service portal (`/account`, `/account/orders`, `/account/addresses`)
- **EPIC H (partial):** Real revenue numbers in admin dashboard

### Phase 5 — Growth (Week 5–8)
- **EPIC G:** Template marketplace (3 CSS themes, admin selector, dynamic loader, purchase flow)
- **EPIC I:** Open-source release (Owner invariant, GitHub release, upgrade banner, `/open-source` page)
- **EPIC F5:** Abandoned cart recovery cron
- **EPIC H2/H4:** Platform analytics + CSV export
- **EPIC E5:** Mobile eshop connected to real data

---

## 9. STRIPE IMPLEMENTATION ARCHITECTURE

**Source of truth:** `/home/jan/PROJECTS/react-native/smalljobs-mobile/supabase/functions/`

| smalljobs-mobile function | Adapted equivalent |
|---------------------------|-------------------|
| `buy-matches/index.ts` | `purchase-license/index.ts` |
| `confirm-matches-payment/index.ts` | `confirm-license/index.ts` |
| `create-subscription/index.ts` | `connect-stripe/index.ts` |
| `stripe-webhook/index.ts` | `stripe-webhook/index.ts` |

### Dual Confirmation Pattern (prevents missed grants)
1. Merchant pays → Stripe redirects to `/payment-success?session_id=...`
2. Page calls `confirm-license` Edge Function immediately (sync confirm)
3. Stripe fires `checkout.session.completed` webhook → `stripe-webhook` (async backup)
4. Both paths upsert idempotently via `platform_purchase_sessions` unique constraint on `stripe_session_id`

### Idempotency Guard (copied from smalljobs-mobile)
```typescript
INSERT INTO platform_purchase_sessions(stripe_session_id, party_id)
ON CONFLICT (stripe_session_id) DO NOTHING
// Only proceed if insert succeeded
```

---

## 10. TESTING

- **E2E:** 149 Playwright tests — 100% passing
- **Coverage:** auth, parties, categories, products, orders, customers, inventory, pricing, users, audit, dashboard, access control
- **Mobile:** Jest + React Native Testing Library (scaffold)
- **Run:** `pnpm test:e2e` in `website/`

---

## 11. KEY FILES TO KNOW

| File | Purpose |
|------|---------|
| `shared/constants/permissions.ts` | Single source of truth for roles, permissions, helpers |
| `website/src/lib/admin.ts` | `requireAdminCtx()` — auth guard for all admin pages |
| `website/src/lib/supabase.ts` | `createSupabase()` — Supabase client factory (SSR) |
| `website/src/components/cms/CmsLayout.astro` | Admin layout with sidebar, permissions, party switcher |
| `supabase/migrations/` | All schema changes — never edit Supabase Dashboard directly |
| `docs/src/content/docs/architecture/multi-tenancy.md` | Critical integration rules |
| `_project_specs/todos/` | Active work tracking (active.md, backlog.md, completed.md) |

---

## 12. DEVELOPMENT COMMANDS

```bash
# From monorepo root
pnpm install:all          # Install all workspaces
pnpm website              # Start Astro dev server
pnpm mobile               # Start Expo dev server
pnpm db:push              # Push migrations to local Supabase
pnpm functions:deploy     # Deploy Edge Functions
pnpm build:android:dev    # Build Android dev APK
pnpm build:android:prod   # Build Android production APK
pnpm build:android:prod:aab # Build Android AAB

# In website/
pnpm dev                  # Astro dev (use --background for persistent)
pnpm build                # Production build
pnpm test:e2e             # Playwright E2E tests
pnpm typecheck            # TypeScript check

# In mobile/
pnpm start                # Expo start
pnpm test                 # Jest tests
pnpm typecheck            # TypeScript check
```

---

## 13. ENVIRONMENT VARIABLES

| File | Purpose |
|------|---------|
| `.env.development` | Local Supabase URL, anon key, service role key |
| `.env.development.example` | Template for development |
| `.env.production.example` | Template for production |
| `.envrc.example` | direnv template |

---

## 14. REVENUE PROJECTION (Conservative)

| Month | New Merchants | License Revenue | Cumulative | Avg GMV/Merchant | Commission (9%) | Total Month Revenue |
|-------|--------------|-----------------|------------|-----------------|-----------------|--------------------|
| M1 | 5 | €2,995 | 5 | €800 | €360 | €3,355 |
| M3 | 10 | €5,990 | 25 | €2,000 | €4,500 | €10,490 |
| M6 | 15 | €8,985 | 70 | €4,000 | €25,200 | €34,185 |
| M12 | 20 | €11,980 | 180 | €7,000 | €113,400 | €125,380 |

*Commission dominates from M3 onward — license is acquisition fuel, commission is compounding revenue*

---

## 15. VERIFICATION CHECKLISTS

### License Purchase Flow
1. Visit `/pricing` → click "Buy Standard (€499)" → Stripe Checkout (test card)
2. Redirect to `/payment-success?session_id=...` → `confirm-license` runs → DB updated
3. Webhook fires → idempotency guard prevents double-grant
4. Access `/admin/products` → granted
5. Re-submit same `session_id` → insert ignored → tier unchanged

### Per-Sale Commission Flow
1. Merchant connects Stripe (Connect OAuth) → `stripe_account_id` stored
2. Customer buys → `create-checkout` with `application_fee_amount` + `transfer_data.destination`
3. Payment completes → webhook fires → order `payment_status = paid`, `platform_fee_amount` recorded
4. Verify Stripe dashboard: 90%/95% merchant, 10%/5% platform

### Refund / No Money Lost
1. Admin approves return → `updateReturnStatus` → Stripe refund issued
2. Customer refunded in full; Stripe fee (~2.9%+€0.30) = `merchant_fee_deducted` on `return_requests`
3. Platform commission reversed proportionally (not more)

### Legal / Access Guard
1. New account, no license → access `/admin/products` → redirected to `/pricing`
2. Signup → must check ToS box → `legal_acceptances` row with timestamp + IP
3. `/terms` states: 10% commission, Stripe fee non-refundable, €15 chargeback fee merchant-borne

---

## 16. NEXT ACTIONS (Priority Order)

1. **A1** — Migration for platform billing tables
2. **A2** — `purchase-license` Edge Function
3. **A3** — `confirm-license` Edge Function
4. **A4** — `stripe-webhook` Edge Function
5. **A5** — `/payment-success.astro` page
6. **D1-D3** — Legal pages (`/terms`, `/privacy`, `/refund-policy`)
7. **B1-B5** — Stripe Connect + commission infrastructure
8. **C1-C5** — Marketing site, pricing, signup, billing dashboard, access guard
9. **F1-F4** — Email system (Resend)
10. **E1-E4** — Customer self-service portal

---

## 17. REFERENCE: PRIOR SESSION PLANS

Key plans in `/home/jan/.claude/plans/`:
- `you-are-marketing-strategist-cuddly-hanrahan.md` — Full monetization plan (this doc's primary source)
- `i-as-an-owner-modular-spark.md` — Owner role enforcement
- `current-roles-are-perfectly-adaptive-wreath.md` — Role system refinement
- `what-is-the-primary-prancy-karp.md` — Primary project definition
- `on-the-website-when-hidden-sunset.md` — Website architecture decisions

---

**This document serves as the canonical initialization reference. Update it when architecture, priorities, or implementation details change.**