---
title: Výplaty
description: Účetní kniha výplat pro organizaci pro prodejce na provizi a historie poplatků platformy pro prodejce vlastní firmy
---

Výplaty je stránka s finančními údaji pro každou organizaci.
Oba režimy prodejce nyní zobrazují stejnou účetní knihu výplat objednávka po objednávce (`order_commission_ledger`) - liší se jen sazba a lhůta zádržné, ne stránka samotná.
Souhrn napříč organizacemi se nachází v [Fakturace](/docs/admin/billing); tato stránka je místo, kde jednáte s jednou organizací.

## Požadované oprávnění

| Bit oprávnění | Název | Kdo ho má výchozí |
|---|---|---|
| 4096 | MANAGE_AUDIT | Vlastník, Administrátor, Administrátor obchodu (s tímto bitem) |

Bez `MANAGE_AUDIT` vás systém přesměruje na `/admin`.
Organizace bez aktivní strany vás přesměruje na `/admin/setup` (vlastník: `/admin/parties/new`).

## Prodejci na provizi (`smalljobs_commission`)

### Souhrnné prvky

- **Pokrok výplaty** - celková výplata tohoto měsíce oproti měsíčnímu limitu 12 000 Kč (`NO_ICO_MONTHLY_PAYOUT_LIMIT_CZK`), zobrazená jako lišta pokroku.
- **Uložené**, **Eligible**, **Zaplacené**, **Zdržované** - kumulativní součty v účetní knize.

### Tabulka účetní knihy

Každý řádek představuje provizi z jedné objednávky (až 200 nejnovějších), s následujícími sloupci:
Číslo objednávky, Brutto, DPH, Provize, Čistá k výplatě, Zdržované, Uložit do, Stav, Akce.

| Stav | Význam |
|---|---|
| Uložené | V rámci svého časového okna pro uložení (`hold_until` v budoucnosti). 60denní blokáda chrání proti vrácením/chargebackům. |
| Eligible | `held` v databázi, ale blokáda vypršela - připraveno k výplatě. |
| Zaplacené | Už bylo vyplaceno. |
| Zvrácené | Zrušeno (např. objednávka byla vrácena); vyloučeno z součtů. |

### Uvolnění výplaty

Na řádku **Eligible** zadejte volitelný **referenční kód výplaty** (identifikátor vašeho bankovního převodu) a klikněte na **Označit jako zaplacené** (je to chráněno funkcí `confirm()`).
Tím se odešle `action=mark_paid`, což nastaví řádek účetní knihy na `paid` s `paid_at`, `paid_by` a referencí - ale pouze tehdy, pokud je řádek stále `held` a patří vaší straně (ochrana proti dvojitému vyplacení).

## Prodejci vlastní firmy (`own_company`)

Tento režim používá stejnou účetní knihu a stejnou akci **Označit jako zaplacené** jako prodejci na provizi výše - jediný rozdíl je sazba a lhůta zádržné.
Sazba je pevná: 1,99 % z každé objednávky, bez ohledu na obrat - viz `COMMISSION_TIERS` v `shared/constants/sellerMode.ts` a karta Plán provize v [Organizacích](/docs/admin/parties), kde lze celý plán přepsat pro jednotlivou organizaci (včetně individuálně dohodnuté sazby "vlastní e-shop" nad 30 000 Kč měsíčního obratu).
Zádržná lhůta je `OWN_COMPANY_PAYOUT_HOLD_DAYS` (14 dní), kratší než u prodejců na provizi, protože vlastní firma je sama zákonným prodejcem.
Kytka z Beskyd, která začíná v tomto režimu, by zde viděla svou účetní knihu výplat.

Starší architektura (samostatná komponenta `PlatformFeeHistory`, měsíční poplatek placený přes Stripe Checkout akcí `pay_fee_online`, manuální potvrzení `mark_fee_paid_manual`) byla nahrazena jednotnou účetní knihou pro oba režimy prodejce a v kódu už neexistuje.

## Data a úložiště (cloud)

- **Tabulky:** `order_commission_ledger` (`gross_amount`, `tax_amount`, `commission_amount`, `net_payable`, `withheld_amount`, `status`, `hold_until`, `paid_at`, `paid_by`, `payout_reference`) - jediný zdroj pravdy pro oba režimy prodejce.
- **Konstanty:** `COMMISSION_TIERS`, `OWN_COMPANY_PAYOUT_HOLD_DAYS`, `NO_ICO_DEDUCTION_RATE`, `PAYOUT_HOLD_DAYS`, `NO_ICO_MONTHLY_PAYOUT_LIMIT_CZK` z `shared/constants/sellerMode.ts`.
- **Klient:** Označení zaplacené výplaty používá sesízení klienta s ochranou stran/stavu (RLS: `is_owner()` nebo `MANAGE_AUDIT` na dané organizaci).

## Související stránky

- [Fakturace](/docs/admin/billing) - přehled napříč organizacemi a tlačítko Resolve, které zde přistane
- [Organizace](/docs/admin/parties) - karta Režimu prodejce, která určuje, jaký pohled tato stránka zobrazuje
- [Zprávy](/docs/admin/reports) - období fakturace a CSV pro daně, které shrnuje stejné údaje
- [Objednávky](/docs/admin/orders) - každý záznam v účetní knize provize odpovídá jedné objednávce
