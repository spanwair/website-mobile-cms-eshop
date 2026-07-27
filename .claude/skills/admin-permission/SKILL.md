---
name: admin-permissions
description: >
  Authoritative reference for the Roles & Permissions system.
  TRIGGER — load BEFORE touching any file under website/src/pages/admin/,
  website/src/components/cms/Sidebar.astro, website/src/lib/admin.ts, or
  shared/constants/permissions.ts; and before any task that mentions roles,
  permissions, access control, canAssignRole, requireAdminCtx, hasPermission,
  or invite flow. Do NOT skip because a change "looks small."
---

# Admin Permissions — Authoritative Reference

Single source of truth: `shared/constants/permissions.ts`.
Never define role numbers, permission bit values, or label strings anywhere else — always import from there.

---

## Role Hierarchy

| Role | Value | Label | Summary |
|------|-------|-------|---------|
| USER | 1 | user | No admin panel — redirected to /dashboard |
| ESHOP_ADMIN | 2 | eshop_admin | One org, access gated by custom role permission bits |
| ADMIN | 4 | admin | Assigned orgs, ALL_PERMISSIONS per party |
| OWNER | 8 | owner | Global — all orgs, all perms, no party restriction |

Higher number = more privilege. `canAssignRole(myRole, targetRole)` enforces this — never bypass it.

---

## Permission Bits (bitmask — combine with `|`, check with `hasPermission`)

```
VIEW_DASHBOARD    = 1     → /admin (dashboard KPIs, charts, recent orders)
MANAGE_USERS      = 2     → /admin/users, /admin/parties (list + detail)
MANAGE_ROLES      = 4     → /admin/roles, /admin/roles/new
MANAGE_PRODUCTS   = 8     → /admin/products, /admin/reviews, /admin/products/conditions
MANAGE_CATEGORIES = 16    → /admin/categories
MANAGE_ORDERS     = 32    → /admin/orders, /admin/returns, revenue KPI
MANAGE_INVENTORY  = 64    → /admin/inventory
MANAGE_PRICING    = 128   → /admin/pricing
MANAGE_CUSTOMERS  = 256   → /admin/customers
MANAGE_REPORTS    = 512   → /admin/reports, revenue KPI
MANAGE_SETTINGS   = 1024  → /admin/settings/branding, layout, content, benefits, footer, domains
MANAGE_CMS        = 2048  → /admin/cms/navigation, pages, blog, team, faq
MANAGE_AUDIT      = 4096  → /admin/audit + editing party settings in /admin/parties/[id]
ALL_PERMISSIONS   = 0xffff → owner and admin always
perm=0            → /admin/notifications — always visible to any admin
```

**Never write raw integers in page or service code.** Always import from `shared/constants/permissions.ts`.

---

## Role Behaviour

### OWNER (role=8) — sees and does everything
- `isOwner = true`, `isGlobal = true` — always set together, never separately
- Receives `ALL_PERMISSIONS = 0xffff` without any DB lookup
- Party switcher shows ALL parties (RLS bypass via `is_owner()`)
- Without any party: dashboard banner "Create org"; party-scoped pages → `/admin/parties/new`
- Can create new organizations (`/admin/parties/new`)
- Only role that can set a party's status to `closed` or reopen a closed org
- Can assign any role including owner
- Cannot change their own role (`u.id === session.user.id` guard in /admin/users)
- Dashboard: all KPI groups visible (users, products, orders, revenue, audit)

### ADMIN (role=4) — full control within assigned orgs
- `isOwner = false`, `isGlobal = false`
- Receives `ALL_PERMISSIONS = 0xffff` but scoped to assigned parties
- Requires a `user_party_roles` entry; without one `partyId = null` → `/admin/setup`
- Can create new parties (`/admin/parties/new`)
- Cannot set party status to `closed`
- Cannot change status of a party already `closed` (server rejects with `errorClosedOrg`; UI shows read-only label `statusClosedReadonly`)
- Peer-admin assignment: can assign other admins only if they originally assigned them (`admin_assigned_by` check) OR are owner
- Can invite as eshop_admin or admin; when inviting as admin no party role needed (full perms via system role); when inviting as eshop_admin must pick party + custom role

### ESHOP_ADMIN (role=2) — one org, permission-gated
- Assigned to exactly ONE party
- `permissions` resolved via `get_user_permissions(userId, partyId)` DB RPC — bitwise OR of all custom roles in that party
- Custom roles are global (`roles.party_id = null`), assigned per-party in `user_party_roles`
- Without a party: redirected to `/admin/setup`
- Cannot access another party's data (RLS + `ctx.parties` scoping)
- Cannot assign admin or owner roles
- Cannot set party status to `closed`
- Cannot create organizations

