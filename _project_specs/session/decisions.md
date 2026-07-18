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

## 2026-07-15 — Audit log write pattern

**Decision:** Audit logs are written inside DB triggers where possible (DDL changes) and via `auditService.log()` in application layer for user-driven actions.
**Fields required:** `action`, `table_name`, `record_id`, `party_id`, `user_id`, `ip_address`, `device_info`, `old_value` (jsonb), `new_value` (jsonb), `created_at`
