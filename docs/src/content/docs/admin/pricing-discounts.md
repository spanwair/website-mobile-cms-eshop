---
title: Pravidla pro slevy
description: Automatická pravidla pro slevy - procentuální, fixní, kup X získej Y a bezplatná doprava - s podmínkami a plánováním
---

Pravidla pro slevy jsou automatické akce vašeho obchodu.
Pravidlo platí samo o sobě, jakmile jsou splněny jeho podmínky (není vyžadován žádný kód); pokud chcete pravidlo, které se aktivuje pouze tehdy, když zákazník zadá kód, připojte ho k [Kupónu](/docs/admin/pricing-coupons).
Pravidla pro slevy se nacházejí pod záložkou **Slevy** v centru [Ceny](/docs/admin/pricing).

## Požadované oprávnění

| Bit oprávnění | Název | Kdo ho má výchozí |
|---|---|---|
| 128 | MANAGE_PRICING | Vlastník, Administrátor, Administrátor obchodu (s tímto bitem) |

Bez `MANAGE_PRICING` vás systém přesměruje na `/admin`.

## Vytváření pravidla pro slevu (`/admin/pricing/discounts/new`)

### Reference polí

| Pole | Požadováno | Sloupec | Poznámky |
|---|---|---|---|
| Název | Ano | `discount_rules.name` | Interní název, např. "Letní výprodej". |
| Typ | Ano | `discount_rules.type` | `percentage`, `fixed`, `buy_x_get_y` nebo `free_shipping`. |
| Hodnota | Ano | `discount_rules.value` | Částka. Pro procento je to procento (10 = 10%); pro fixní je to finanční částka; pro kup X získej Y je to množství. |
| Minimální hodnota objednávky | Ne | `discount_rules.min_order_amount` | Pravidlo platí pouze tehdy, když se podsuma košíku dosáhne této hodnoty. |
| Minimální množství | Ne | `discount_rules.min_quantity` | Pravidlo platí pouze tehdy, když je v košíku toto množství kvalifikovaných položek. |
| Platí na | Ano | `discount_rules.applies_to` | `all`, `products`, `categories` nebo `customers` (cílový rozsah). |
| Začíná od | Ne | `discount_rules.starts_at` | `datetime-local`; pravidlo je před tímto okamžikem neaktivní. |
| Končí do | Ne | `discount_rules.ends_at` | `datetime-local`; pravidlo vyprší po tomto okamžiku. |
| Limity použití | Ne | `discount_rules.usage_limit` | Celkový počet, kolikrát může být pravidlo použito. |
| Aktivní | Ne | `discount_rules.is_active` | Zaškrtávací pole, výchozí stav je zaškrtnutý. |

Po uložení se vrátíte na `/admin/pricing?tab=discounts`.

### Typy slev

| Typ | Efekt |
|---|---|
| Procentuální | Odpočet procenta od kvalifikované částky. |
| Fixní | Odpočet pevné finanční částky. |
| Kup X získej Y | Akce založená na množství, řízená hodnotou + minimálním množstvím. |
| Bezplatná doprava | Zrušení nákladů na dopravu. |

## Úprava pravidla pro slevu (`/admin/pricing/discounts/{id}`)

Upravovací formulář zrcadlí formulář pro vytváření a předvyplní ho aktuálními hodnotami.
Pole pro datum jsou zobrazeny ve formátu `datetime-local`.
Pole **limity použití** zobrazuje živý tip "použito X z Y" (nebo "neomezeno") z `usage_count`.

Stránka odmítne jakékoli pravidlo, jehož vlastník neodpovídá aktivní organizaci (přesměruje na `/admin/pricing`), takže nikdy nemůžete upravit pravidlo jiné organizace.

### Smazání

Oddělené červené tlačítko **Smazat** (s dialogem `confirm()`) smaže pravidlo a vrátí se na záložku Slevy.

## Data a úložiště (cloud)

- **Tabulka:** `discount_rules` (`party_id`, `name`, `type`, `value`, `min_order_amount`, `min_quantity`, `applies_to`, `applies_to_ids[]`, `customer_group`, `starts_at`, `ends_at`, `usage_limit`, `usage_count`, `is_active`).
- **Služby:** `createDiscountRule`, `fetchDiscountRule`, `updateDiscountRule`, `deleteDiscountRule`, `fetchDiscountRules` (`pricingService`).
- Omezeno na `ctx.partyId`; vlastnictví se kontroluje při úpravě.

## Související stránky

- [Ceny](/docs/admin/pricing) - centrum se záložkami Slevy / Kupóny / Ceník
- [Kupóny](/docs/admin/pricing-coupons) - obal pravidlo pro slevu do kódu, který musí zákazník zadat
- [Produkty](/docs/admin/products) a [Kategorie](/docs/admin/categories) - cíle, když "platí na" produkty nebo kategorie
- [Zákazníci](/docs/admin/customers) - cíl, když "platí na" skupinu zákazníků
