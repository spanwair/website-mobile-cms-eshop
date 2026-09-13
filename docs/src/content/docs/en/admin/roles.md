---
title: Roles
description: Create and manage custom permission sets that eshop admins are assigned per organization
---

Roles are reusable, named bundles of permission bits.
They exist so an eshop admin can be granted exactly the slice of the admin panel they need - for example "Warehouse" (inventory only) or "Content editor" (CMS only) - without ever touching the fixed system roles.
Custom roles are assigned to people per organization on the [Users](/docs/en/admin/users) page and inside [Organizations](/docs/en/admin/parties).

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 4 | MANAGE_ROLES | Owner, Admin, Eshop Admin (with this bit) |

Without `MANAGE_ROLES` you are redirected to `/admin`.
An eshop admin with no organization is sent to `/admin/setup`; an owner with no org is sent to `/admin/parties/new`.

## Role list (`/admin/roles`)

Roles are global (`roles.party_id = null`), so the same role can be reused across every organization on the platform.
The list is fetched with `fetchRoles` and shows a count top-left plus a **New** button top-right.

### Filter bar (client-side)

- **Search** - substring match on role name and description.
- **My roles only** - checkbox that hides every role you did not create (`roles.created_by === your id`).

### Columns

| Column | Description |
|---|---|
| Name | Role name, bold, with a badge: "System" (`is_system = true`, built-in and not deletable) or "Custom". |
| Description | Free text, or a dash when empty. |
| Permissions | One chip per active permission bit, labeled from the shared constants; "no permissions" when the mask is `0`. |
| Actions | A **Delete** button, shown only when you are the owner or the role's creator. |

### Deleting a role

Deletion posts back to the same page and calls `deleteRole`.
It is guarded in the UI: the button only renders when `isOwner || r.created_by === userId`.
A JavaScript `confirm()` dialog protects against accidental clicks.

## Creating a role (`/admin/roles/new`)

### How to

1. Click **New** on the role list.
2. Enter a **Name** (required) and an optional **Description**.
3. Tick the permission checkboxes you want the role to grant.
4. Click **Create**.
   You return to the role list, where the new role is immediately assignable.

### Fields

| Field | Column | Notes |
|---|---|---|
| Name | `roles.name` | Required, shown in the assignment dropdowns. |
| Description | `roles.description` | Optional helper text. |
| Permissions | `roles.permissions` (bitmask) | A two-column grid of checkboxes; each checkbox value is the bit from `PERMISSIONS`. |

The permission checkboxes offered are:
VIEW_DASHBOARD, MANAGE_USERS, MANAGE_ROLES, MANAGE_PRODUCTS, MANAGE_CATEGORIES, MANAGE_ORDERS, MANAGE_INVENTORY, MANAGE_PRICING, MANAGE_CUSTOMERS, MANAGE_REPORTS, MANAGE_AUDIT.
On submit the server OR-combines every ticked value into a single integer stored in `roles.permissions`; the numbers themselves come only from `shared/constants/permissions.ts`, never hardcoded.

## How custom roles become effective permissions

A user can hold several custom roles in one organization.
Their effective permissions in that org are the bitwise OR of every role they hold there, resolved at runtime by the `get_user_permissions(userId, partyId)` database function.
This is only used for eshop admins; admins and owners always receive `ALL_PERMISSIONS` without a lookup.

## Data & storage (cloud)

- **Tables:** `roles` (`id`, `name`, `description`, `permissions`, `party_id` (always null for custom roles), `is_system`, `created_by`), `user_party_roles` (assigns a role to a user in a party).
- **Services:** `fetchRoles`, `createRole`, `deleteRole` (`permissionsService`); `get_user_permissions` RPC for runtime resolution.
- **Constants:** `PERMISSIONS`, `hasPermission` from `shared/constants/permissions.ts`.

## Related pages

- [Users](/docs/en/admin/users) - assign a custom role to a person for one organization
- [Organizations](/docs/en/admin/parties) - the per-org invite form also picks a system role plus a custom role
- [Permissions System](/docs/en/users/permissions) - the full bit-by-bit reference
