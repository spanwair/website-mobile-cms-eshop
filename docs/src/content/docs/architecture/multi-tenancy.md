---
title: Multi-Tenant Architecture
description: How organization data isolation works and what eshop developers must know when building integrations.
---

Every organization that uses this CMS is a **tenant** — completely isolated from every other tenant at the database level. This page explains how that isolation is enforced and what you must do (and must never do) when building a custom eshop on top of the API.

## What a tenant is

Each organization is called a **party** and has a unique `party_id` (UUID). Every piece of business data carries that ID as a foreign key:

| Data | Column |
|---|---|
| Products, categories, brands | `party_id` |
| Orders, return requests | `party_id` |
| Customers, addresses | `party_id` |
| Inventory items, stock movements | `party_id` |
| Price lists, discount rules, coupons | `party_id` |
| Roles, audit logs | `party_id` |

Your `party_id` is visible in the admin panel at **[Admin → Organizations](/admin/parties)**.

## Three enforcement layers

### Layer 1 — Row Level Security (database)

Every table has RLS enabled. Three Postgres functions gate access:

- `user_has_permission(auth.uid(), party_id, permission_bit)` — checks whether the caller's role in *that specific party* has the required bit set
- `is_admin_of(party_id)` — checks that the caller is a member of the specific party (not just any party)
- `is_owner()` — returns true for global Owner role (8); owners bypass all party restrictions

These functions fire on every query — even direct API calls — so there is no way to bypass isolation using the `anon` or user JWT key.

### Layer 2 — Cross-party integrity triggers

Database triggers on INSERT and UPDATE raise an exception if records from different parties are mixed. No application code can override this.

| Trigger | What it checks |
|---|---|
| `check_order_item_party` | Order item's product must belong to the order's party |
| `check_inventory_party` | Inventory item's product must belong to the same party as the inventory record |
| `check_stock_movement_party` | Stock movement's inventory item must match the movement's party |
| `check_return_party` | Return request's `party_id` must match its order's `party_id` |
| `check_price_list_item_party` | Price list item's product must belong to the same party as the price list |
| `check_loyalty_party` | Loyalty transaction's customer must belong to the same party |

These catch what RLS cannot: cases where a user has write access to two parties and attempts to create a cross-party link.

### Layer 3 — Application layer

The admin panel enforces party scope at the request level:

- Every admin page calls `requireAdminCtx()`, which reads the `activePartyId` cookie
- That cookie is validated against the user's actually-accessible parties before being accepted
- All service functions receive `partyId` as an explicit argument and pass it as a filter on every query

## Critical rules for eshop integrations

### Never use the `service_role` key

The service role key **bypasses all RLS policies**. If you use it in your eshop frontend or any code that handles untrusted input, every tenant's data is exposed to every other tenant.

```
# WRONG — exposes all tenants' data
Authorization: Bearer <service_role_key>

# CORRECT — RLS scopes data automatically
apikey: <anon_key>
Authorization: Bearer <user_jwt>
```

### Always filter public endpoints by `party_id`

Public product and category endpoints are readable by anyone — **without a party filter, you get all active products from all organizations**.

```
# WRONG — returns products from every org on the platform
GET /rest/v1/products?status=eq.active

# CORRECT — returns only your org's products
GET /rest/v1/products?party_id=eq.YOUR_PARTY_ID&status=eq.active&is_visible=eq.true
```

See [API Overview](/api/overview) for the complete filtering guide.

## What is publicly readable (no auth needed)

These endpoints use only the `anon` key — no user login required. Always add `?party_id=eq.{your_party_id}` to scope to your org.

| Table | Public filter |
|---|---|
| `products` | `status=eq.active` and `is_visible=eq.true` |
| `categories` | `is_visible=eq.true` |
| `product_images` | none (all images for all parties are public — intended for CDN) |
| `product_categories` | none |
| `product_tags` | none |
| `product_variants` | `status=eq.active` |
| `brands` | `status=eq.active` |
| `product_reviews` | `status=eq.approved` |

## What requires authentication

| Data | Requirement |
|---|---|
| Cart, wishlist | User JWT (auto-scoped to the authenticated user by RLS) |
| Orders (customer view) | User JWT |
| Admin operations | User JWT + appropriate permission bit for that party |

## Admin role scope (important caveat)

Global **Admin** role (4) can read and write catalog data (products, categories, brands) for **all parties** — this is intentional for platform administrators who manage multiple organizations. Custom **Eshop Admin** roles are always party-scoped and cannot cross this boundary.

If you run a platform where each org must be completely isolated even from platform admins, assign all managers as Eshop Admins with custom roles rather than global Admins.

## Related

- [API Overview](/api/overview) — how to connect your eshop to the API
- [Role Hierarchy](/users/roles) — Owner, Admin, Eshop Admin and their scopes
- [Permissions System](/users/permissions) — which permission bits control which features
- [Environment Setup](/getting-started/environment) — where to find your project ref, anon key, and party_id
