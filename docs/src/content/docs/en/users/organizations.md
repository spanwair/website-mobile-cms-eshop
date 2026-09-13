---
title: Organizations (Parties)
description: How organizations work and why everything is scoped to them.
---

## What is a "Party"?

In the database, organizations are called **parties**. Every piece of data — products, orders, customers, categories — belongs to exactly one party.

This means:
- **Company A's admin** can only see Company A's products
- **Company B's admin** can only see Company B's data
- Multiple companies can run independently on the same platform

## What belongs to an organization

| Data type | Scoped to party? |
|-----------|-----------------|
| Products | ✅ Yes |
| Categories | ✅ Yes |
| Orders | ✅ Yes |
| Customers | ✅ Yes |
| Inventory | ✅ Yes |
| Discount rules & coupons | ✅ Yes |
| Warehouses | ✅ Yes |
| Roles (custom) | ✅ Yes |
| User accounts (profiles) | ❌ No — users belong to Supabase Auth |
| Party membership | ✅ Via `user_party_roles` table |

## Party fields

When you create an organization, you fill in:

| Field | Required | Description |
|-------|----------|-------------|
| Name | ✅ | Display name (e.g. "My Shop s.r.o.") |
| Slug | ✅ | URL-safe identifier (auto-suggested from name) |
| Company name | | Legal name |
| VAT number | | For invoicing |
| Billing email | | Where invoices go |
| Logo URL | | Brand logo |

## Joining an organization

A user without an organization cannot manage anything — they see a setup page telling them to contact an Owner. An Owner or Admin adds users to the organization via **Admin → Parties → [Organization] → Invite member**.

When you invite someone:
1. Select their account from the dropdown
2. Choose which custom role they get within the party
3. Click **Invite**

They are immediately added and can log in to the admin panel.

## Removing members

On the party detail page, each member row has a **Remove** button (with confirmation). Removing a user from a party means they lose access to that party's data but keep their account.

## The "Super Admin" role

Each party automatically gets a **Super Admin** system role (created by a database trigger when the party is created). This role has all permissions (bitmask `32767`) and cannot be deleted.

The first admin of the party is assigned this role automatically.
