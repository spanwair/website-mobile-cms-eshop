---
title: Zprávy
description: Analýza příjmů, objednávek, produktů a zákazníků s exportem do CSV a měsíčními obdobími fakturace
---

Zprávy transformují surová data z [Objednávek](/docs/admin/orders), [Produktů](/docs/admin/products) a [Zákazníků](/docs/admin/customers) do přehledných karet KPI, grafů trendu za 12 měsíců a stahovatelných CSV souborů.
Umožňují také přístup k tabulce měsíčních **období fakturace**, která je základem pro výpisy pro daň z příjmu a pro komiseční prodejce pro [Výplaty](/docs/admin/payouts).

## Požadovaná oprávnění

| Bit oprávnění | Název | Kdo má výchozí oprávnění |
|---|---|---|
| 512 | MANAGE_REPORTS | Vlastník, Administrátor, Administrátor obchodu (s tímto bitem) |

Bez `MANAGE_REPORTS` vás systém přesměruje na `/admin`.
Akce **zápisu** období fakturace (přepočítání, režim poplatku) vyžadují navíc `MANAGE_AUDIT` (bit 4096); prohlížeč s pouze čtením vidí období, ale nemůže spustit přepočítání.

## Čtyři karty KPI (`/admin/reports`)

Každá karta zobrazuje dvě hlavní statistiky, graf a tlačítko **Export CSV**.

| Karta | Statistika | Graf |
|---|---|---|
| Příjmy | Tento měsíc, tento rok (součet `orders.total_amount`) | 12měsíční sloupcový graf příjmů (`MiniBarChart`) |
| Objednávky | Tento měsíc, celkový počet objednávek | 12měsíční sloupcový graf počtu objednávek |
| Produkty | Celkový počet produktů, aktivní produkty | Top 5 produktů podle příjmů (`TopProductsBars`, s prodanými jednotkami) |
| Zákazníci | Registrování zákazníků, hostující zákazníci | 12měsíční sloupcový graf nových zákazníků |

Série pocházejí z `fetchMonthlySeries`, `fetchTopProducts` a `fetchCustomerStats` v `reportsAnalytics`, a jsou všechny omezeny na aktivní organizaci.

## Export CSV (`/admin/reports/export.csv?type=`)

Tlačítko **Export CSV** na každé kartě volá stejný endpoint s jiným `type`. Export probíhá v rámci vlastní přihlašovací relace prohlížeče, takže RLS udržuje omezení na jeho organizaci.

| `type` | Soubor | Sloupce |
|---|---|---|
| `revenue` | `reports-revenue.csv` | `měsíc`, `příjmy` (12 měsíců) |
| `orders` | `reports-orders.csv` | `měsíc`, `objednávky` (12 měsíců) |
| `products` | `reports-products.csv` | `název`, `jednotky`, `příjmy` (top 50) |
| `customers` | `reports-customers.csv` | blok celků (`celkem`, `registrováni`, `hostující`), poté prázdný řádek, poté `měsíc`, `noví_zákazníci` |

Hodnoty jsou CSV-escapované (uvnitřní uvozovky zdvojnásobeny, pole s čárkami/novými řádky uvnitř uvozovek); peníze jsou zapsány se dvěma desetinnými místy.

## Měsíční období fakturace

Pod kartami KPI seznam `BillingPeriodsSection` uvádí až 13 nedávných měsíčních období.
Při načtení stránky se aktuální měsíc přepočítá automaticky; pokud máte `MANAGE_AUDIT`, akce **Přepočítat** vám umožní vynuceně přepočítat minulé období.
Všechny zápisy fakturace probíhají přes klient role služby (stejné hranice oprávnění jako cron pro měsíční poplatek), nikdy ne přes vlastní klienta prohlížeče.

### CSV období fakturace (`/admin/reports/billing-periods.csv`)

Tento výpis pro daň z příjmu vrátí až 60 období a záměrně uvádí hrubé a čisté údaje v jednom souboru, aby nebylo nutné vyrovnávat různé stahování.

Sloupce: `period_start`, `period_end`, `seller_mode`, `gross_revenue`, `real_costs`, `net_revenue`, `fee_mode`, `fee_rate`, `fee_amount`, `net_payout`, `currency`, `status`.

- **gross_revenue** - hrubý obrat (celkem přijaté).
- **net_revenue** - po reálných nákladech.
- **net_payout** - po poplatku platformy, pro komiseční prodejce.
- **fee_rate** - čtyřmístná sazba, prázdná, když není poplatek.

## Data a úložiště (cloud)

- **Agregováno z:** `orders`, `order_items`, `products` a profily zákazníků.
- **Služby:** `fetchMonthlySeries`, `fetchTopProducts`, `fetchCustomerStats` (`reportsAnalytics`); `listBillingPeriods`, `recomputeBillingPeriod` (`billingPeriodService`).
- **Klient:** Přepočítání fakturace používá `createAdminClient()` (role služby); čtení používá klient relace.
- **Komponenty:** `MiniBarChart`, `TopProductsBars`, `BillingPeriodsSection`.

## Související stránky

- [Objednávky](/docs/admin/orders) - zdroj příjmů a počtu objednávek
- [Zákazníci](/docs/admin/customers) - zdroj počtu registrovaných oproti hostujícím
- [Fakturace](/docs/admin/billing) - aktuální období a poplatek platformy pro tuto organizaci
- [Výplaty](/docs/admin/payouts) - výplaty pro komiseční prodejce odvozené z období fakturace
- [Protokol auditu](/docs/admin/audit) - bit `MANAGE_AUDIT`, který odemyká i přepočítání období fakturace
