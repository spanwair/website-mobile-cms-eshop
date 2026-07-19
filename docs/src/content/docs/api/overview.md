---
title: API Overview
description: How to connect your custom eshop to the CMS API.
---

The CMS exposes two types of API endpoints. Both are provided by your Supabase project — you do not run a separate API server.

| Type | Base URL | What it does |
|---|---|---|
| **PostgREST** | `https://{ref}.supabase.co/rest/v1` | Direct table access — products, categories, cart, orders |
| **Edge Functions** | `https://{ref}.supabase.co/functions/v1` | Custom logic — account deletion, webhooks, integrations |

Your project `ref` is visible in your Supabase project settings and in `.env.development` as `PUBLIC_SUPABASE_URL`.

## Authentication

Every request needs the `apikey` header set to your **anon key**. This key is public and safe to include in frontend code.

```http
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

For endpoints that require a logged-in user (cart, orders, wishlist, account operations), also send the user's JWT:

```http
apikey: <your-anon-key>
Authorization: Bearer <user-jwt>
```

> **Never use the `service_role` key** in eshop code. It bypasses all Row Level Security and exposes every organization's data to every other organization. See [Multi-Tenant Architecture](/architecture/multi-tenancy) for details.

## Getting the user JWT

Use the Supabase JS client:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, ANON_KEY)

// Magic link login
await supabase.auth.signInWithOtp({ email: 'user@example.com' })

// Google OAuth
await supabase.auth.signInWithOAuth({ provider: 'google' })

// Get the current session (after login)
const { data: { session } } = await supabase.auth.getSession()
const jwt = session?.access_token
```

## Filtering syntax

PostgREST uses URL query parameters for filtering. No SQL needed.

| Want | Query parameter |
|---|---|
| Equals | `?status=eq.active` |
| Not equals | `?status=neq.draft` |
| Greater than | `?price=gt.50` |
| Less than or equal | `?price=lte.200` |
| In a list | `?status=in.(active,inactive)` |
| Pattern match | `?title=ilike.*shirt*` |
| Is null | `?parent_id=is.null` |
| Select specific columns | `?select=id,title,price,slug` |
| Sort ascending | `?order=title.asc` |
| Sort descending | `?order=created_at.desc` |
| Pagination | `?limit=20&offset=40` |

Filters combine with `&`: `?status=eq.active&is_visible=eq.true&order=title.asc&limit=20`

## The party_id filter (required)

Public endpoints (products, categories, brands) return data from **all organizations** on the platform. You must filter by your organization ID to get only your data.

Find your `party_id` in the admin panel at **[Admin → Organizations](/admin/parties)** — it is the UUID shown in the organization detail page URL.

```
?party_id=eq.550e8400-e29b-41d4-a716-446655440000
```

## Quick start — list your products

```javascript
const SUPABASE_URL = 'https://your-ref.supabase.co'
const ANON_KEY = 'your-anon-key'
const PARTY_ID = 'your-party-uuid'  // from Admin → Organizations

const response = await fetch(
  `${SUPABASE_URL}/rest/v1/products` +
  `?party_id=eq.${PARTY_ID}` +
  `&status=eq.active` +
  `&is_visible=eq.true` +
  `&order=title.asc` +
  `&limit=20`,
  {
    headers: {
      'apikey': ANON_KEY,
      'Content-Type': 'application/json',
    }
  }
)

const products = await response.json()
```

## Using the Supabase JS client (recommended)

The Supabase client library handles authentication, retries, and realtime subscriptions. It is the recommended approach over raw fetch.

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, ANON_KEY)

// List products
const { data: products, error } = await supabase
  .from('products')
  .select('id, title, slug, price, discount_price')
  .eq('party_id', PARTY_ID)
  .eq('status', 'active')
  .eq('is_visible', true)
  .order('title', { ascending: true })
  .limit(20)

// Authenticated — get cart (user must be logged in)
const { data: cartItems } = await supabase
  .from('cart_items')
  .select('*, products(title, price)')

// Add to cart
const { error } = await supabase
  .from('cart_items')
  .insert({ product_id: 'uuid-here', quantity: 1 })
```

## Rate limits

| Supabase plan | Limit |
|---|---|
| Free | ~500 requests/second per project |
| Pro and above | Higher limits — see your Supabase dashboard |

PostgREST returns a `413` error if the response would exceed 2MB. Use `?select` to reduce payload size and `?limit` to paginate.

## CORS

PostgREST allows all origins by default. Edge Functions include explicit CORS headers. If you need to restrict origins, configure this in your Supabase project settings under **API → CORS**.

## Full API reference

The interactive API reference (with a "Try it" console for every endpoint) is available at:

- **[API Reference](/api/reference)** — rendered from the OpenAPI spec

## Related

- [Multi-Tenant Architecture](/architecture/multi-tenancy) — how organization isolation works and what not to do
- [Role Hierarchy](/users/roles) — which users can access which data
- [Environment Setup](/getting-started/environment) — where to find your project URL, anon key, and party_id
