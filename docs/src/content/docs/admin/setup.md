---
title: First-Time Setup
description: What to do when you first log in as an admin and see the setup page.
---

When you log in as an admin for the first time and have not yet been assigned to an organization, you land on `/admin/setup`. This page guides you through what to do next.

## What this page means

The setup page appears when:
- You have an admin role but have not been added to any organization (party) yet
- Your organization assignment is pending

It does **not** mean something is broken — it just means your account isn't connected to an organization yet.

## What to do if you're stuck here

**If you are an Eshop Admin or regular Admin:**
1. Contact your Owner (the person who set up the CMS)
2. Ask them to add you to your organization via [Organizations → your org → Invite Member](/admin/parties)
3. Once they add you, refresh the page — you will be redirected to the [Dashboard](/admin/dashboard) automatically

**If you are an Owner:**
You are automatically redirected to [Create Organization](/admin/parties/new) to set up your first organization. Owners must create at least one organization before the CMS is usable.

## Owner: creating your first organization

1. You will be redirected to `/admin/parties/new` automatically.
2. Fill in your organization details:
   - **Name** (required) — your organization's display name
   - **Slug** (required) — URL-safe identifier
   - **Company name** — legal business name
   - **VAT number** — for invoicing
   - **Billing email** — where billing notifications go
3. Click **Save**. The system automatically creates a **Super Admin** role for your organization.
4. You are now in the [Organizations](/admin/parties) list. Click your new organization to invite team members.

## After setup

Once you're assigned to an organization:
1. The setup page redirects you to the [Dashboard](/admin/dashboard)
2. The sidebar shows all sections you have permission to access
3. Start by setting up [Categories](/admin/categories), then [Products](/admin/products)

## Related pages

- [Organizations](/admin/parties) — owners can add members to an org here
- [Dashboard](/admin/dashboard) — where you land after successful setup
- [Roles](/users/roles) — understanding the role hierarchy
