# CLAUDE.md — website-mobile-template

## Project

Full-stack template: React Native mobile app (Android APK) + Astro website + Supabase backend.

## Folder structure

| Folder       | Purpose |
|-------------|---------|
| `shared/`   | Code that runs on both mobile and website. Zero duplication. |
| `mobile/`   | React Native / Expo app — Android APK + iOS |
| `website/`  | Astro SSR website |
| `supabase/` | DB migrations + Edge Functions |
| `scripts/`  | DB push, function deploy, build scripts |

## Rules (non-negotiable)

1. **Never duplicate logic** — if it works in both, it belongs in `shared/`.
2. **Max 200 lines per file** — split by component, route, service, or util.
3. **No comments** unless the WHY is non-obvious.
4. **No fallback mechanisms** — they hide failures.
5. **Credentials only in** `.env.development`, `.env.production`, `.envrc` — never hardcode.
6. **All DB changes** go through `supabase/migrations/`, never the Supabase dashboard.

## Tech stack

- Mobile: **React Native 0.83 / Expo 55** — package manager **pnpm**
- Website: **Astro 5** (SSR mode) — pnpm
- Database: **Supabase (PostgreSQL)** — two projects: dev + prod
- Auth: magic link + Google OAuth (via Supabase Auth)
- Types: TypeScript strict mode
- Tests: Jest (mobile), Playwright (website E2E)

## Key commands

```bash
# Mobile
cd mobile && pnpm start          # Start Expo dev server
cd mobile && pnpm android        # Run on Android emulator/device
cd mobile && pnpm build:android:dev   # Build dev APK (local)
cd mobile && pnpm test           # Run Jest tests
cd mobile && pnpm typecheck      # TypeScript check
cd mobile && pnpm lint           # ESLint

# Website
cd website && pnpm dev           # Start Astro dev server (port 4321)
cd website && pnpm build         # Production build
cd website && pnpm typecheck     # TypeScript check

# Supabase
./scripts/db-push.sh development        # Push migrations to dev
./scripts/db-push.sh production         # Push migrations to prod (main branch only)
./scripts/functions-deploy.sh development  # Deploy Edge Functions to dev
supabase gen types > shared/supabase/types.ts  # Regenerate DB types after schema changes
```

## Environment files

Copy examples and fill in your keys:
```bash
cp .env.development.example .env.development
cp .env.production.example .env.production
cp .envrc.example .envrc && direnv allow
```

## Supabase

Two Supabase projects — **never mix them**:

| Environment | Project ref |
|------------|-------------|
| development | `YOUR_DEV_PROJECT_REF` |
| production  | `YOUR_PROD_PROJECT_REF` |

After any schema change: `supabase gen types > shared/supabase/types.ts`

## Agent team

| Agent | File | Purpose |
|-------|------|---------|
| Project Leader | `agents/project-leader.md` | Scope tasks, coordinate agents, run first |
| Architect | `agents/architect.md` | Cross-cutting decisions, shared/ placement |
| Copier | `agents/copier.md` | Migrate/copy code from source projects |
| Mobile Specialist | `agents/mobile-specialist.md` | `mobile/` changes |
| Website Specialist | `agents/website-specialist.md` | `website/` changes |
| Supabase Specialist | `agents/supabase-specialist.md` | DB migrations, RLS, Edge Functions |
| Tester | `agents/tester.md` | Jest unit tests + E2E verification |
| Code Reviewer | `agents/code-reviewer.md` | Final review gate |
| Disclaimer | `agents/disclaimer.md` | Legal/copyright/license checks |

## Session state

Maintain state in `_project_specs/session/`:
- `current-state.md` — live session state
- `decisions.md` — append-only architectural decisions

## Todos

Track work in `_project_specs/todos/`:
- `active.md` — current sprint
- `backlog.md` — future
- `completed.md` — done

---

## Skill: admin-permissions — AUTO-TRIGGER

TRIGGER — invoke the `admin-permissions` skill BEFORE making any changes whenever:
- Any file under `website/src/pages/admin/` is opened or modified
- `website/src/components/cms/Sidebar.astro` is touched
- `website/src/lib/admin.ts` is touched
- `shared/constants/permissions.ts` is touched
- The task involves roles, permissions, access control, `canAssignRole`, `requireAdminCtx`, `hasPermission`, or the invite flow

Do NOT skip because a change looks small. Load the skill first, then proceed.

---

## Roles & Permissions System

Single source of truth: `shared/constants/permissions.ts`. Never define role numbers, permission bit values, or label strings anywhere else — import from there.

### Role hierarchy

| Role | Value | Label | Access summary |
|------|-------|-------|----------------|
| USER | 1 | user | No admin panel — redirected to /dashboard |
| ESHOP_ADMIN | 2 | eshop_admin | One org, access gated by custom role permission bits |
| ADMIN | 4 | admin | Assigned orgs, ALL_PERMISSIONS per party |
| OWNER | 8 | owner | Global — all orgs, all perms, no party restriction |

