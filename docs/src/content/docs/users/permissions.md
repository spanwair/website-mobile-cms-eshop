---
title: Permissions System
description: How permission bits work and which permissions control which admin pages.
---

The CMS uses a **bitmask permission system**. Every permission is a power-of-2 integer. A user's effective permissions are stored as a single number — the sum (bitwise OR) of all the permissions they hold.

## How bitmasks work

Each permission is a unique bit:

```
MANAGE_PRODUCTS   = 8    (binary: 0000 0000 0000 1000)
MANAGE_CATEGORIES = 16   (binary: 0000 0000 0001 0000)
```

To grant both, you store `8 | 16 = 24`. To check if a user has `MANAGE_PRODUCTS`, the system evaluates `userBitmask & 8 !== 0`. This means permissions compose freely — you can grant any combination without conflicts.

## All permissions

| Permission | Bit | What it controls | Admin pages |
|---|---|---|---|
| `VIEW_DASHBOARD` | 1 | Access to the admin panel at all | `/admin` |
| `MANAGE_USERS` | 2 | View and change user roles; manage organization members | `/admin/users`, `/admin/parties` |
| `MANAGE_ROLES` | 4 | Create and delete custom roles; assign permissions | `/admin/roles` |
| `MANAGE_PRODUCTS` | 8 | Create, edit, delete products; upload images/videos; moderate reviews | `/admin/products`, `/admin/reviews` |
| `MANAGE_CATEGORIES` | 16 | Create, edit, delete product categories (including hierarchy) | `/admin/categories` |
| `MANAGE_ORDERS` | 32 | View orders, update order status, manage returns and RMAs | `/admin/orders`, `/admin/returns` |
| `MANAGE_INVENTORY` | 64 | Adjust stock levels, record stock movements | `/admin/inventory` |
| `MANAGE_PRICING` | 128 | Manage price lists, discount rules, and coupons | `/admin/pricing` |
| `MANAGE_CUSTOMERS` | 256 | View and edit customer records and addresses | `/admin/customers` |
| `MANAGE_REPORTS` | 512 | View business reports (revenue, orders, products) | `/admin/reports` |
| `MANAGE_AUDIT` | 4096 | View the audit log; edit organization details | `/admin/audit`, `/admin/parties/{id}` |

`ALL_PERMISSIONS = 65535` (`0xffff`) grants every current and future permission bit.

## Checking permissions in code

```typescript
import { hasPermission, PERMISSIONS } from "@shared/constants/permissions";

if (hasPermission(userPermissions, PERMISSIONS.MANAGE_PRODUCTS)) {
  // show product management UI
}
```

## Default permissions by role

| Role | Value | Default permissions |
|---|---|---|
| **Owner** | 8 | `ALL_PERMISSIONS` (65535) + bypasses all party restrictions |
| **Admin** | 4 | `ALL_PERMISSIONS` (65535), party-scoped for catalog mutations |
| **Eshop Admin** | 2 | Determined by their **custom role** in the specific party — no global default |
| **User** | 1 | `VIEW_DASHBOARD` (1) only — redirected if they reach an admin page |

> **Note for Eshop Admins:** Their permissions are not global. They inherit the bitmask of the custom role they were assigned when invited to an organization. An eshop admin in Party A can have completely different permissions than the same user in Party B.

## The Super Admin system role

Every organization automatically gets a **Super Admin** system role with `ALL_PERMISSIONS` (65535). It cannot be edited or deleted. Assign it to a trusted org member to give them full control within that organization.

## Sidebar visibility

The admin sidebar automatically shows or hides sections based on the user's live permissions. If `MANAGE_PRODUCTS` is not in your bitmask, the Products link is hidden — not just greyed out, but absent entirely.

## Creating custom permission sets

Custom roles let you define exactly which permissions an Eshop Admin receives:

1. Go to **[Admin → Roles](/admin/roles)**
2. Click **New Role**
3. Give it a name (e.g. "Order Manager") and an optional description
4. Tick the permissions this role should have
5. Save — the role is now selectable when inviting members at **[Admin → Organizations](/admin/parties)**

**Example:** an "Order Fulfiller" role with only `MANAGE_ORDERS` (32) + `MANAGE_INVENTORY` (64) stores bitmask `96`. That user can process orders and adjust stock but cannot touch products, pricing, or customers.

## Related

- [Role Hierarchy](/users/roles) — how Owner, Admin, Eshop Admin and User relate to each other
- [Roles (admin page)](/admin/roles) — create and manage custom roles
- [Users (admin page)](/admin/users) — assign roles to users in your organization
