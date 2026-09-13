---
title: Database Schema
description: The tables, relationships, and how data is organized.
---

## Overview

The database is PostgreSQL hosted on Supabase. Everything runs through Supabase's API — no direct DB connections from the app.

## Core tables

### profiles
Extends Supabase Auth's `auth.users`. Created automatically when a user signs up.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Same as auth.users.id |
| email | text | User's email |
| display_name | text | Shown in the UI |
| role | int | 1=User, 2=EshopAdmin, 4=Admin, 8=Owner |
| avatar_url | text | Profile picture URL |
| lang | text | Preferred language (cs/en) |

### parties
Organizations. All e-commerce data belongs to a party.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | text | Display name |
| slug | text | URL-safe identifier (unique) |
| company_name | text | Legal name |
| vat_number | text | For invoicing |
| billing_email | text | Invoice destination |
| is_active | boolean | Whether this org is active |

### user_party_roles
Junction table linking users to parties with a role.

| Column | Type | Description |
|--------|------|-------------|
| user_id | UUID | FK → profiles.id |
| party_id | UUID | FK → parties.id |
| role_id | UUID | FK → roles.id |

### products
The product catalog.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| party_id | UUID | Which org owns this |
| title | text | Product name |
| slug | text | URL identifier (unique per party) |
| price | numeric(12,2) | Regular price |
| discount_price | numeric(12,2) | Sale price (optional) |
| status | text | draft / active / inactive |
| is_featured | boolean | Show in featured sections |

### product_categories
Junction table — many-to-many between products and categories.

| Column | Type |
|--------|------|
| product_id | UUID → products.id |
| category_id | UUID → categories.id |

### product_images
Images uploaded for a product.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| product_id | UUID | FK → products.id |
| url | text | Full public URL in Supabase Storage |
| alt | text | Alt text for accessibility |
| is_primary | boolean | Main image (shown in listings) |
| sort_order | int | Display order |

### categories
Product categories in a tree structure.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| party_id | UUID | Owner org |
| parent_id | UUID | Parent category (null = root) |
| name | text | Display name |
| slug | text | URL identifier (unique per party) |
| is_visible | boolean | Show to customers |

### orders
Customer orders.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| party_id | UUID | Owner org |
| customer_id | UUID | FK → customers.id |
| order_number | text | Human-readable (e.g. ORD-2026-001) |
| status | text | pending/confirmed/processing/shipped/delivered/cancelled |
| payment_status | text | unpaid/paid/refunded |
| total_amount | numeric | Order total |
| currency | text | ISO code (e.g. CZK) |

### customers
Customer contact records.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| party_id | UUID | Owner org |
| first_name | text | First name |
| last_name | text | Last name |
| email | text | Contact email |
| phone | text | Phone number |
| is_active | boolean | Active/inactive |

### inventory_items
Stock levels per product per warehouse.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| party_id | UUID | Owner org |
| product_id | UUID | FK → products.id |
| warehouse_id | UUID | FK → warehouses.id |
| qty_on_hand | int | Current stock |
| qty_reserved | int | Allocated to orders |
| low_stock_threshold | int | Alert threshold |

## Supabase Storage

Images are stored in a Supabase Storage bucket called `product-images`. The bucket is public (images are readable by everyone) but only authenticated users can upload.

Path pattern: `{party_id}/{product_id}/{timestamp}.{ext}`

## Migrations

All schema changes go through SQL migration files in `supabase/migrations/`. Never use the Supabase Dashboard to change the schema directly — it won't be reflected in your migration history.

After changing the schema, regenerate types:
```bash
supabase gen types > shared/supabase/types.ts
```