Higher number = more privilege. `canAssignRole(myRole, targetRole)` enforces this — never bypass it.

### Permission bits (bitmask, combine with `|`, check with `hasPermission`)

| Bit | Constant | Gates these admin pages |
|-----|----------|------------------------|
| 1 | VIEW_DASHBOARD | /admin (dashboard KPIs, charts, recent orders) |
| 2 | MANAGE_USERS | /admin/users, /admin/parties (list + detail) |
| 4 | MANAGE_ROLES | /admin/roles, /admin/roles/new |
| 8 | MANAGE_PRODUCTS | /admin/products, /admin/reviews |
| 16 | MANAGE_CATEGORIES | /admin/categories |
| 32 | MANAGE_ORDERS | /admin/orders, /admin/returns, revenue KPI |
| 64 | MANAGE_INVENTORY | /admin/inventory |
| 128 | MANAGE_PRICING | /admin/pricing |
| 256 | MANAGE_CUSTOMERS | /admin/customers |
| 512 | MANAGE_REPORTS | /admin/reports, revenue KPI |
| 4096 | MANAGE_AUDIT | /admin/audit + editing party settings in /admin/parties/[id] |
| 0 | (none) | /admin/notifications — always visible to any admin |

---

### OWNER (role=8) — sees and does everything

- `isOwner = true`, `isGlobal = true` — these are always set together
- Receives `ALL_PERMISSIONS = 0xffff` without any DB lookup
- Party switcher shows ALL parties in the system
- Can create new organizations (`/admin/parties/new` — New button visible)
- Only role that can set a party's status to `closed`
- Can assign any role, including owner, to anyone
- Cannot change their own role (blocked in /admin/users: `u.id === session.user.id`)
- `/admin` dashboard: all KPI groups visible (users, products, orders, revenue, audit)

**All admin pages are accessible.** No permission check can block an owner.

---

### ADMIN (role=4) — full control within assigned orgs

- `isOwner = false`, `isGlobal = false`
- Receives `ALL_PERMISSIONS = 0xffff` but scoped to parties they're assigned to
- Party switcher shows only parties the admin is assigned to
- Can create new organizations (New button visible: `ctx.role >= ROLE.ADMIN`)
- Cannot set party status to `closed`
- Cannot change the status of a party that is already `closed` — server rejects the update (`errorClosedOrg`), UI replaces the select with a read-only label (`statusClosedReadonly`)
- Can assign roles up to and including admin, but only if they originally assigned that admin (`admin_assigned_by` check) OR if they are owner. An admin cannot override another admin's user.
- Can invite as eshop_admin or admin. When inviting as admin: no party role needed (full perms via system role). When inviting as eshop_admin: must pick party + custom role.

**All admin pages accessible** within their parties. Scoping is enforced at data layer (party filter in queries), not at the page gate.

**Decisions required when scoping admin:**
- Adding a party to an admin: write to `user_party_roles`, not `profiles.role`
- Removing an admin's party access: delete from `user_party_roles` for that party

---

### ESHOP_ADMIN (role=2) — one org, permission-gated

- Assigned to exactly ONE party
- `permissions` resolved via `get_user_permissions(userId, partyId)` DB function — returns bitwise OR of all custom roles held in that party
- Custom roles are global (`roles.party_id = null`), assigned per-party in `user_party_roles`
- If no party assigned yet: redirected to `/admin/setup`
- Party switcher: shows only their single party

**Page access — every page below requires the matching bit:**

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

**What eshop_admin can NEVER do, regardless of permission bits:**
- See or access another party's data (DB-level RLS + `ctx.parties` scoping)
- Navigate to `/admin/parties/[id]` for a party they don't belong to
- Assign admin or owner roles
- Set party status to `closed`
- Create organizations

**Party detail page (`/admin/parties/[id]`):**
- Member management (invite/remove): requires `MANAGE_USERS (2)`
- Edit party settings (name, company, VAT, billing email, status): requires `MANAGE_AUDIT (4096)`
- Eshop_admin sees the invite form but can only invite as eshop_admin (canAssignRole enforced)

---

### USER (role=1) — no admin access

- `requireAdminCtx` returns `null` → every `/admin/*` page redirects to `/dashboard`
- No exceptions, no fallbacks
- Future purpose: customer assignment only — do not add admin capabilities without a full scope decision

---

### How permissions are resolved (runtime flow)

1. Page calls `requireAdminCtx(client, userId, activePartyId)` — `website/src/lib/admin.ts`
2. Reads `profiles.role` from DB
3. `role < ESHOP_ADMIN` → return `null` → page does `Astro.redirect("/dashboard")`
4. `role >= ADMIN` → `permissions = ALL_PERMISSIONS`, skip DB lookup
5. `role == ESHOP_ADMIN` → calls `get_user_permissions(userId, partyId)` DB RPC
6. DB function returns bitwise OR of all roles held by the user in that party
7. Every page guard: `hasPermission(ctx.permissions, PERMISSIONS.X)`
8. Sidebar: same `hasPermission` check per entry, perm=0 entries always shown

