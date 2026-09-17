---
title: Schéma databáze
description: Tabulky, vztahy a způsob uspořádání dat.
---

## Přehled

Databáze je PostgreSQL hostovaná na Supabase. Vše běží přes API Supabase - žádné přímé připojení k DB z aplikace.

## Základní tabulky

### profiles
Rozšiřuje `auth.users` Supabase Auth. Vytvářeno automaticky při registraci uživatele.

| Sloupec | Typ | Popis |
|--------|------|-------------|
| id | UUID | Stejné jako auth.users.id |
| email | text | E-mail uživatele |
| display_name | text | Zobrazeno v rozhraní |
| role | int | 1=Uživatel, 2=EshopAdministrátor, 4=Administrátor, 8=Vlastník |
| avatar_url | text | URL obrázku profilu |
| lang | text | Preferovaný jazyk (cs/en) |

### parties
Organizace. Všechna e-commerce data patří organizaci.

| Sloupec | Typ | Popis |
|--------|------|-------------|
| id | UUID | Primární klíč |
| name | text | Zobrazená jméno |
| slug | text | Identifikátor bezpečný pro URL (unikátní) |
| company_name | text | Právní jméno |
| vat_number | text | Pro fakturaci |
| billing_email | text | Údaje pro fakturaci |
| is_active | boolean | Činnost této organizace |

### user_party_roles
Spojovací tabulka propojující uživatele s organizacemi s rolem.

| Sloupec | Typ | Popis |
|--------|------|-------------|
| user_id | UUID | FK → profiles.id |
| party_id | UUID | FK → parties.id |
| role_id | UUID | FK → roles.id |

### products
Katalog produktů.

| Sloupec | Typ | Popis |
|--------|------|-------------|
| id | UUID | Primární klíč |
| party_id | UUID | Která organizace to vlastní |
| title | text | Název produktu |
| slug | text | Identifikátor URL (unikátní pro organizaci) |
| price | numeric(12,2) | Standardní cena |
| discount_price | numeric(12,2) | Cena v akci (volitelné) |
| status | text | návrh / aktivní / neaktivní |
| is_featured | boolean | Zobrazit v vybraných sekcích |

### product_categories
Spojovací tabulka - mnoho-k-mnoha mezi produkty a kategoriemi.

| Sloupec | Typ |
|--------|------|
| product_id | UUID → products.id |
| category_id | UUID → categories.id |

### product_images
Obrázky nahrané pro produkt.

| Sloupec | Typ | Popis |
|--------|------|-------------|
| id | UUID | Primární klíč |
| product_id | UUID | FK → products.id |
| url | text | Plná veřejná URL v Supabase Storage |
| alt | text | Alternativní text pro přístupnost |
| is_primary | boolean | Hlavní obrázek (zobrazený v seznamu) |
| sort_order | int | Pořadí zobrazení |

### categories
Kategorie produktů ve stromové struktuře.

| Sloupec | Typ | Popis |
|--------|------|-------------|
| id | UUID | Primární klíč |
| party_id | UUID | Vlastní organizace |
| parent_id | UUID | Родиní kategorie (null = kořen) |
| name | text | Zobrazená jméno |
| slug | text | Identifikátor URL (unikátní pro organizaci) |
| is_visible | boolean | Zobrazit zákazníkům |

### orders
Objednávky zákazníků.

| Sloupec | Typ | Popis |
|--------|------|-------------|
| id | UUID | Primární klíč |
| party_id | UUID | Vlastní organizace |
| customer_id | UUID | FK → zákazníci.id |
| order_number | text | Čitelné pro člověka (např. ORD-2026-001) |
| status | text | čekající/potvrzená/zpracovávána/odeslaná/doručená/zrušená |
| payment_status | text | nezaplacená/zaplacená/vrácená |
| total_amount | numeric | Celková hodnota objednávky |
| currency | text | ISO kód (např. CZK) |

### customers
Kontaktní záznamy zákazníků.

| Sloupec | Typ | Popis |
|--------|------|-------------|
| id | UUID | Primární klíč |
| party_id | UUID | Vlastní organizace |
| first_name | text | Jméno |
| last_name | text | Příjmení |
| email | text | Kontaktní e-mail |
| phone | text | Telefonní číslo |
| is_active | boolean | Aktivní/neaktivní |

### inventory_items
Úrovně zásob pro produkt v skladu.

| Sloupec | Typ | Popis |
|--------|------|-------------|
| id | UUID | Primární klíč |
| party_id | UUID | Vlastní organizace |
| product_id | UUID | FK → produkty.id |
| warehouse_id | UUID | FK → sklady.id |
| qty_on_hand | int | Aktuální zásoba |
| qty_reserved | int | Vyčleněno objednávkám |
| low_stock_threshold | int | Pražec pro upozornění |

## Supabase Storage

