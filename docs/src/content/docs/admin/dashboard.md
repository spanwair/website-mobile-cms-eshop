---
title: Nástěnka
description: Domovská stránka administrátora s panelovými ukazateli KPI, přehledem produktů, nedávnými objednávkami a panelem pro příjmy, vše ohraničeno podle role a oprávnění
---

Nástěnka na `/admin` je vstupní stránka administrace.
Zobrazuje soubor panelů KPI, volitelný přehled produktů, tabulku nedávných objednávek, panel příjmů a panel nedávných aktivit.
Klíčové je, že **které z těchto bloků uvidíte závisí zcela na vašich bitech oprávnění** - stránka se sama sestaví z přesného souboru věcí, které máte oprávnění spravovat.

## Požadované oprávnění

| Bit oprávnění | Název | Kdo ho má výchozí |
|---|---|---|
| 1 | VIEW_DASHBOARD | Vlastník, Administrátor, Administrátor e-obchodu (s tímto bitem) |

Pokud vám chybí `VIEW_DASHBOARD`, budete přesměrováni na [`/admin/notifications`](/docs/admin/notifications) namísto na `/admin`, protože oznámení je jediná stránka, na kterou může každý administrátor vždy najít.

## Řetězec přístupu a přesměrování

Stránka tyto kontroly provádí v tomto pořadí před vykreslením jakéhokoli obsahu:

| Podmínka | Přesměrování |
|---|---|
| Žádná přihlašovací relace | `/login` |
| `requireAdminCtx` vrátí `null` | `/dashboard` |
| Není vlastník a chybí `ctx.partyId` | `/admin/setup` |
| Role = ADMIN s organizací, ale 0 kategorií nebo 0 produktů | `/admin/onboarding/tutorial` (viz [Nástup](/docs/admin/onboarding)) |
| Chybí `VIEW_DASHBOARD` | `/admin/notifications` |

## Informační bannery

V závislosti na stavu se nad panely objeví jeden z několika bannerů.

- **Tabulky nejsou připraveny**: pokud selže sondovací dotaz proti `parties`, varovný banner vysvětluje, že databáze ještě není nastavená.
- **Vlastník bez organizace**: banner vyzývá vlastníka k [vytvoření jeho první organizace](/docs/admin/parties).
- **Nevlastník bez organizace**: varovný banner odkazuje na seznam [Organizací](/docs/admin/parties).
- **Kontrola pro nástup**: pro neadministrátora, který může spravovat produkty, ale jeho organizace nemá žádné kategorie ani produkty, banner odkazuje na [návod pro nástup](/docs/admin/onboarding).

## Panely KPI

Řádek panelů je sestaven podmíněně.
Každá skupina se zobrazí pouze tehdy, pokud máte odpovídající oprávnění, takže administrátor e-obchodu s omezenou vlastní rolí může vidět pouze jeden nebo dva panely.

| Panel | Zobrazuje se, když máte | Zdroj hodnoty |
|---|---|---|
| Celkový počet uživatelů | MANAGE_USERS (2) | Počet všech uživatelů vrácených funkcí `fetchUsersForAdmin`, omezený na vaši roli a organizaci |
| Aktivní uživatelé | MANAGE_USERS (2) | Počet uživatelů, jejichž role je vyšší než pouhý USER |
| Celkový počet produktů | MANAGE_PRODUCTS (8) | Celkový počet produktů pro organizaci |
| Aktivní produkty | MANAGE_PRODUCTS (8) | Počet produktů se statusem `active` |
| Celkový počet objednávek | MANAGE_ORDERS (32) | Celkový počet objednávek pro organizaci |
| Příjmy (tento měsíc) | MANAGE_ORDERS (32) nebo MANAGE_REPORTS (512) | Součet `total_amount` z objednávek vytvořených od 1. dne aktuálního měsíce |

Příjmy jsou formátovány v měně organizace.
Pro [Kytka z Beskyd](/docs/admin/parties) to znamená CZK.

## Přehled produktů

Pokud můžete spravovat produkty a jsou k dispozici údaje o přehledu, pod panely se vykreslí sekce **Přehled produktů**.
Je sestaven z `fetchProductOverview` (okno 30 dnů) plus feedu `fetchProductActivityLog` (40 nejnovějších událostí produktů) a zobrazuje agregované statistiky produktů a časovou osu nedávných aktivit.

## Nedávné objednávky a příjmy

Když můžete spravovat objednávky nebo prohlížet zprávy, objeví se dvoukolumní mřížka.

- **Nedávné objednávky** (vyžaduje MANAGE_ORDERS): tabulka posledních 5 objednávek s sloupci Číslo objednávky (odkazuje na [detail objednávky](/docs/admin/orders)), Stav, Celkem a Datum.
  Stav je zobrazen jako barevný odznak: čekající je jantarový, potvrzený / zaslaný / dodaný je zelený, v zpracování je návrh/šedý odznak a zrušený je červený.
  Vrácený a jakýkoli neznámý stav se vrátí k neutrálnímu odznaku.
  Pokud nejsou žádné objednávky, místo tabulky se zobrazí zpráva v prázdném stavu.
- **Panel příjmů** (vyžaduje MANAGE_ORDERS nebo MANAGE_REPORTS): aktuálně je to náhranná krabice, která uvádí, že graf brzy dorazí.

## Nedávná aktivita

Pokud máte MANAGE_AUDIT (4096), na dole se vykreslí karta **Nedávná aktivita**.
Dnes zobrazuje náhranný prázdný stav; kompletní [protokol auditu](/docs/admin/audit) je vyhrazenou stránkou pro tato data.

## Data a úložiště (cloud)

- `profiles` a `parties` přes `requireAdminCtx`.
- Dotazy na počet `categories` a `products` (používá se pro přesměrování a banner nástupu).
- `fetchUsersForAdmin` čte `profiles` (a členství) pro KPI uživatelů.
- `fetchProducts` čte `products` pro KPI produktů.
- `fetchOrders` čte `orders` pro tabulku nedávných objednávek a součet měsíčních příjmů.
- `fetchProductOverview` a `fetchProductActivityLog` čtou statistiky produktů a protokol aktivit produktů.
- Stránka nic nepisuje.

## Související stránky

- [Oznámení](/docs/admin/notifications) - cílová stránka při chybějícím VIEW_DASHBOARD
- [Nástup](/docs/admin/onboarding) - kam jsou administrátoři posláni, když je jejich katalog prázdný
- [Objednávky](/docs/admin/orders) - plná správa objednávek za tabulkou nedávných objednávek
- [Zprávy](/docs/admin/reports) - podrobná zpráva o příjmech a prodeji
- [Produkty](/docs/admin/products) - katalog za KPI produktů a přehledem
- [Organizace](/docs/admin/parties) - vytvoření nebo přepnutí organizace, o kterou zprávy na nástěnce uvádí
