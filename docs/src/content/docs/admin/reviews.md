---
title: Recenze
description: Moderace recenzí produktů od zákazníků - schvalujte, zamítnějte, skryjte nebo smažte hodnocení a psané zpětné vazby
---

Stránka Recenze je místo, kde jsou hodnocení produktů předložená zákazníky moderována předtím, než se objeví v obchodě.
Recenze jsou připojeny k [produktům](/docs/admin/products) a jsou veřejně zobrazeny pouze po schválení a pouze tehdy, když je v obchodě povolena recenze (přepínač `enable_reviews` v nastavení vzhledu značky [Branding](/docs/admin/settings-branding)).

## Požadované oprávnění

| Bit oprávnění | Název | Kdo ho má výchozí |
|---|---|---|
| 8 | MANAGE_PRODUCTS | Vlastník, Administrátor, Administrátor e-shopu (s tímto bitem) |

Recenze sdílejí bit `MANAGE_PRODUCTS` s [Produkty](/docs/admin/products) a [Podmínkami produktu](/docs/admin/product-conditions).
Bez něj vás systém přesměruje na `/admin`.

## Seznam recenzí (`/admin/reviews`)

Recenze se načítají po 20 na stránku pomocí `fetchReviews`, nejnovější jako první, s celkovým počtem vedle názvu.

### Záložky stavu

Pять záložek filtruje podle stavu moderace:

| Záložka | `product_reviews.status` |
|---|---|
| Všechny | (žádný filtr) |
| Očekává | `pending` - výchozí stav pro nově předloženou recenzi, čekající na moderaci. |
| Schválené | `approved` - veřejně viditelné. |
| Zamítnuté | `rejected` - zamítnuto, nikdy neukázáno. |
| Skryté | `hidden` - dříve viditelné, nyní vytaženo z obchodu. |

### Karta recenze

Každá recenze se vykreslí jako karta, ne jako řádek tabulky:

- **Hvězdy** - hodnocení vykreslené jako vyplněné/prázdné hvězdy (1 až 5), s názvem číselnou hodnotou.
- **Jméno autora** a **e-mail autora**.
- Odznak "Ověřený nákup", když je `is_verified` pravdivé (recenzent skutečně koupil položku).
- **Odznak stavu** - kódovaný barvou: čekající žlutá, schválená zelená, zamítnutá červená, skrytá šedá.
- **Datum** - `created_at` v aktuální lokalitě.
- **Výhody / Nevýhody** - dvě sloupce, výhody předponovány zeleným `+`, nevýhody červeným mínusem.
- **Text** - recenze v volném textu, pokud je přítomna.

### Akce moderace

Každá karta zobrazuje akce, které mají smysl pro její aktuální stav, plus Smazat:

| Tlačítko | Efekt (POST `action`) |
|---|---|
| Schválit | Nastaví stav na `approved` (skryto, pokud je již schváleno). |
| Zamítnout | Nastaví stav na `rejected` (skryto, pokud je již zamítnuto). |
| Skrýt | Nastaví stav na `hidden` (skryto, pokud je již skryto). |
| Smazat | Trvale odstraní recenzi po dialogu `confirm()`. |

Schválení / zamítnutí / skrytí aktualizuje řádek na místě; smazání ho zcela odstraní.
Po jakékoli akci se stránka přesměruje zpět na `/admin/reviews`.

## Prázdný stav a paginace

Pokud záložka nemá žádné recenze, zobrazí se centrováná karta „Žádné recenze“.
Odkazy Předchozí / Další s indikátorem „Stránka X / Y“ se objeví, když je více než jedna stránka, a zachovají aktivní filtr stavu.

## Data a úložiště (cloud)

- **Tabulka:** `product_reviews` (`product_id`, `author_name`, `author_email`, `rating`, `pros[]`, `cons[]`, `body`, `is_verified`, `status`, `created_at`).
- **Denormalizováno na produktu:** Schválené recenze ovlivňují `products.rating_avg` a `products.review_count`.
- **Služba:** `fetchReviews` (`reviewService`); zápisy stavu/smazání jdou přímo do `product_reviews`.
- **Konfigurace obchodu:** `enable_reviews` určuje, zda se schválené recenze vůbec vykreslí v obchodě.
- Omezeno na `ctx.partyId`.

## Související stránky

- [Produkty](/docs/admin/products) - recenze jsou připojeny k produktům; průměr hodnocení a počet se zobrazují na produktu
- [Branding](/docs/admin/settings-branding) - přepínač `enable_reviews`, který zapíná nebo vypíná recenze v obchodě
