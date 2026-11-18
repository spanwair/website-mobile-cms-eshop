---
title: Fakturace
description: Přehled napříč organizacemi cenového režimu každé strany, poplatku za aktuální měsíc a dlužné zůstatku
---

Fakturace je přehled na úrovni platformy, který zahrnuje všechny strany.
Na jednom obrazovce zobrazuje každou organizaci, kterou můžete vidět - její cenový režim, poplatek za tento měsíc a dlužný zůstatek - takže se vám nikdy nemusíte přepínat mezi aktivními stranami a hledat jednotlivě v [Výplatách](/docs/admin/payouts) každé organizace.
Je vždy omezeno na `ctx.parties`: vlastník vidí všechny strany, administrátor vidí pouze ty, které jsou mu přiděleny.

## Požadované oprávnění

| Bit oprávnění | Název | Kdo ho má výchozí |
|---|---|---|
| 4096 | MANAGE_AUDIT | Vlastník, Administrátor, Administrátor obchodu (s tímto bitem) |

Bez `MANAGE_AUDIT` vás systém přesměruje na `/admin`.
Jedná se o stejný bit, který omezuje přístup k [Protokolu auditu](/docs/admin/audit) a úpravám nastavení strany v [Organizacích](/docs/admin/parties).

## Dva cenové režimy

Každá organizace má `seller_mode` (nastavený na kartě Režim pro prodejce v [Organizacích](/docs/admin/parties)). Oba režimy jsou nyní účtovány ze stejné účetní knihy jednotlivých objednávek (`order_commission_ledger`) — liší se jen sazba a lhůta zádržné:

| Režim | Odznak | Jak je účtováno |
|---|---|---|
| Vlastní společnost (`own_company`) | zelený "Vlastní společnost" | Pásmová (marginální) sazba z `COMMISSION_TIERS` (od 5 % do 2 %, podle pásma měsíčního obratu, viz [Ceník](/docs/)) za každou objednávku — každá objednávka se počítá jako kombinace všech pásem, kterých se dotýká podíl měsíčního obratu připadající na ni, se zádržnou lhůtou `OWN_COMPANY_PAYOUT_HOLD_DAYS` (14 dní). Lze přepsat pro jednotlivou organizaci přes `resolveFeeSchedule()` (viz [Organizace](/docs/admin/parties)) — tímto způsobem se nastavuje i individuálně dohodnutá sazba "vlastní e-shop" nad nejvyšším veřejným pásmem. Kytka z Beskyd začíná v tomto režimu. |
| Provize (`smalljobs_commission`) | hnědý "Provize" | Pevný odvod `NO_ICO_DEDUCTION_RATE` (30 %) za každou objednávku, se zádržnou lhůtou `PAYOUT_HOLD_DAYS` (60 dní) a měsíčním limitem výplaty `NO_ICO_MONTHLY_PAYOUT_LIMIT_CZK` (12 000 Kč). |

## Přehledová tabulka (`/admin/billing`)

| Sloupec | Org. vlastní společnosti | Org. provize |
|---|---|---|
| Organizace | Název strany. | Název strany. |
| Režim | Odznak cenového režimu. | Odznak cenového režimu. |
| Tento měsíc | Hrubý obrat tohoto měsíce a odečtená provize; „žádná aktivita zatím“ při absenci řádku v knize za tento měsíc. | Výplata do tohoto měsíce oproti limitu 12 000 Kč, zobrazená jako lišta pokroku, plus červená poznámka „zdrženo“, pokud byla zdržena jakákoli částka. |
| Dlužné | Celková částka připravená k výplatě a počet objednávek, které jsou připravené, nebo kolik jich ještě čeká na konec zádržné lhůty, případně „nic k výplatě“. | Totéž. |
| Akce | Tlačítko **Vyřešit**. | Tlačítko **Vyřešit**. |

### Akce Vyřešit

**Vyřešit** odesílá požadavek na `/api/switch-party`, přepíná vaši aktivní stranu na danou organizaci a přesměruje vás na její stránku [Výplaty](/docs/admin/payouts), kde se výplata skutečně uvolňuje.
Samotná Fakturace je pouze pro čtení; nikdy nezmění zůstatek.

## Data a úložiště (cloud)

- **Tabulky:** `parties` (`seller_mode`), `order_commission_ledger` (`gross_amount`, `commission_amount`, `net_payable`, `withheld_amount`, `status`, `hold_until`, `created_at`) — jediný zdroj pravdy pro oba režimy prodejce.
- **Konstanty:** `SELLER_MODE`, `COMMISSION_TIERS`, `COMMISSION_ENTRY_RATE`, `COMMISSION_ENTERPRISE_THRESHOLD_CZK`, `OWN_COMPANY_PAYOUT_HOLD_DAYS`, `NO_ICO_DEDUCTION_RATE`, `PAYOUT_HOLD_DAYS`, `NO_ICO_MONTHLY_PAYOUT_LIMIT_CZK` z `shared/constants/sellerMode.ts`. Přepsání pro jednotlivou organizaci je uloženo v `parties` (`commission_tiers_override`, pole pásem v JSONB) a je vyřešeno funkcí `resolveFeeSchedule()` v `shared/utils/billingFeeCalc.ts`; kombinovanou sazbu pro jednu objednávku počítá `computeTieredCommission()` ve stejném souboru.
- Pouze čtení; omezeno na `ctx.parties`.

## Související stránky

- [Výplaty](/docs/admin/payouts) - stránka pro každou organizaci, kde jsou plateny poplatky a uvolňovány provizní výplaty
- [Organizace](/docs/admin/parties) - karta Režim pro prodejce, která určuje, na jaký model cenotvorby je organizace
- [Zprávy](/docs/admin/reports) - měsíční období fakturace a export CSV pro daně z příjmu
