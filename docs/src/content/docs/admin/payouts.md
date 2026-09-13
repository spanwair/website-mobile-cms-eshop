---
title: Výplaty
description: Účet výplat pro organizaci pro prodejce na provizi a historii poplatků platformy pro prodejce vlastní firmy
---

Výplaty je stránka s finančními údaji pro danou organizaci.
To, co zobrazuje, závisí zcela na `seller_mode` aktivní organizace: prodejce na provizi vidí účet výplat objednávka po objednávce, zatímco prodejce vlastní firmy vidí svou měsíční historii poplatků platformy (s možností zaplatit poplatek online přes Stripe).
Souhrn napříč organizacemi se nachází v [Fakturace](/docs/admin/billing); tato stránka je místo, kde jednáte s jednou organizací.

## Požadovaná oprávnění

| Bit oprávnění | Název | Kdo ho má výchozí |
|---|---|---|
| 4096 | MANAGE_AUDIT | Vlastník, Administrátor, Administrátor obchodu (s tímto bitem) |

Bez `MANAGE_AUDIT` vás systém přesměruje na `/admin`.
Organizace bez aktivní strany vás přesměruje na `/admin/setup` (vlastník: `/admin/parties/new`).

## Prodejci na provizi (`smalljobs_commission`)

### Přízkumné dlaždice

- **Pokrok výplaty** - celková výplata tohoto měsíce oproti měsíčnímu limitu 12 000 Kč (`NO_ICO_MONTHLY_PAYOUT_LIMIT_CZK`), zobrazena jako lišta pokroku.
- **Udržováno**, **Přípustné**, **Zaplaceno**, **Zdrženo** - kumulativní součty v účtu.

### Tabulka účtu

Každý řádek je položka provize z jedné objednávky (až 200 nejnovějších) s následujícími sloupci:
Číslo objednávky, Brutto, DPH, Provize, Čistá výplata, Zdrženo, Udržováno do, Stav, Akce.

| Stav | Význam |
|---|---|
| Udržováno | V rámci svého okna zadržení (`hold_until` v budoucnosti). 60denní zadržení chrání proti vrácením/chargebackům. |
| Přípustné | `udržováno` v databázi, ale zadržení vypršelo - připraveno k výplatě. |
| Zaplaceno | Už vyplaceno. |
| Zrušeno | Zrušeno (např. objednávka byla vrácena); vyloučeno z součtů. |

### Uvolnění výplaty

Na řádku **Přípustné** zadejte volitelný **referenční kód výplaty** (identifikátor vašeho bankovního převodu) a klikněte na **Označit jako zaplaceno** (chrání ho `confirm()`).
To odešle `action=mark_paid`, což nastaví řádek účtu na `zaplaceno` s `paid_at`, `paid_by` a referencí - ale pouze pokud je řádek stále `udržováno` a patří vaší straně (ochrana proti dvojitému vyplatení).

## Prodejci vlastní firmy (`own_company`)

Místo účtu vykresluje tento režim `PlatformFeeHistory` pro až 24 měsíčních období fakturace.
Kytka z Beskyd, která začíná v režimu vlastní firmy, by zde viděla své měsíční poplatky platformy ve výši 10 %.

### Online platba měsíčního poplatku (Stripe)

Akce **Zaplatit poplatek** odešle `action=pay_fee_online`, přečte `fee_amount` období z `eshop_billing_periods` a spustí sezení Stripe Checkout v CZK.
Bydete přesměrováni na Stripe; po návratu stránka ověří, že se sezení pokladny skutečně dostalo do stavu `payment_status = "paid"` před jeho zaznamenáním k danému období.
Zrušení vás vrátí s upozorněním "platba zrušena".

### Ruční označení zaplacení poplatku (pouze vlastník)

Potvrzení offline platby jako přijaté je rozhodnutí platformy, nikdy neorganizace.
Pouze globální **vlastník** vidí **Označit poplatek jako zaplacený** (`action=mark_fee_paid_manual`), což označí poplatek období jako zaplacený prostřednictvím klienta s rolem služby bez online platby.

## Data a úložiště (cloud)

- **Tabulky:** `order_commission_ledger` (`gross_amount`, `tax_amount`, `commission_amount`, `net_payable`, `withheld_amount`, `status`, `hold_until`, `paid_at`, `paid_by`, `payout_reference`), `eshop_billing_periods` (`period_start`, `fee_amount`), `parties` (`seller_mode`).
- **Služby:** `listBillingPeriods`, `markBillingPeriodFeePaid` (`billingPeriodService`); `createCheckoutSession`, `retrieveCheckoutSession` (integrace Stripe).
- **Klient:** ruční označení zaplacení poplatku a potvrzení Stripe používají `createAdminClient()` (role služby); označení zaplaceno v účtu používá sezení klienta s ochranou straně/stavu.
- **Komponenta:** `PlatformFeeHistory`.

## Související stránky

- [Fakturace](/docs/admin/billing) - přehled napříč organizacemi a tlačítko Vyřešit, které zde skončí
- [Organizace](/docs/admin/parties) - karta Režimu prodejce, která určuje, jaký pohled tato stránka zobrazuje
- [Zprávy](/docs/admin/reports) - období fakturace a CSV pro daně z příjmu, které shrnuje stejné údaje
- [Objednávky](/docs/admin/orders) - každá položka účtu provize odpovídá jedné objednávce
