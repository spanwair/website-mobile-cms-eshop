---
title: Permissions System
description: How fine-grained permissions work on top of roles.
---

## Two layers of access control

Access is controlled at **two levels**:

1. **Role** (on the user's profile) — determines whether they can access the admin panel at all, and which other users they can manage
2. **Permissions** (bitmask on the party role) — determines which sections of the admin they can use

## Permissions bitmask

Permissions are stored as a single integer using bitwise flags. Each feature gets a bit:

| Permission | Bit value | What it allows |
|-----------|-----------|---------------|
| VIEW_DASHBOARD | 1 | See the admin dashboard |
| MANAGE_USERS | 2 | View and change user roles |
| MANAGE_ROLES | 4 | Create and delete custom roles |
| MANAGE_PRODUCTS | 8 | Create, edit, delete products |
| MANAGE_CATEGORIES | 16 | Create, edit, delete categories |
| MANAGE_ORDERS | 32 | View and update orders |
| MANAGE_INVENTORY | 64 | Adjust stock levels |
| MANAGE_PRICING | 128 | Create discount rules and coupons |
| MANAGE_CUSTOMERS | 256 | View and edit customers |
| VIEW_REPORTS | 512 | Access analytics and reports |
| MANAGE_CMS | 1024 | Manage CMS content |
| MANAGE_FILES | 2048 | Upload and manage files |
| MANAGE_SETTINGS | 4096 | Change shop settings |
| BILLING | 8192 | Access billing information |
| API_MANAGEMENT | 16384 | Manage API keys |
| FULL_ACCESS | 32768 | All permissions combined |

## Checking permissions in code

```typescript
import { hasPermission, PERMISSIONS } from "@shared/constants/permissions";

if (hasPermission(userPermissions, PERMISSIONS.MANAGE_PRODUCTS)) {
  // show the product management UI
}
```

## Custom roles

Owners and Admins can create custom roles for their organization via **Admin → Roles → New Role**. Each custom role gets a set of permission checkboxes.

For example, a "Warehouse Manager" role might only have `MANAGE_INVENTORY` checked — they can adjust stock but cannot touch products or pricing.

## The Super Admin role

Every organization automatically has a **Super Admin** system role with all permissions (`32767`). This is a system role — it cannot be edited or deleted.

## How roles and permissions interact

- An Owner (role 8) always has **full permissions**, regardless of party role
- An Admin (role 4) gets full permissions within their party by default
- An Eshop Admin (role 2) gets the permissions defined by their party role assignment
- A User (role 1) cannot access the admin panel at all

## Sidebar visibility

The admin sidebar automatically shows or hides sections based on the user's permissions. If you don't have `MANAGE_PRODUCTS`, you won't see the Products link in the sidebar.
