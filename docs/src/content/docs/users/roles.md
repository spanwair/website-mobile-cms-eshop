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
- Can assign roles up to Eshop Admin (2) to others
- Full access to products, orders, customers, inventory within their org
- Cannot create or modify other Admins or Owners

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

> **Important**: You can never assign a role equal to or higher than your own. An Admin (4) cannot create another Admin or an Owner.

## The "You" indicator

In the users table, your own row shows **"You"** (or "Vy" in Czech) instead of a role dropdown — you cannot change your own role.
