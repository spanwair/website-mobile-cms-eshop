---
title: Přehled API
description: Jak připojit svůj vlastní eshop k CMS API.
---

CMS poskytuje dva typy API endpointů. Oba jsou poskytovány vaším backendem Supabase - nemáte spuštět samostatný API server.

| Typ | Základní URL | Co dělá |
|---|---|---|
| **PostgREST** | `https://api-oci.mamtodoma.cz/rest/v1` | Přímý přístup k tabulce - produkty, kategorie, košík, objednávky |
| **Edge Functions** | `https://api-oci.mamtodoma.cz/functions/v1` | Vlastní logika - smazání účtu, webhooks, integrace |

Základní URL je vaše `PUBLIC_SUPABASE_URL`: `https://api-oci.mamtodoma.cz` v produkci (self-hostovaná Supabase na Oracle Cloud) a `http://127.0.0.1:54321` v lokálním vývoji.

## Autentizace

Každý požadavek musí mít hlavičku `apikey` nastavenou na váš **anon klíč**. Tento klíč je veřejný a je bezpečné jej zahrnout do frontend kódu.

```http
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Pro endpointy, které vyžadují přihlášeného uživatele (košík, objednávky, seznam přání, operace účtu), zašlete také JWT uživatele:

```http
apikey: <your-anon-key>
Authorization: Bearer <user-jwt>
```

> **Nikdy nepoužívejte klíč `service_role`** v kódu eshopu. Obchází veškerou bezpečnost na úrovni řádků a odhaluje data každé organizace každé jiné organizaci. Podrobnější informace najdete v [Architektuře s více nájemníky](/docs/architecture/multi-tenancy).

## Získání JWT uživatele

Použijte Supabase JS klienta:

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

## Syntax pro filtrování

PostgREST používá parametry dotazu URL pro filtrování. SQL není nutné.

| Chcete | Parametr dotazu |
|---|---|
| Rovnost | `?status=eq.active` |
| Nerovnost | `?status=neq.draft` |
| Větší než | `?price=gt.50` |
| Menší nebo rovno | `?price=lte.200` |
| V seznamu | `?status=in.(active,inactive)` |
| Shoda vzoru | `?title=ilike.*shirt*` |
| Je null | `?parent_id=is.null` |
| Vybrat specifické sloupce | `?select=id,title,price,slug` |
| Seřazení rostoucí | `?order=title.asc` |
| Seřazení sestupující | `?order=created_at.desc` |
| Paginace | `?limit=20&offset=40` |

Filtry se kombinují pomocí `&`: `?status=eq.active&is_visible=eq.true&order=title.asc&limit=20`

## Filtr party_id (vyžadováno)

Veřejné endpointy (produkty, kategorie, značky) vrací data ze **všech organizací** na platformě. Musíte filtrovat podle ID vaší organizace, abyste získali pouze svá data.

Najděte své `party_id` v panelu administrátora na **[Administrátor → Organizace](/docs/admin/parties)** - je to UUID zobrazené v URL stránky detailu organizace.

```
?party_id=eq.550e8400-e29b-41d4-a716-446655440000
```

## Rychlý start - seznamte své produkty

```javascript
const SUPABASE_URL = 'https://api-oci.mamtodoma.cz'
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

## Používání Supabase JS klienta (doporučeno)

Knižnice klienta Supabase zpracovává autentizaci, opakování a časově reálné odběry. Je to doporučený přístup oproti použití surového fetch.

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

// Authenticated - get cart (user must be logged in)
const { data: cartItems } = await supabase
  .from('cart_items')
  .select('*, products(title, price)')

// Add to cart
const { error } = await supabase
  .from('cart_items')
  .insert({ product_id: 'uuid-here', quantity: 1 })
```

## Limity rychlosti

Produkční backend je self-hostovaný Supabase stack na VM v Oracle Cloud, takže neexistují žádné kvóty podle tarifu - propustnost je omezena konfigurací API brány (Kong) a kapacitou VM.

PostgREST vrátí chybu `413`, pokud by odpověď překročila 2 MB. Použijte `?select` k redukci velikosti zátěže a `?limit` pro paginaci.

## CORS

PostgREST výchozíně povoluje všechny domény. Edge Functions zahrnují explicitní CORS hlavičky. Pokud potřebujete omezit domény, nakonfigurujte to v konfiguraci Kong / PostgREST self-hostovaného stacku na VM v Oracle Cloud.

## Kompletní reference API

Interaktivní reference API (s konzolí „Vyzkoušet“ pro každý endpoint) je k dispozici na:

- **[Reference API](/docs/api/reference)** - vykreslená z OpenAPI specifikace

## Související

- [Architektura s více nájemníky](/docs/architecture/multi-tenancy) - jak funguje izolace organizací a co nechat dělat
- [Hierarchie rolí](/docs/users/roles) - které uživatele mohou přistupovat k jakým datům
- [Nastavení prostředí](/docs/getting-started/environment) - kde najít URL vašeho projektu, anon klíč a party_id
