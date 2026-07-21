# website-mobile-template — AGENTS.md

> Canonical project context for AI agents (Hermes, Codex, Claude Code, OpenCode). Loaded automatically when working in this directory.

---

## Project Overview

**website-mobile-template** is a production-ready, multi-tenant SaaS e-commerce CMS monorepo with three deliverables:

| Component | Technology | Purpose |
|-----------|------------|---------|
| `website/` | Astro 5 (SSR) + TypeScript | Admin panel (22 pages), public shop, marketing site |
| `mobile/` | Expo 55 / React Native 0.83 | Native iOS/Android customer app |
| `shared/` | TypeScript | Services, types, i18n, constants — shared by both apps |
| `supabase/` | PostgreSQL + Edge Functions (Deno) | Database, auth, serverless logic, RLS |
| `docs/` | Starlight (Astro) | Full documentation site |

**Key metrics:** 32 DB tables, 22 admin pages with RBAC, 16 shared services, 149 E2E tests passing, 3-layer multi-tenancy enforcement.

---

## Monorepo Structure

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

### `shared/` — Most Important Folder

```
shared/
├── constants/
│   ├── permissions.ts      # Role constants, bitmasks, helpers (SINGLE SOURCE OF TRUTH)
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
│   └── types.ts            # Auto-generated DB types (NEVER EDIT MANUALLY)
└── types/
    └── index.ts            # Shared TypeScript interfaces
```

### `website/`

```
website/
├── src/
│   ├── components/
│   │   └── cms/            # Admin UI components (CmsLayout, ProductImages, etc.)
│   ├── lib/
│   │   ├── admin.ts        # requireAdminCtx() — auth guard for admin pages
│   │   ├── i18n.ts         # useT() — translation helper for Astro
│   │   ├── supabase.ts     # createSupabase() — client factory (SSR)
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

### `supabase/`

```
supabase/
├── migrations/             # 32 SQL migration files (applied in order)
└── functions/              # Edge Functions (Deno)
    ├── delete-account/
    ├── hello-template/
    └── _shared/
```

---

## Database Schema (Key Tables)

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

## Multi-Tenancy Architecture (Critical)

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

- **NEVER use `service_role` key** — bypasses all RLS, exposes all tenants
- **Always filter public endpoints by `party_id`** — otherwise get all orgs' data
- Public endpoints readable with `anon` key only: products, categories, brands, reviews (with filters)

---

## Role & Permission System

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

## Stripe Implementation Architecture

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

### Idempotency Guard

```typescript
INSERT INTO platform_purchase_sessions(stripe_session_id, party_id)
ON CONFLICT (stripe_session_id) DO NOTHING
// Only proceed if insert succeeded
```

---

## Current State (as of 2026-07-18)

### ✅ Fully Working

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

## Development Commands

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

## Environment Variables

| File | Purpose |
|------|---------|
| `.env.development` | Local Supabase URL, anon key, service role key |
| `.env.development.example` | Template for development |
| `.env.production.example` | Template for production |
| `.envrc.example` | direnv template |

---

## Key Files to Know

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

## Testing

- **E2E:** 149 Playwright tests — 100% passing
- **Coverage:** auth, parties, categories, products, orders, customers, inventory, pricing, users, audit, dashboard, access control
- **Mobile:** Jest + React Native Testing Library (scaffold)
- **Run:** `pnpm test:e2e` in `website/`

---

## Revenue Projection (Conservative)

| Month | New Merchants | License Revenue | Cumulative | Avg GMV/Merchant | Commission (9%) | Total Month Revenue |
|-------|--------------|-----------------|------------|-----------------|-----------------|--------------------|
| M1 | 5 | €2,995 | 5 | €800 | €360 | €3,355 |
| M3 | 10 | €5,990 | 25 | €2,000 | €4,500 | €10,490 |
| M6 | 15 | €8,985 | 70 | €4,000 | €25,200 | €34,185 |
| M12 | 20 | €11,980 | 180 | €7,000 | €113,400 | €125,380 |

*Commission dominates from M3 onward — license is acquisition fuel, commission is compounding revenue*

---

## Agent Instructions

When working in this codebase:

1. **Always run `pnpm test:e2e` in `website/` before declaring changes done** — 149 tests must pass
2. **Never edit `shared/supabase/types.ts` manually** — it's auto-generated from DB
3. **Never use `service_role` key** — bypasses all RLS, exposes all tenants
4. **Always filter by `party_id`** in public endpoints — multi-tenancy is critical
5. **Use `requireAdminCtx()`** for all admin pages — it handles auth, party context, permissions
6. **Follow the bitmask permission system** in `shared/constants/permissions.ts` — single source of truth
7. **For Stripe work, reference smalljobs-mobile** — the patterns are proven there
8. **Run TypeScript checks** (`pnpm typecheck`) in both `website/` and `mobile/`
9. **Migrations only via `supabase/migrations/`** — never edit Supabase Dashboard directly
10. **Mobile app uses shared services** — connect screens to real data via `shared/services/`

---

## Prioritized Next Actions

1. Connect mobile app screens to real data via shared services
2. Wire Stripe checkout (keys + endpoint + webhook)
3. Wire Resend email triggers (5 templates ready)
4. Build customer self-service portal (`/account` pages)
5. Implement abandoned cart cron/Edge Function
6. Add product variants (size/color)
7. Build Reports page with charts
8. Production deployment pipeline