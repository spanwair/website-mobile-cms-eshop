---
title: Role Hierarchy
description: Who can see what and who can do what in the CMS.
---

## The four roles

The CMS uses a **numeric role system** where higher numbers mean more power. Every user has exactly one role.

| Role | Number | Who they are |
|------|--------|-------------|
| **Owner** | 8 | The CMS owner — you. Full access to everything. |
| **Admin** | 4 | Eshop administrator — manages products, orders, team within their org. |
| **Eshop Admin** | 2 | Limited admin — helps with day-to-day tasks, can manage regular users. |
| **User** | 1 | Customer account — cannot access the admin panel at all. |

## What each role can see

### Owner (role = 8)
- Sees **all users** across all organizations
- Can assign any role to any user
- Can access everything in the admin panel
- Can see and manage all parties (organizations)

### Admin (role = 4)
- Sees **everyone in their own organization**, but not Owners (role 8)
- Can assign roles up to **and including Admin (4)** to others — an Admin can promote a peer to Admin
- Full access to products, orders, customers, inventory within their org
- **Can create new organizations** — but can only read, write, or delete data within organizations they are assigned to
- Cannot create or modify Owners

### Eshop Admin (role = 2)
- Sees **only Eshop Admins and Users** (roles 1–2) within their organization
- Can only assign the User (1) role to others
- Access to products, orders, customers, inventory
- Cannot access user management for higher-level users

### User (role = 1)
- **Cannot access the admin panel** at all
- Is redirected to `/dashboard` if they try
- Can use the mobile app and public-facing website

## How roles are enforced

Roles are enforced in two places:

1. **Application layer** — every admin page calls `requireAdminCtx()` which reads the user's role. If the role is too low, the user is redirected.

2. **Database layer** — Supabase Row Level Security (RLS) policies restrict what data each role can read, even if someone tried to call the API directly.

## Changing a user's role

Only **Owners** and **Admins** can change roles, and only for users with a lower role than their own.

1. Go to **Admin → Users**
2. Find the user in the table
3. Select the new role from the dropdown
4. Click **Apply**

> **Important**: You can never assign a role higher than your own. An Admin (4) **can** assign another Admin (peer), but cannot create an Owner. An Eshop Admin (2) can only assign the User (1) role.

## The "You" indicator

In the users table, your own row shows **"You"** instead of a role dropdown — you cannot change your own role.

## Related

- [Permissions System](/users/permissions) — which permission bits each role grants and how bitmasks work
- [Roles (admin page)](/admin/roles) — create and manage custom roles for Eshop Admins
- [Users (admin page)](/admin/users) — assign roles to users
- [Organizations (admin page)](/admin/parties) — invite members with specific roles to your org