### USER (role=1) — no admin access
- `requireAdminCtx` returns `null` → every `/admin/*` redirects to `/dashboard`
- No exceptions, no fallbacks

---

## Critical Invariants — NEVER BREAK

```typescript
// CORRECT
isOwner  = role >= ROLE.OWNER  // 8
isGlobal = role >= ROLE.OWNER  // 8  ← SAME AS isOwner

// WRONG — the recurring bug
isGlobal = role >= ROLE.ADMIN  // ← breaks party scoping for admin
```

`isGlobal` and `isOwner` are always identical. Admin gets `isGlobal = false`.

---

## Canonical Party Redirect — ONE LINE ONLY

Every party-scoped page uses exactly this:
```typescript
if (!ctx.partyId) return Astro.redirect(ctx.isOwner ? "/admin/parties/new" : "/admin/setup");
```

- Owner without party → `/admin/parties/new`
- Admin/eshop_admin without party → `/admin/setup`

**Never use the old two-line pattern:**
```typescript
// WRONG — do not copy this
if (!ctx.isGlobal && !ctx.partyId) return Astro.redirect("/admin/setup");
if (!ctx.partyId) return Astro.redirect("/admin/parties");
```

The dashboard (`/admin/index.astro`) is the ONLY exception — uses `!ctx.isGlobal && !ctx.partyId` to render an inline banner for owner and redirect others to setup.

---

## Runtime Permission Flow

1. Page calls `requireAdminCtx(client, userId, activePartyId)` — `website/src/lib/admin.ts`
2. Reads `profiles.role` from DB
3. `role < ESHOP_ADMIN` → return `null` → page does `Astro.redirect("/dashboard")`
4. `role >= ADMIN` → `permissions = ALL_PERMISSIONS`, skip DB lookup
5. `role == ESHOP_ADMIN` → calls `get_user_permissions(userId, partyId)` DB RPC
6. DB function returns bitwise OR of all roles held in that party
7. Every page guard: `hasPermission(ctx.permissions, PERMISSIONS.X)`
8. Sidebar: same `hasPermission` check per entry; perm=0 entries always shown

---

## Page → Permission Mapping

| URL | Required bit | Redirect if missing |
|-----|-------------|---------------------|
| /admin | VIEW_DASHBOARD (1) | → /admin/notifications |
| /admin/users | MANAGE_USERS (2) | → /admin |
| /admin/roles | MANAGE_ROLES (4) | → /admin |
| /admin/roles/new | MANAGE_ROLES (4) | → /admin |
| /admin/parties | MANAGE_USERS (2) | → /admin |
| /admin/parties/[id] | MANAGE_USERS (2) OR MANAGE_AUDIT (4096) — either | → /admin |
| /admin/products | MANAGE_PRODUCTS (8) | → /admin |
| /admin/reviews | MANAGE_PRODUCTS (8) | → /admin |
| /admin/categories | MANAGE_CATEGORIES (16) | → /admin |
| /admin/orders | MANAGE_ORDERS (32) | → /admin |
| /admin/returns | MANAGE_ORDERS (32) | → /admin |
| /admin/inventory | MANAGE_INVENTORY (64) | → /admin |
| /admin/pricing | MANAGE_PRICING (128) | → /admin |
| /admin/customers | MANAGE_CUSTOMERS (256) | → /admin |
| /admin/reports | MANAGE_REPORTS (512) | → /admin |
| /admin/audit | MANAGE_AUDIT (4096) | → /admin |
| /admin/notifications | none (perm=0) | always visible |
| /admin/setup | — | shown when no party and not owner |
| /admin/parties/new | role >= ADMIN | no partyId required |
| /admin/products/conditions | MANAGE_PRODUCTS (8) | → /admin |
| /admin/settings/benefits, footer (extends branding/layout/content/domains) | MANAGE_SETTINGS (1024) | → /admin |
| /admin/cms/navigation, pages, blog, team, faq | MANAGE_CMS (2048) | → /admin |

---

## Sidebar Mapping (`website/src/components/cms/Sidebar.astro`)

