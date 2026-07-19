---
title: Organizations
description: How to create and manage organizations (parties), invite members, and control access.
---

An **organization** (called a "party" in the database) is the top-level container for all your business data — products, categories, orders, customers, and inventory. Every piece of data belongs to exactly one organization. This is how the CMS keeps multiple eshops completely separated from each other.

## Permission required

| Action | Permission needed |
|---|---|
| View organization list and details | MANAGE_USERS (2) or MANAGE_AUDIT (4096) |
| Edit organization info | MANAGE_USERS (2) |
| Invite / remove members | MANAGE_USERS (2) |
| Create a new organization | Admin or Owner role |

## Organization list (`/admin/parties`)

The table shows all organizations your account can access:

| Column | Description |
|---|---|
| Name | Organization display name |
| Slug | URL-safe identifier (unique across the entire system) |
| Company name | Legal business name |
| Active | Whether this organization is active |
| Created | When the organization was created |
| View | Opens the organization detail page |

Owners see **all** organizations. Admins see only their assigned organization(s). Eshop Admins see only their own organization(s).

The **New Organization** button is visible to Admins and Owners.

## Creating a new organization (`/admin/parties/new`) — Admin or Owner

Both Admins and Owners can create a new organization. When created:
1. Fill in the organization details (see fields below).
2. Click **Save**.
3. The system **automatically creates a "Super Admin" system role** for the new organization with all permissions. This role cannot be deleted.
4. You are returned to the organization list.

### Organization fields

| Field | Required | Description |
|---|---|---|
| Name | Yes | Display name (e.g. "Acme Store") |
| Slug | Yes | URL-safe unique identifier (e.g. `acme-store`). Cannot be changed after creation. |
| Company name | No | Legal registered business name for invoicing |
| VAT number | No | VAT/tax registration number |
| Billing email | No | Email address for billing notifications |

## Organization detail (`/admin/parties/{id}`)

The detail page has two columns:

### Left column — Organization info + Invite member

**Organization info form** (requires MANAGE_USERS):
- Edit name, company name, VAT number, billing email
- Toggle `is_active` to suspend or reactivate the organization
- Slug is **read-only** after creation

**Invite member section** (requires MANAGE_USERS):
- Enter the member's **email address**
- Select a **role** from the dropdown (populated from your [Custom Roles](/admin/roles))
- Click **Send Invite**

How invitations work:
- **Existing user**: If the email belongs to someone already in the system, they are added to the organization immediately with the selected role.
- **New user**: If the email is not yet registered, a Supabase Auth invitation email is sent. When they click the link and sign up, they are automatically added to your organization with the selected role.

### Right column — Members table

Shows all current members of this organization:

| Column | Description |
|---|---|
| Display name | Member's name |
| Email | Member's email |
| Role | Their current role in this organization |
| Joined | When they were added |
| Remove | Button to remove them from the org |

Click **Remove** to remove a member. This removes their access to this organization's data but does **not** delete their account. They keep access to any other organizations they belong to.

## Multi-tenant isolation

Every organization's data is completely isolated from other organizations:

- **Products, categories, orders, customers, inventory, pricing, and audit logs** all have an `organization_id` that restricts access.
- **Row Level Security (RLS)** policies in the database enforce that queries only return data belonging to the authenticated user's organization.
- **Database triggers** catch cross-organization contamination attempts (e.g. linking a product from Org A to an order from Org B) and raise an error.

This means: even if an admin is a member of multiple organizations, they can only see and edit data belonging to the organization they are currently working in. Switch organizations using the organization switcher.

## What `is_active` means for an organization

| State | Effect |
|---|---|
| Active | Normal operation |
| Inactive | The organization's eshop and admin panel become inaccessible to its members. Data is preserved. |

Use this to suspend an organization temporarily (e.g. payment issue) without deleting data.

## Setup checklist for a new organization

After creating an organization:

1. [Create custom roles](/admin/roles) if you need more granular permissions than Super Admin
2. Invite your team members with appropriate roles (from the detail page)
3. Create [Categories](/admin/categories) for your product catalog
4. Create [Products](/admin/products) and assign them to categories
5. Set up [Inventory](/admin/inventory) for each product

## Related pages

- [Custom Roles](/admin/roles) — roles available in the invite dropdown
- [Users](/admin/users) — change roles of existing members
- [Role Hierarchy](/users/roles) — Owner / Admin / Eshop Admin / User levels
- [Organizations architecture](/users/organizations) — technical details of the party system
