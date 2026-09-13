---
title: Fakturace
description: Přehled napříč organizacemi cenového režimu každé strany, poplatku za aktuální měsíc a dlužné zůstatku
---

Fakturace je přehled na úrovni platformy, který zahrnuje všechny strany.
Na jednom obrazovce zobrazuje každou organizaci, kterou můžete vidět - její cenový režim, poplatek za tento měsíc a její dlužný zůstatek - takže se vám nikdy nemusíte přepínat mezi aktivní stranou a hledat informace pro každou organizaci zvlášť v [Výplatách](/docs/admin/payouts).
Je vždy omezeno na `ctx.parties`: vlastník vidí všechny strany, administrátor vidí pouze ty, které mu byly přiděleny.

## Požadované oprávnění

| Bit oprávnění | Název | Kdo ho má výchozíně |
|---|---|---|
| 4096 | MANAGE_AUDIT | Vlastník, Administrátor, Administrátor obchodu (s tímto bitem) |

Bez `MANAGE_AUDIT` vás systém přesměruje na `/admin`.
Jedná se o stejný bit, který omezuje přístup k [Protokolu auditu](/docs/admin/audit) a úpravám nastavení strany v [Organizacích](/docs/admin/parties).

## Dva cenové režimy

Každá organizace má `seller_mode` (nastavený na kartě Režim pro prodejce v [Organizacích](/docs/admin/parties)), a Fakturace zobrazuje pro každý režim odlišné údaje:

| Režim | Odznak | Jak je účtováno |
|---|---|---|
| Vlastní společnost (`own_company`) | zelený "Vlastní společnost" | 10% poplatku za platformu, omezeno na `MONTHLY_COMMISSION_CAP_CZK` (2 990 Kč) měsíčně, fakturováno jako měsíční poplatek za platformu. Kytka z Beskyd začíná v tomto režimu. |
| Provize (`smalljobs_commission`) | hnědý "Provize" | Provize za objednávku uchovávaná v účetním knihě, s měsíčním limitem výplaty `NO_ICO_MONTHLY_PAYOUT_LIMIT_CZK` (12 000 Kč). |

## Přehledová tabulka (`/admin/billing`)

| Sloupec | Org. vlastní společnosti | Org. provize |
|---|---|---|
| Organizace | Název strany. | Název strany. |
| Režim | Odznak cenového režimu. | Odznak cenového režimu. |
| Tento měsíc | Poplatek za aktuální měsíc oproti limitu 2 990 Kč, s odznakem zaplaceno/nezaplaceno; "žádná aktivita zatím" při absenci řádku poplatku. | Výplata do té doby tohoto měsíce oproti limitu 12 000 Kč, zobrazená jako lišta pokroku, plus červená poznámka "zdrženo", pokud byla zdržena jakákoli částka. |
| Dlužné | Celková nezaplacená částka poplatku a počet nezaplacených měsíců, nebo "nic neplatné". | Celková částka způsobilá k platbě a počet připravených záznamů v účetní knize, nebo "nic neplatné". |
| Akce | Tlačítko **Vyřešit**. | Tlačítko **Vyřešit**. |

### Akce Vyřešit

**Vyřešit** odesílá na `/api/switch-party`, přepíná vaši aktivní stranu na danou organizaci a přesměruje vás na její stránku [Výplaty](/docs/admin/payouts), kde skutečně označíte poplatek jako zaplacený nebo uvolníte výplatu.
Samotná Fakturace je pouze pro čtení; nikdy nezmění zůstatek.

## Data a úložiště (cloud)

- **Tabulky:** `parties` (`seller_mode`), `monthly_platform_fees` (poplatky vlastní společnosti: `period_month`, `fee_amount`, `status`), `order_commission_ledger` (záznamy provize: `net_payable`, `withheld_amount`, `status`, `hold_until`).
- **Konstanty:** `SELLER_MODE`, `MONTHLY_COMMISSION_CAP_CZK`, `NO_ICO_MONTHLY_PAYOUT_LIMIT_CZK` z `shared/constants/sellerMode.ts`.
- Pouze čtení; omezeno na `ctx.parties`.

## Související stránky

- [Výplaty](/docs/admin/payouts) - stránka pro organizaci, kde jsou plateny poplatky a uvolňovány provize
- [Organizace](/docs/admin/parties) - karta Režim pro prodejce, která určuje, na jaký model cenový je organizace
- [Zprávy](/docs/admin/reports) - měsíční období fakturace a CSV export pro daně z příjmu