Obrázky jsou uloženy v bucketu Supabase Storage s názvem `product-images`. Bucket je veřejný (obrázky jsou čitelné pro všechny), ale nahrávat mohou pouze ověření uživatelé.

Path pattern: `{party_id}/{product_id}/{timestamp}.{ext}`

## Migrace

Všechny změny schématu probíhají prostřednictvím SQL migračních souborů v `supabase/migrations/`. Nikdy nepoužívejte Supabase Dashboard k přímé změně schématu - nebude to zreflektováno v historii migrací.

Po změně schématu znovu vygenerujte typy:
```bash
supabase gen types > shared/supabase/types.ts
```

## Indexy a výkon (Audit Task 6)

Audit 2026-09-17 ověřil query patterns pro storefront a zhodnotil N+1 rizika.

### Stav N+1

- `shared/services/productService.ts:10-86` (`fetchProducts`) - již batched: jeden `products` select s embed `product_variants` + `product_images`, jeden `inventory_items` dotaz přes `IN (productIds)` a map-reduce. Žádný per-product `fetchCategoriesForProduct` loop - P1 N+1 není prokázán, batch fix není aplikován (not applicable, ověřeno grep + code-review).
- `website/src/lib/shopQueries.ts:18-123` (`fetchShopData`) - batched: `categories`, `products` (s `product_variants`/`product_images`/`product_conditions` embed), `fetchOutOfStockMap` + `fetchInventoryTrackingMap` paralelně přes `Promise.all`, map `deriveCardFields`. Bez per-product dotazů.
- Všechny `products` dotazy filtrují `party_id` (multi-tenancy) a `status='active'` + `is_visible=true` pro storefront.

### Indexy pro storefront cesty

Zavedeno v `supabase/migrations/20260103000180_eshop_scoped_query_indexes.sql` (small pre-prod data, plain `CREATE INDEX` bez CONCURRENTLY - viz komentář v migraci, verified `BEGIN/CREATE INDEX CONCURRENTLY` fails v transakci).

| Index | Tabulka | Sloupce / Predikát | Použití |
|-------|---------|-------------------|---------|
| `idx_products_party_created_active` | products | `(party_id, created_at DESC) WHERE status='active' AND is_visible=true` | default sort `created_at` |
| `idx_products_party_price_active` | products | `(party_id, price) WHERE status='active' AND is_visible=true` | sort `price_asc`/`price_desc` |
| `idx_products_party_rating_active` | products | `(party_id, rating_avg DESC) WHERE status='active' AND is_visible=true` | sort `rating` |
| `idx_products_party_featured_active` | products | `(party_id, created_at DESC) WHERE status='active' AND is_visible=true AND is_featured=true` | homepage featured widget |
| `idx_product_categories_category` | product_categories | `(category_id, product_id)` | reverse lookup "products in category X" (`product_categories!inner(category_id)`) |
| `idx_inventory_items_product_variant` | inventory_items | `(product_id, variant_id)` | `fetchOutOfStockMap`/`fetchInventoryTrackingMap` bez `party_id` v dotazu, voláno pro každý storefront card |
| `idx_orders_customer_created` | orders | `(customer_id, created_at DESC)` | customer self-service `fetchOrders` |
| `idx_orders_party_payment_status` | orders | `(party_id, payment_status)` | `fetchOrders` payment_status branch |
| `idx_customers_user` | customers | `(user_id) WHERE user_id IS NOT NULL` | RLS "Customers read own record" |
| `idx_addresses_customer` | addresses | `(customer_id)` | checkout address selection |
| `idx_carts_party_user` | carts | `(party_id, user_id) WHERE user_id IS NOT NULL` | `getOrCreateCart` |
| `idx_carts_party_session` | carts | `(party_id, session_id) WHERE session_id IS NOT NULL` | anon cart lookup |

Plus dřívější `idx_products_party_status` (composite) a `idx_orders_party_status`, `idx_inventory_party_product` atd. - viz `supabase/migrations/20260102000005_eshop_catalog.sql` a audit Task 5 (`supabase/migrations/20260917000001_audit_indexes.sql` pro plain `party_id` indexes).

### Perf budget test

`website/tests/e2e/37-audit-performance.spec.ts` měří `/shop` načtení do `networkidle` pod 5000ms a `data-testid='product-card'` count >0. Baseline:  ~700-1800ms na dev SSR (seed 32 produktů, `pageSize=24`). `pageSize=24` + `range()` paginace v `fetchShopData` limituje payload. `astro.config.ts` bez bundle-analýzy; `website` build přes `astro build` + Cloudflare adapter.

### Doporučení

- Pro velké katalogy zvážit `CREATE INDEX CONCURRENTLY` mimo transakci (prod follow-up, viz migrace komentář).
- Držet `party_id` leading v nových storefront indexech - cross-org isolation a party-scoped cache.
