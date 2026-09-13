---
title: Kupóny
description: Kódy kupónů, které zákazníci zadají v pokladně, aby spustili pravidlo pro slevu
---

Kupón je kód, který zákazník zadá v pokladně, aby získal slevu.
Samotný kupón neobsahuje výpočty slevy - odkazuje na [Pravidlo pro slevu](/docs/admin/pricing-discounts), které definuje, co sleva skutečně dělá.
Proto musíte nejprve vytvořit alespoň jedno pravidlo pro slevu, než můžete vytvořit kupón.
Kupóny se nacházejí pod záložkou **Kupóny** v centru [Cen](/docs/admin/pricing).

## Požadovaná oprávnění

| Bit oprávnění | Název | Kdo ho má výchozí |
|---|---|---|
| 128 | MANAGE_PRICING | Vlastník, Administrátor, Administrátor obchodu (s tímto bitem) |

Bez `MANAGE_PRICING` vás systém přesměruje na `/admin`.

## Vytváření kupónu (`/admin/pricing/coupons/new`)

Pokud vaše organizace ještě nemá žádná pravidla pro slevu, formulář zobrazí varování a tlačítko **Vytvořit** bude zakázané, s výzvou k nejprve vytvoření [pravidla pro slevu](/docs/admin/pricing-discounts).

### Reference polí

| Pole | Požadováno | Sloupec | Poznámky |
|---|---|---|---|
| Kód | Ano | `coupons.code` | Vysvětlený velkými písmeny a zkrácený při uložení, např. `SUMMER20`. Toto zadává kupující. |
| Pravidlo pro slevu | Ano | `coupons.discount_rule_id` | Rozbalovací nabídka s pravidly pro slevu organizace; každá možnost zobrazuje svůj účinek (např. „Letní výprodej (10%)“). |
| Max uses | Ne | `coupons.max_uses` | Celkový počet využití povolený; prázdné znamená neomezeno. |
| Active | Ne | `coupons.is_active` | Zaškrtávací políčko, výchozí stav je zaškrtnuto. |

Po uložení se vrátíte na `/admin/pricing?tab=coupons`.

## Upravování kupónu (`/admin/pricing/coupons/{id}`)

Upravovací formulář je zrcadlový k vytvoření, předvyplněný.
Pole **Max uses** zobrazuje živý tip „použito X z Y“ (nebo „neomezeno“) z `uses_count`.
Kupón, jehož organizace neodpovídá aktivní organizaci, vás přesměruje na `/admin/pricing`.

### Smazání

Oddělené červené tlačítko **Smazat** (s dialogem `confirm()`) odstraní kupón a vrátí se na záložku Kupóny.

## Kupón oproti pravidlu pro slevu

| | Pravidlo pro slevu | Kupón |
|---|---|---|
| Spouští | Automaticky, když jsou splněny podmínky | Pouze když kupující zadá kód |
| Obsahuje výpočty | Ano (typ + hodnota + podmínky) | Ne - odkazuje na pravidlo |
| Limit použití | `usage_limit` na pravidlu | `max_uses` na kupónu |

## Data a úložiště (cloud)

- **Tabulky:** `coupons` (`party_id`, `code`, `discount_rule_id`, `max_uses`, `uses_count`, `is_active`), `discount_rules` (odkazované pravidlo).
- **Služby:** `createCoupon`, `fetchCoupon`, `updateCoupon`, `deleteCoupon`, `fetchDiscountRules` (`pricingService`).
- Omezeno na `ctx.partyId`; vlastnictví se kontroluje při úpravě.

## Související stránky

- [Pravidla pro slevu](/docs/admin/pricing-discounts) - pravidlo, na které musí kupón odkazovat (vytvořte nejprve)
- [Ceny](/docs/admin/pricing) - centrum se všemi záložkami cen
- [Objednávky](/docs/admin/orders) - využívané kupóny se zobrazují u objednávek, které je použily
