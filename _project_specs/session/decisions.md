# Architectural Decisions

## 2026-07-15 — RBAC: Bitmask over enum

**Decision:** Permissions use BIGINT bitmask (not enum, not junction table per-permission)
**Why:** Adding new permissions requires no schema changes; a single column stores combined permissions efficiently; bitwise AND checks are fast and indexable.
**Rule:** All permission checks use `(user_permissions & REQUIRED_PERMISSION) !== 0`. Combine permissions with bitwise OR.

## 2026-07-15 — Party as multi-tenant root

**Decision:** Every CMS entity (products, orders, roles, etc.) belongs to a `party_id`
**Why:** Makes the template multi-tenant from day one. Each organization manages its own data without cross-contamination. RLS policies filter by party.
**Rule:** Every CMS table MUST have `party_id UUID REFERENCES parties(id)` and RLS must filter by the calling user's party membership.

## 2026-07-15 — Google OAuth profile upsert strategy

**Decision:** On Google OAuth callback, upsert profile: set `full_name`, `avatar_url`, `email` ONLY if the fields are currently NULL (do not overwrite user-customized values)
**Why:** User may have manually updated their display name. Google data should fill gaps, not overwrite choices.
**Rule:** In the `handle_new_user` trigger AND the auth callback handler: `UPDATE profiles SET full_name = COALESCE(full_name, $google_name), avatar_url = COALESCE(avatar_url, $google_photo)`.

## 2026-07-15 — Light theme: no dark backgrounds in CMS