**Critical invariant:** `isGlobal = isOwner`. Never set `isGlobal = true` for any non-owner role. Violating this breaks party scoping entirely.

---

### Sidebar — permission-to-entry mapping

Sidebar groups (defined in `website/src/components/cms/Sidebar.astro`):

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
| Reports | Reports | MANAGE_REPORTS (512) |
| People | Users | MANAGE_USERS (2) |
| People | Roles | MANAGE_ROLES (4) |
| People | Parties/Orgs | MANAGE_USERS (2) |
| System | Audit | MANAGE_AUDIT (4096) |
| System | Notifications | none (0) |

Any entry with perm=0 in the items array is always rendered. Every new page MUST get a sidebar entry with the matching bit.

---

### Custom roles (Eshop Admin)

- Created at `/admin/roles/new` — name + description + checkbox per permission bit
- Stored in `roles` table with `party_id = null` (global, reusable across orgs)
- Assigned per-party: `user_party_roles (user_id, party_id, role_id)`
- A user can hold multiple roles in one party — effective permissions = bitwise OR of all
- Deletion: only the creator or owner can delete a role (`r.created_by === userId || isOwner`)
- When inviting eshop_admin in `/admin/parties/[id]`: select system role = 2 + select a custom role

---

### Checklist — adding or changing any admin feature

**Before starting:**
- [ ] Identify the permission bit that should gate the new feature (use existing bit if it fits)
- [ ] If adding a new bit: update `PERMISSIONS` + `PERMISSION_LABELS` in `shared/constants/permissions.ts`, run `supabase gen types > shared/supabase/types.ts`

**Implementation must include all of:**
- [ ] `requireAdminCtx` called at top — redirect to `/dashboard` on `null`
- [ ] No-party check: `if (!ctx.partyId) return Astro.redirect(ctx.isOwner ? "/admin/parties/new" : "/admin/setup")`
- [ ] Permission guard: `if (!hasPermission(permissions, PERMISSIONS.X)) return Astro.redirect("/admin")`
- [ ] All data queries filtered by `ctx.partyId` — never expose cross-party data
- [ ] Role assignment actions use `canAssignRole(myRole, targetRole)` before writing
- [ ] Sidebar entry added in `Sidebar.astro` with the matching permission bit

**Disclaimer gate — verify before marking any role/permission task done:**
- [ ] **Owner:** can access all pages, party switcher shows all orgs, "Closed" status option visible, can reopen a closed org
- [ ] **Admin:** can access all pages within assigned parties, other parties not visible, no "Closed" option, status field is read-only (locked label) when party is already closed
- [ ] **Eshop_admin WITH the permission bit:** page loads, data scoped to their party
- [ ] **Eshop_admin WITHOUT the permission bit:** redirected to /admin (or /admin/notifications for dashboard)
- [ ] **Eshop_admin with no party:** redirected to /admin/setup
- [ ] **User:** any /admin/* URL redirects to /dashboard
- [ ] **Sidebar:** shows exactly the entries matching the user's permission bits — no more, no less
- [ ] **Party switcher:** owner=all parties, admin=assigned parties, eshop_admin=their one party
- [ ] **Role assignment form:** canAssignRole enforced — eshop_admin cannot assign admin, admin cannot assign owner
- [ ] **Run E2E:** `cd website && pnpm playwright test` — all 17-xx tests must pass

**When changing role assignment logic specifically:**
- [ ] Verify `admin_assigned_by` is set when assigning admin role (used for peer-admin edit protection)
- [ ] Verify `user_party_roles` entries are cleared for actorPartyIds before re-assignment
- [ ] Verify `profiles.role` is updated atomically with the party role upsert

---

### Invite flow summary

**New user (no existing profile):**
1. Owner/admin fills invite form in `/admin/parties/[id]` → picks email + system role + custom role
2. Server calls `adminClient.auth.admin.inviteUserByEmail` (dev) or `generateLink` (prod)
3. Metadata embedded: `pending_system_role`, `pending_party_id`, `pending_role_id`
4. User clicks email link → `/auth/callback` → detects `isNewUser=true` → redirects to `/auth/set-password`
5. User sets name + password → callback writes profile, party role, system role → `/dashboard`

**Existing user:**
1. Same form → server finds existing user by email
2. Updates `profiles.role` immediately + upserts `user_party_roles`
3. Redirects back to party page — no email invite link sent
4. User logs in normally → admin panel visible

**Existing admin/owner (magic link / Google OAuth):**
1. Callback detects `isNewUser=false` → redirects directly to `/dashboard`
2. Never touches `/auth/set-password`
