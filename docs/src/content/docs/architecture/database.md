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
