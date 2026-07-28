# Skill: Admin Permissions (auto-injected — you did not choose to load this, the harness detected a permission-sensitive task)

Single source of truth: `shared/constants/permissions.ts`. Never define role numbers, permission bit values, or label strings anywhere else — import from there.

## Role hierarchy (higher number = more privilege)

| Role | Value | Access |
|------|-------|--------|
| USER | 1 | No admin panel — redirected to /dashboard |
| ESHOP_ADMIN | 2 | One org, access gated by custom role permission bits |
| ADMIN | 4 | Assigned orgs, ALL_PERMISSIONS per party |
| OWNER | 8 | Global — all orgs, all perms, no party restriction |

`canAssignRole(myRole, targetRole)` enforces this — never bypass it.

## Permission bits (bitmask, combine with `|`, check with `hasPermission`)

```
VIEW_DASHBOARD=1  MANAGE_USERS=2  MANAGE_ROLES=4  MANAGE_PRODUCTS=8
MANAGE_CATEGORIES=16  MANAGE_ORDERS=32  MANAGE_INVENTORY=64  MANAGE_PRICING=128
MANAGE_CUSTOMERS=256  MANAGE_REPORTS=512  MANAGE_SETTINGS=1024  MANAGE_CMS=2048
MANAGE_AUDIT=4096
```
`/admin/notifications` requires none (perm=0) — always visible.

## Critical invariant

`isGlobal === isOwner`. Never set `isGlobal = true` for any non-owner role — this breaks party scoping entirely.

## Runtime flow

1. Page calls `requireAdminCtx(client, userId, activePartyId)` in `website/src/lib/admin.ts`.
2. `role < ESHOP_ADMIN` → `null` → page redirects to `/dashboard`.
3. `role >= ADMIN` → `permissions = ALL_PERMISSIONS`, no DB lookup.
4. `role == ESHOP_ADMIN` → `get_user_permissions(userId, partyId)` DB RPC → bitwise OR of all custom roles held in that party.
5. Every page guard: `hasPermission(ctx.permissions, PERMISSIONS.X)`.
6. Sidebar: same `hasPermission` check per entry; perm=0 entries always shown.

## What eshop_admin can NEVER do, regardless of permission bits

- See/access another party's data.
- Navigate to `/admin/parties/[id]` for a party they don't belong to.
- Assign admin or owner roles.
- Set party status to `closed`.
- Create organizations.

## Checklist for any admin feature you add or change

- `requireAdminCtx` called at top — redirect to `/dashboard` on `null`.
- No-party check: `if (!ctx.partyId) return Astro.redirect(ctx.isOwner ? "/admin/parties/new" : "/admin/setup")`.
- Permission guard: `if (!hasPermission(permissions, PERMISSIONS.X)) return Astro.redirect("/admin")`.
- All data queries filtered by `ctx.partyId`.
- Role assignment actions use `canAssignRole(myRole, targetRole)` before writing.
- Sidebar entry added with the matching permission bit.

Full authoritative reference (more detail, invite-flow specifics): `.claude/skills/admin-permission/SKILL.md` in the repo — read it directly if anything here is ambiguous.