**Decision:** All website/CMS pages use a light theme. Dark is reserved for code blocks only.
**Color tokens:**
- Background: #FFFFFF (page), #F8F9FA (surface), #F1F3F5 (subtle)
- Border: #E9ECEF (default), #DEE2E6 (strong)
- Text: #212529 (primary), #6C757D (muted), #ADB5BD (placeholder)
- Accent: #4F46E5 (indigo primary), #7C3AED (purple secondary)
- Success: #10B981 | Warning: #F59E0B | Error: #EF4444
- Shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)
**Rule:** Replace all dark hex (#0F0F1A, #1A1A2E, #808099, #FF5E1A) with light theme tokens across website/ and mobile/.

## 2026-07-15 — File size limit: 200 lines max

**Decision:** Split any file that exceeds 200 lines by component, route, or util.
**Why:** CLAUDE.md rule. Keeps files reviewable in one scroll.

## 2026-07-15 — No logic duplication: shared/ first

**Decision:** Any service, validation, or type that appears in both website and mobile belongs in shared/.
**Why:** CLAUDE.md rule #1. One source of truth.

## 2026-07-15 — Pagination standard

**Decision:** All list endpoints return `PaginatedResult<T>` from shared/types/index.ts: `{ data: T[], total: number, page: number, pageSize: number }`
**Default page size:** 25

## 2026-07-15 — Inventory transfer movement pattern

**Decision:** The `transfer` movement type in `stock_movements` has no trigger branch — it must be modeled as two paired movements in the application layer.
**Why:** A transfer moves stock from warehouse A to warehouse B; it requires two `inventory_items` rows to update atomically. The DB trigger only touches one row. Single-row trigger logic can't express this.
**Rule:** `inventoryService` must implement transfers as two sequential movements: one `damage`-type deduction on the source warehouse, one `purchase`-type addition on the destination warehouse, wrapped in a Supabase transaction (or RPC call). Never call `transfer` type directly from the application layer — it is reserved for future DB-level transfer support.

## 2026-08-06 — Storefront onboarding agent team

**Decision:** Added an 11-agent team (`agents/product-agent.md` + 10 `storefront-*.md`
specialists) that builds a brand-new storefront org from a source business website in one
pipeline: scrape → advise (business fit) → plan → categorize → style/media → CMS copy →
database seed → disclaimer sign-off → publish (local dev) → test.
**Why:** The user asked to onboard "Kytka z Beskyd" (modeled on kytkazbeskyd.cz) the same way
"Repasado" exists as a demo org, and explicitly wants this repeatable next time by just
invoking "Product Agent" — this required a real, invocable agent (YAML frontmatter, like
`stripe-integration-specialist.md`), not another plain-prose team doc.
**Rule:** Product Agent always runs the pipeline in the documented order and never lets
`storefront-publisher` run before `storefront-disclaimer` returns COMPLIANT. See
`agents/storefront-disclaimer.md` for the compliance rules this established:
- Never rehost a scraped third-party product/logo photo as a live DB image — generate
  original placeholder SVGs instead (`scripts/gen-<slug>-media.mjs`), same policy as the
  existing `scripts/gen-demo-media.mjs`.
- Never fabricate an official registration number (IČO/DIČ/court registration) for a real,
  identifiable person or business — leave `NULL` / "to be confirmed" instead.
- A real business's own currently-published contact facts (phone, village/address) may be
  reused factually for their own future storefront; marketing prose must be freshly written.
- Seed target defaults to local dev only; production requires an explicit separate ask.
**Reference implementation:** `supabase/seed/kytka_store_org.sql` /
`kytka_store_catalog.sql` / `kytka_store_legal.sql`, `scripts/gen-kytka-media.mjs`,
`_project_specs/session/disclaimer_review_kytka_z_beskyd.md`.

**Correction (same day):** the "never rehost scraped photos" default above was too cautious.
When the user explicitly names a specific real business and asks to onboard it, that is
authorization to use that business's own public product/logo photos on its own new
storefront — the fix is to upload them into this project's own Supabase Storage
(`product-images`/`store-media` buckets, via `scripts/upload-kytka-media.sh`), not to hotlink
the source site or to fabricate placeholder art instead. Placeholder SVG generation
(`scripts/gen-demo-media.mjs`/`gen-kytka-media.mjs`) is now the *fallback* for when no real
photos exist (fictional/demo orgs, or a source site with no product imagery), not the
default. `agents/storefront-styles.md`, `agents/storefront-disclaimer.md`, and
`agents/storefront-database.md` were updated to reflect this; Kytka z Beskyd's seed files and
live dev DB rows were both switched from placeholder SVGs to the real uploaded photos.

## 2026-08-06 — Two storefront platform bugs found via Kytka z Beskyd, fixed globally

**Decision:** Fixed two pre-existing bugs in shared storefront code, discovered while
reviewing the new Kytka z Beskyd org but confirmed present on Repasado too (not org-specific):
1. `fetchOutOfStockMap` (`shared/services/searchService.ts`) only summed `inventory_items`
   rows with `variant_id IS NULL`. The `create_default_inventory_item()` trigger always
   creates that row at `qty_on_hand=0` when a product is inserted, before variants exist — any
   product stocked only at variant level (the common case) therefore always read as 0
   available and showed a false "Vyprodáno" badge regardless of real variant stock. Confirmed
   on Repasado's iPhone category (iphone-15, iphone-15-pro falsely marked sold out).
   **Fix:** sum every `track_inventory=true` row per product (product-level + variant-level),
   not just the product-level one.
2. `StorefrontNav.astro`'s profile dropdown (`#profile-toggle`/`#profile-dropdown`) had no
   click handler at all — a different component, `ProfileMenu.astro`, has the correct
   toggle-on-click script, but `StorefrontNav.astro` (the one actually used on `/eshop-*`
   pages) never got it. **Fix:** added the same toggle script. Also fixed: `.nav-search-input`
   lacked `appearance:none`, so Chrome/Safari rendered native `input[type=search]` chrome
   (inset shadow/border) on top of the custom flat design.
**Why:** All three bugs are in components shared by every storefront org, not seed data —
fixing only Kytka's data would have left Repasado (and any future org) broken the same way.
**Rule:** `agents/storefront-tester.md` now explicitly re-checks for false out-of-stock badges
and missing hero/blog images every time (see "Known bug classes" section) — these fail
silently (still HTTP 200) so a status-code-only smoke test misses them.

**Related data fix (Kytka-specific):** 9 of Kytka's 12 products are purely made-to-order and
had been seeded with `track_inventory=true` + an arbitrary random quantity, so they could
still show false-sold-out once that random counter hit zero even after the query fix above.
Corrected to `track_inventory=false` for made-to-order variants and their product-level
rollup row — a made-to-order item is never genuinely "out of stock." Documented as a
non-negotiable rule in `agents/storefront-database.md` (rule 8) for future orgs.

## 2026-07-15 — Audit log write pattern

**Decision:** Audit logs are written inside DB triggers where possible (DDL changes) and via `auditService.log()` in application layer for user-driven actions.
**Fields required:** `action`, `table_name`, `record_id`, `party_id`, `user_id`, `ip_address`, `device_info`, `old_value` (jsonb), `new_value` (jsonb), `created_at`
