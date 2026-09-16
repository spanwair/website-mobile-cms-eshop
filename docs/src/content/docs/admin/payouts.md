---
title: Výplaty
description: Účetní kniha výplat pro organizaci pro prodejce na provizi a historie poplatků platformy pro prodejce vlastní firmy
---

Výplaty je stránka s finančními údaji pro každou organizaci.
To, co zobrazuje, závisí výhradně na aktivním `seller_mode` organizace: prodejce na provizi vidí účetní knihu výplat objednávka po objednávce, zatímco prodejce vlastní firmy vidí svou historii měsíčních poplatků platformy (s možností zaplatit poplatek online přes Stripe).
Souhrn napříč organizacemi se nachází v [Fakturace](/docs/en/admin/billing); tato stránka je místo, kde jednáte s jednou organizací.

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

Místo účetní knihy tento režim vykresluje `PlatformFeeHistory` pro až 24 měsíčních období fakturace.
Poplatek činí 10 % z měsíčního obratu, který klesá na zlevněné 5 % z celého měsíce, jakmile obrat překročí 29 900 Kč (obě sazby i práh lze přepsat pro každou organizaci).
Kytka z Beskyd, která začíná v režimu vlastní firmy, by zde viděla své měsíční poplatky platformy.

### Platba měsíčního poplatku online (Stripe)

Akce **Zaplatit poplatek** odešle `action=pay_fee_online`, přečte `fee_amount` pro dané období z `eshop_billing_periods` a spustí se sesízení Stripe Checkout v CZK.
Bydete přesměrováni na Stripe; po návratu stránka ověří, že se sesízení pokladny skutečně dostalo do stavu `payment_status = "paid"` před jeho zaznamenáním k danému období.
Zrušení vás vrátí s upozorněním "platba zrušena".

### Označení zaplaceného poplatku manuálně (pouze vlastník)

Potvrzení offline platby jako přijaté je rozhodnutí platformy, nikdy neorganizace.
Pouze globální **vlastník** vidí **Označit poplatek jako zaplacený** (`action=mark_fee_paid_manual`), což označí poplatek za dané období jako zaplacený prostřednictvím klientu service-role bez online platby.

## Data a úložiště (cloud)

- **Tabulky:** `order_commission_ledger` (`gross_amount`, `tax_amount`, `commission_amount`, `net_payable`, `withheld_amount`, `status`, `hold_until`, `paid_at`, `paid_by`, `payout_reference`), `eshop_billing_periods` (`period_start`, `fee_amount`), `parties` (`seller_mode`).
- **Služby:** `listBillingPeriods`, `markBillingPeriodFeePaid` (`billingPeriodService`); `createCheckoutSession`, `retrieveCheckoutSession` (integrace Stripe).
- **Klient:** Manuální zápisy zaplaceného poplatku a potvrzené Stripe používají `createAdminClient()` (service role); označení zaplacené výplaty používá sesízení klienta s ochranou stran/stavu.
- **Komponenta:** `PlatformFeeHistory`.

## Související stránky

- [Fakturace](/docs/en/admin/billing) - přehled napříč organizacemi a tlačítko Resolve, které zde přistane
- [Organizace](/docs/en/admin/parties) - karta Režimu prodejce, která určuje, jaký pohled tato stránka zobrazuje
- [Zprávy](/docs/en/admin/reports) - období fakturace a CSV pro daně, které shrnuje stejné údaje
- [Objednávky](/docs/en/admin/orders) - každý záznam v účetní knize provize odpovídá jedné objednávce
