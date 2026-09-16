---
title: Fakturace
description: Přehled napříč organizacemi cenového režimu každé strany, poplatku za aktuální měsíc a dlužné zůstatku
---

Fakturace je přehled na úrovni platformy, který zahrnuje všechny strany.
Na jednom obrazovce zobrazuje každou organizaci, kterou můžete vidět - její cenový režim, poplatek za tento měsíc a dlužný zůstatek - takže se vám nikdy nemusíte přepínat mezi aktivními stranami a hledat jednotlivě v [Výplatách](/docs/en/admin/payouts) každé organizace.
Je vždy omezeno na `ctx.parties`: vlastník vidí všechny strany, administrátor vidí pouze ty, které jsou mu přiděleny.

## Požadované oprávnění

| Permission bit | Name | Who has it by default |
|---|---|---|
| 4096 | MANAGE_AUDIT | Vlastník, Administrátor, Administrátor obchodu (s tímto bitem) |

Bez `MANAGE_AUDIT` vás systém přesměruje na `/admin`.
Jedná se o stejný bit, který omezuje přístup k [Protokolu auditu](/docs/en/admin/audit) a úpravám nastavení strany v [Organizacích](/docs/en/admin/parties).

## Dva cenové režimy

Každá organizace má `seller_mode` (nastavený na kartě Režim pro prodejce v [Organizacích](/docs/en/admin/parties)), a Fakturace zobrazuje pro každý režim odlišné údaje:

| Mode | Badge | Jak je účtováno |
|---|---|---|
| Vlastní společnost (`own_company`) | zelený "Vlastní společnost" | `COMMISSION_RATE` (10 %) z měsíčního obratu, který klesá na `REDUCED_COMMISSION_RATE` (5 %) za celý měsíc, jakmile obrat překročí `COMMISSION_REDUCED_THRESHOLD_CZK` (29 900 Kč), fakturováno jako měsíční poplatek platformy. Jakákoli z těchto tří hodnot může být přepsána pro každou organizaci (viz [Organizace](/docs/en/admin/parties)). Kytka z Beskyd začíná v tomto režimu. |
| Provize (`smalljobs_commission`) | hnědý "Provize" | Provizní poplatek účtovaný v účetní knize, s měsíčním limitem výplaty `NO_ICO_MONTHLY_PAYOUT_LIMIT_CZK` (12 000 Kč). |

## Přehledová tabulka (`/admin/billing`)

| Sloupec | Org. vlastní společnosti | Org. provize |
|---|---|---|
| Organizace | Název strany. | Název strany. |
| Režim | Odznak cenového režimu. | Odznak cenového režimu. |
| Tento měsíc | Poplatek za tento měsíc s aplikovanou sazbou (10 % nebo snížená 5 %), plus odznak zaplaceno/nezaplaceno; „žádná aktivita zatím“ při absenci řádku poplatku. | Výplata do tohoto měsíce oproti limitu 12 000 Kč, zobrazená jako lišta pokroku, plus červená poznámka „zdrženo“, pokud byla zdržena jakákoli částka. |
| Dlužné | Celková nezaplacená částka a počet nezaplacených měsíců, nebo „nic neplatné“. | Celková částka podléhající platbě a počet záznamů v knize, které jsou připraveny, nebo „nic neplatné“. |
| Akce | Tlačítko **Vyřešit**. | Tlačítko **Vyřešit**. |

### Akce Vyřešit

**Vyřešit** odesílá požadavek na `/api/switch-party`, přepíná vaši aktivní stranu na danou organizaci a přesměruje vás na její stránku [Výplaty](/docs/en/admin/payouts), kde skutečně označíte poplatek jako zaplacený nebo uvolníte výplatu.
Samotná Fakturace je pouze pro čtení; nikdy nezmění zůstatek.

## Data a úložiště (cloud)

- **Tabulky:** `parties` (`seller_mode`), `monthly_platform_fees` (poplatky vlastní společnosti: `period_month`, `fee_amount`, `status`), `order_commission_ledger` (záznamy provize: `net_payable`, `withheld_amount`, `status`, `hold_until`).
- **Konstanty:** `SELLER_MODE`, `COMMISSION_RATE`, `REDUCED_COMMISSION_RATE`, `COMMISSION_REDUCED_THRESHOLD_CZK`, `NO_ICO_MONTHLY_PAYOUT_LIMIT_CZK` z `shared/constants/sellerMode.ts`. Přepsání pro každou organizaci je uloženo v `parties` (`commission_rate_override`, `reduced_commission_rate_override`, `commission_threshold_override`) a je vyřešeno funkcí `resolveFeeSchedule()` v `shared/utils/billingFeeCalc.ts`.
- Pouze čtení; omezeno na `ctx.parties`.

## Související stránky

- [Výplaty](/docs/en/admin/payouts) - stránka pro každou organizaci, kde jsou plateny poplatky a uvolňovány provizní výplaty
- [Organizace](/docs/en/admin/parties) - karta Režim pro prodejce, která určuje, na jaký model cenotvorby je organizace
- [Zprávy](/docs/en/admin/reports) - měsíční období fakturace a export CSV pro daně z příjmu
