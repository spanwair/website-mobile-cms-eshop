---
title: Users
description: List every user, change their system role, and assign them to organizations
---

The Users page lists everyone who has ever signed in, and is where you change a person's system role and attach them to organizations (parties).
It works hand in hand with [Roles](/docs/en/admin/roles) (the custom permission sets) and [Organizations](/docs/en/admin/parties) (where per-org membership is actually managed for a single org).

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 2 | MANAGE_USERS | Owner, Admin, Eshop Admin (with this bit) |

Without `MANAGE_USERS` you are redirected to `/admin`.
The same bit also gates [Organizations](/docs/en/admin/parties).

## User list (`/admin/users`)

The page loads users through `fetchUsersForAdmin(supabase, myRole, ctx.partyId)`, so what you see is already scoped to your privilege level.
An owner sees every user in the system; an admin or eshop admin sees the users relevant to their organizations.
A total count is shown top-left, e.g. `24 users`.

### Client-side filter bar

The filters run entirely in the browser (no page reload) against `data-*` attributes on each row.

| Filter | Matches |
|---|---|
| Name | Substring match on the display name. |
| Email | Substring match on the email. |
| Role | Exact match on the system role; the dropdown lists only roles you are allowed to assign. |
| Organization | Exact match on an org name; the dropdown is auto-populated from the orgs actually present in the table. |

### Columns

| Column | Description |
|---|---|
| Name | Display name, bold. Falls back to a localized "unnamed" when the profile has no name yet. |
| Email | The account email, muted. |
| Role | Color-coded badge: owner `badge-error` (red), admin `badge-pending` (amber), eshop_admin `badge-draft`, user `badge-inactive`. |
| Organizations | Comma-separated org names the user belongs to, or a localized "no orgs" label. |
| Joined | `profiles.created_at`, formatted in the current language. |
| Change role | The inline role-assignment form (see below), or the text "You" on your own row. |

## Changing a user's role

Each editable row carries a small POST form. Whether it appears at all, and which target roles it offers, is decided by two guard functions in the page.

### Who you can edit (`canChangeUser`)

- You can never edit your own row (self-role change is blocked; the row shows "You").
- Nobody can edit an owner (`role >= OWNER` is off limits to everyone through this page).
- To edit an existing admin: you must be an owner, or be the admin who originally assigned them (`profiles.admin_assigned_by === your id`).
  This stops one admin from overriding another admin's people.
- Otherwise you can edit as long as you have at least one assignable role.

### Which target roles are offered (`rolesForUser` + `assignableRoles`)

The dropdown is built from `assignableRoles(myRole)`, which enforces `canAssignRole` - you can never grant a role at or above your own.
A peer admin (not an owner) editing another admin is further limited to roles below admin, so they can only demote, never re-promote.
An owner is exempt from that narrowing and can assign any role, including admin and owner, to anyone.

### Party selection that appears with the role

A small client script shows or hides extra inputs based on the chosen role:

- **Eshop admin (2)** reveals a single **organization** dropdown plus a **custom role** dropdown (the global roles from [Roles](/docs/en/admin/roles)).
  The chosen custom role is upserted into `user_party_roles` for that one org.
- **Admin (4)** reveals a multi-select of organizations (a custom chip-style dropdown).
  Each selected org gets the highest-permission global role upserted into `user_party_roles`.
- **User (1)** shows no party inputs.

### What the save writes (POST handler)

1. Validates the role is a real `ROLE` value (`errorInvalidRole` otherwise) and passes `canAssignRole` (`errorRoleTooHigh` otherwise).
2. Clears the user's existing `user_party_roles` rows for the actor's own party ids, so stale memberships do not linger.
3. Updates `profiles.role` to the new system role.
4. Re-inserts `user_party_roles` for the selected, validated org ids (single org for eshop_admin, multiple for admin).
5. Redirects back to `/admin/users`.

Only party ids the actor actually controls (`ctx.parties`) are ever written, so an admin cannot slip a user into an org they do not manage.

## Data & storage (cloud)

- **Tables:** `profiles` (`role`, `display_name`, `email`, `admin_assigned_by`, `created_at`), `user_party_roles` (`user_id`, `party_id`, `role_id`), `roles` (global custom roles, `party_id = null`).
- **Services:** `fetchUsersForAdmin`, `fetchUserParties` (`profileService`); `fetchRoles` (`permissionsService`).
- **Constants:** `ROLE`, `ROLE_LABEL`, `assignableRoles`, `canAssignRole` from `shared/constants/permissions.ts` - the single source of truth for role numbers and labels.

## Related pages

- [Roles](/docs/en/admin/roles) - define the custom permission sets that eshop admins are assigned here
- [Organizations](/docs/en/admin/parties) - manage membership and invites for a single org, including the invite-by-email flow for brand-new users
- [Setup](/docs/en/admin/setup) - where an eshop admin with no org yet is sent
