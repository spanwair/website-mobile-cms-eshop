---
title: Ceny
description: Centrum cen - spravujte ceníky, pravidla pro slevy a kódy kupónů pro váš obchod
---

Sekce Ceny je centrem všeho, co ovlivňuje to, co zákazník platí.
Obsahuje tři záložky, z nichž každá je podložena vlastní sadou záznamů: **ceníky** (přepisy cen produktů s omezením na měnu), **pravidla pro slevy** (opakovatelné matematické vzorce pro akci) a **kupóny** (využitelné kódy, které odkazují na pravidlo pro slevu).
Každá záložka odkazuje na vyhrazenou stránku pro vytvoření/upravu, která je dokumentována zvlášť: [Ceníky](/docs/admin/pricing-pricelists), [Slevy](/docs/admin/pricing-discounts) a [Kupóny](/docs/admin/pricing-coupons).

## Oprávnění vyžadováno

| Bit oprávnění | Název | Kdo ho má výchozí |
|---|---|---|
| 128 | MANAGE_PRICING | Vlastník, Administrátor, Administrátor obchodu (s tímto bitem) |

Centrum a každá stránka pro kupón/slevu/ceník volá `requireAdminCtx`.
Neověřený uživatel je přesměrován na `/login`.
Uživatel bez role administrátor je přesměrován na `/dashboard`.
Uživatel bez aktivní organizace je přesměrován na `/admin/parties/new` (vlastník) nebo `/admin/setup`.
Chybí bit MANAGE_PRICING, což přesměruje na `/admin`.

## Centrum (`/admin/pricing`)

Stránka se otevírá s třemi záložkami; parametr dotazu `?tab=` vybere, která je zobrazená (výchozí `pricelists`).
Každá záložka zobrazuje aktuální počet svých záznamů.

| Záložka | Hodnota dotazu | Zobrazuje |
|---|---|---|
| Ceníky | `pricelists` | Tabulka ceníků |
| Slevy | `discounts` | Tabulka pravidel pro slevy |
| Kupóny | `coupons` | Tabulka kupónů |

Všechny tři sadu dat se načítají společně při načtení stránky pomocí `fetchPriceLists`, `fetchDiscountRules` a `fetchCoupons`, přičemž je každá omezená na `party_id` aktivní organizace.

### Záložka Ceníky

Panel nástrojů zobrazuje počet a tlačítko "Nový ceník" odkazující na [`/admin/pricing/pricelists/new`](/docs/admin/pricing-pricelists).

| Sloupec | Zdrojový sloupec |
|---|---|
| Název | `name` |
| Měna | `currency` |
| Výchozí | Zelený odznak "Výchozí", pokud je `is_default`, jinak pomlčka |
| Stav | Zelené `Aktivní` / ztlumený `Neaktivní` z `is_active` |
| Platí od | Datum `valid_from`, nebo pomlčka |
| Platí do | Datum `valid_to`, nebo pomlčka |
| Akce | Odkaz na úpravu na `/admin/pricing/pricelists/{id}` |

Prázdný stav: řádek "žádné ceníky" se rozprostírá přes tabulku.

### Záložka Slevy

Panel nástrojů zobrazuje počet a tlačítko "Novou slevu" odkazující na [`/admin/pricing/discounts/new`](/docs/admin/pricing-discounts).

| Sloupec | Zdrojový sloupec |
|---|---|
| Název | `name` |
| Typ | Hnědý odznak s názvem typu slevy (viz níže) |
| Hodnota | `${value}%` pro procentuální slevy, jinak `value` formátované jako měna |
| Stav | Zelené `Aktivní` / ztlumený `Neaktivní` z `is_active` |
| Začíná | Datum `starts_at`, nebo pomlčka |
| Končí | Datum `ends_at`, nebo pomlčka |
| Akce | Odkaz na úpravu na `/admin/pricing/discounts/{id}` |

Názvy typů slevy: `percentage`, `fixed`, `buy_x_get_y`, `free_shipping`.
Prázdný stav: řádek "žádné slevy".

### Záložka Kupóny

Panel nástrojů zobrazuje počet a tlačítko "Nový kupón" odkazující na [`/admin/pricing/coupons/new`](/docs/admin/pricing-coupons).

| Sloupec | Zdrojový sloupec |
|---|---|
| Kód | `code` (tučné monospace) |
| Stav | Zelené `Aktivní` / ztlumený `Neaktivní` z `is_active` |
| Max. použití | `max_uses`, nebo "Neomezeno" při null |
| Použito | `uses_count` |
| Vytvořeno | Datum `created_at` |
| Akce | Odkaz na úpravu na `/admin/pricing/coupons/{id}` |

Prázdný stav: řádek "žádné kupóny".

## Jak se tyto tři části spojují

- **Pravidlo pro slevu** definuje matematiku akce (slevu 10 %, zdarma doprava nad určitou hranici atd.). Může být použito samostatně nebo odkazováno kupónem.
- **Kupón** je pouze využitelný kód, který odkazuje na přesně jedno pravidlo pro slevu pomocí `discount_rule_id`. Nemůžete vytvořit kupón, dokud neexistuje alespoň jedno pravidlo pro slevu.
- **Ceník** je samostatný mechanismus: sada cen produktů s omezením na měnu, která přepisuje výchozí cenu produktu, s možností omezení časem a označení jako výchozí.

## Data a úložiště (cloud)

- `price_lists` - `name`, `currency`, `is_default`, `is_active`, `valid_from`, `valid_to`, `party_id`.
- `discount_rules` - `name`, `type`, `value`, `min_order_amount`, `min_quantity`, `applies_to`, `applies_to_ids`, `customer_group`, `starts_at`, `ends_at`, `usage_limit`, `usage_count`, `is_active`, `party_id`.
- `coupons` - `code`, `discount_rule_id`, `max_uses`, `uses_count`, `is_active`, `party_id`, `created_at`.
- Všechny tři jsou čteny s filtrováním podle `party_id` (pomocí `pricingService`).

## Související stránky

- [Kupóny](/docs/admin/pricing-coupons) - vytváření a úprava využitelných kódů
- [Slevy](/docs/admin/pricing-discounts) - vytváření a úprava pravidel pro slevy
- [Ceníky](/docs/admin/pricing-pricelists) - vytváření a úprava přepisu cen na produkt
- [Produkty](/docs/admin/products) - katalog, na který se ceníky a slevy odkazují
- [Objednávky](/docs/admin/orders) - kde se sleva z vykoupeného kupónu promítne do celkové ceny objednávky