| Group | Entry | Perm bit |
|-------|-------|----------|
| Overview | Dashboard | VIEW_DASHBOARD (1) |
| Eshop | Products | MANAGE_PRODUCTS (8) |
| Eshop | Categories | MANAGE_CATEGORIES (16) |
| Eshop | Orders | MANAGE_ORDERS (32) |
| Eshop | Customers | MANAGE_CUSTOMERS (256) |
| Eshop | Pricing | MANAGE_PRICING (128) |
| Eshop | Inventory | MANAGE_INVENTORY (64) |
| Eshop | Reviews | MANAGE_PRODUCTS (8) |
| Eshop | Returns | MANAGE_ORDERS (32) |
| Eshop | Conditions | MANAGE_PRODUCTS (8) |
| Content | Navigation | MANAGE_CMS (2048) |
| Content | Pages | MANAGE_CMS (2048) |
| Content | Blog | MANAGE_CMS (2048) |
| Content | Team | MANAGE_CMS (2048) |
| Content | FAQ | MANAGE_CMS (2048) |
| Reports | Reports | MANAGE_REPORTS (512) |
| People | Users | MANAGE_USERS (2) |
| People | Roles | MANAGE_ROLES (4) |
| People | Parties/Orgs | MANAGE_USERS (2) |
| System | Settings | MANAGE_SETTINGS (1024) |
| System | Audit | MANAGE_AUDIT (4096) |
| System | Notifications | none (0) — always shown |

Any entry with perm=0 is always rendered. Every new page MUST get a sidebar entry with the matching bit.

---

## Custom Roles (Eshop Admin)

- Created at `/admin/roles/new` — name + description + checkbox per permission bit
- Stored in `roles` table with `party_id = null` (global, reusable across orgs)
- Assigned per-party: `user_party_roles (user_id, party_id, role_id)`
- A user can hold multiple roles in one party — effective permissions = bitwise OR of all
- Deletion: only creator or owner can delete (`r.created_by === userId || isOwner`)
- When inviting eshop_admin in `/admin/parties/[id]`: select system role=2 + select a custom role

---

## Invite Flow

**New user (no existing profile):**
1. Owner/admin fills invite form in `/admin/parties/[id]` → picks email + system role + custom role
2. Server calls `adminClient.auth.admin.inviteUserByEmail` (dev) or `generateLink` (prod)
3. Metadata embedded: `pending_system_role`, `pending_party_id`, `pending_role_id`
4. User clicks email link → `/auth/callback` → detects `isNewUser=true` → `/auth/set-password`
5. User sets name + password → callback writes profile, party role, system role → `/dashboard`

**Existing user:**
1. Same form → server finds existing user by email
2. Updates `profiles.role` immediately + upserts `user_party_roles`
3. Redirects back to party page — no email invite link sent

**Existing admin/owner (magic link / Google OAuth):**
1. Callback detects `isNewUser=false` → redirects directly to `/dashboard`

---

## Checklist — Adding or Changing Any Admin Feature

**Before starting:**
- [ ] Identify the permission bit that gates the feature (use existing bit if it fits)
- [ ] If adding a new bit: update `PERMISSIONS` + `PERMISSION_LABELS` in `shared/constants/permissions.ts`, run `supabase gen types > shared/supabase/types.ts`

**Implementation must include ALL of:**
- [ ] `requireAdminCtx` called at top — redirect to `/dashboard` on `null`
- [ ] No-party check: `if (!ctx.partyId) return Astro.redirect(ctx.isOwner ? "/admin/parties/new" : "/admin/setup")`
- [ ] Permission guard: `if (!hasPermission(permissions, PERMISSIONS.X)) return Astro.redirect("/admin")`
- [ ] All data queries filtered by `ctx.partyId` — never expose cross-party data
- [ ] Role assignment actions use `canAssignRole(myRole, targetRole)` before writing
- [ ] Sidebar entry added in `Sidebar.astro` with the matching permission bit

**Verification gate — check all roles before marking done:**
- [ ] **Owner:** accesses all pages, party switcher shows all orgs, "Closed" status visible, can reopen closed org
- [ ] **Admin:** accesses all pages within assigned parties, other parties invisible, no "Closed" option, status field read-only when party is already closed
- [ ] **Eshop_admin WITH bit:** page loads, data scoped to their party
- [ ] **Eshop_admin WITHOUT bit:** redirected to /admin (or /admin/notifications for dashboard)
- [ ] **Eshop_admin with no party:** redirected to /admin/setup
- [ ] **User:** any /admin/* URL redirects to /dashboard
- [ ] **Sidebar:** shows exactly the entries matching permission bits — no more, no less
- [ ] **Party switcher:** owner=all parties, admin=assigned parties, eshop_admin=their one party
- [ ] **Role assignment form:** `canAssignRole` enforced — eshop_admin cannot assign admin, admin cannot assign owner
- [ ] **Run E2E:** `cd website && pnpm playwright test tests/e2e/15-role-access.spec.ts` — all tests pass
