---
title: Ceníky
description: Ceníky specifické pro měnu, s možností časového omezení a přepsáním cen pro jednotlivé produkty
---

Ceník je pojmenovaný soubor přepsání cen pro jednotlivé produkty v jedné měně, který je volitelně platný pouze pro daný rozsah dat.
Použijte je pro sezónní ceník, katalog v druhé měně nebo pro výchozí seznam, který řídí celý obchod.
Ceníky se nacházejí pod záložkou **Ceníky** v centru [Ceny](/docs/admin/pricing).

## Požadované oprávnění

| Bit oprávnění | Název | Kdo ho má výchozí |
|---|---|---|
| 128 | MANAGE_PRICING | Vlastník, Administrátor, Administrátor obchodu (s tímto bitem) |

Bez `MANAGE_PRICING` vás systém přesměruje na `/admin`.

## Vytvoření ceníku (`/admin/pricing/pricelists/new`)

### Reference polí

| Pole | Požadováno | Sloupec | Poznámky |
|---|---|---|---|
| Název | Ano | `price_lists.name` | např. „Standardní ceník“. |
| Měna | Ano | `price_lists.currency` | Jeden z USD, EUR, CZK (výchozí), GBP. |
| Výchozí | Ne | `price_lists.is_default` | Označuje toto jako výchozí seznam obchodu. |
| Aktivní | Ne | `price_lists.is_active` | Zaškrtávací pole, výchozí stav je zaškrtnutý. |
| Platné od | Ne | `price_lists.valid_from` | `date`; začátek platnosti. |
| Platné do | Ne | `price_lists.valid_to` | `date`; konec platnosti. |

Pokud je **Platné od** po **Platné do**, server to odmítne s chybou „neplatný rozsah dat“.
Po uložení se vrátíte na `/admin/pricing?tab=pricelists`.

## Úprava ceníku (`/admin/pricing/pricelists/{id}`)

Horní formulář upravuje stejná pole (s stejnou validací rozsahu dat).
Pod ním panel **položek ceníku** (`PriceListItems` komponenta) spravuje přepsání cen pro jednotlivé produkty.

### Správa položek

- **Přidat položku** (`action=add_item`) - vyberte produkt (načtený z maximálně 500 produktů organizace) a zadejte cenu v měně seznamu.
  Produkt musí patřit k aktivní organizaci, jinak obdržíte chybu „produkt nenalezen“.
  Položky jsou uloženy pro každý produkt (`variant_id` je na této úrovni nulový).
- **Smazat položku** (`action=delete_item`) - odstraní jedno přepsání.

Každé přidání/smazání vás přesměruje zpět na stejnou stránku ceníku, aby se tabulka položek obnovila.

### Smazání ceníku

Oddělený červený tlačítko **Smazat** (s dialogem `confirm()`) odstraní celý ceník a vrátí se na záložku Ceníky.

Ceník, jehož strana neodpovídá aktivní organizaci, vás přesměruje na `/admin/pricing`.

## Data a úložiště (cloud)

- **Tabulky:** `price_lists` (`party_id`, `name`, `currency`, `is_default`, `is_active`, `valid_from`, `valid_to`), `price_list_items` (`price_list_id`, `product_id`, `variant_id`, `price`).
- **Služby:** `createPriceList`, `fetchPriceList`, `updatePriceList`, `deletePriceList`, `fetchPriceListItems`, `upsertPriceListItem`, `deletePriceListItem` (`pricingService`); `fetchProducts`, `fetchProduct` (`productService`).
- **Komponenta:** `PriceListItems`.
- Omezeno na `ctx.partyId`; vlastnictví se kontroluje při úpravě a při každém přidání položky.

## Související stránky

- [Ceny](/docs/admin/pricing) - centrum se záložkami Slevy / Kupóny / Ceníky
- [Produkty](/docs/admin/products) - produkty, jejichž ceny ceník přepisuje
- [Pravidla pro slevy](/docs/admin/pricing-discounts) - akce, které se kumulují na cenách z ceníku
