# Bod 2: Fakturační období + reálné náklady/výdělek/odvod

Branch: `feat/eshop-billing-periods` (base: `master`).
Worktree: `.claude/worktrees/eshop-billing-periods`.

## Analýza

Prohledal jsem `website/src/pages/admin/`, `supabase/migrations/` a `shared/`.
Platforma už měla poměrně rozvinutou billing infrastrukturu z dřívějška:

- `monthly_platform_fees` (migrace `20260103000072`) - měsíční odvod pro `own_company` eshopy,
  10 % z obratu s měsíčním stropem `MONTHLY_COMMISSION_CAP_CZK` = 2990 Kč.
  Počítá se cronem (`20260103000073`), logika v `shared/services/monthlyFeeService.ts`.
  Neobsahuje reálné náklady, jen obrat a odvod.
- `order_commission_ledger` (migrace `20260103000058`, rozšířená `20260103000074`) - per-objednávka
  odvod pro `smalljobs_commission` (bez IČO) eshopy, 30 % s měsíčním limitem výplaty 12 000 Kč.
- `/admin/billing` - cross-party přehled aktuálního měsíce (jen "tento měsíc", žádná historie,
  žádné reálné náklady).
- `/admin/payouts` - per-party detail ledgeru/fees, s akcí "označit jako zaplaceno".
- `/admin/reports` - toto je ten "list v overview", který uživatel myslel.
  Má kartu "Revenue" s hrubým obratem (měsíc/rok) a **neaktivní tlačítko "Exportovat CSV"**
  (`disabled`) a placeholder "Graf brzy k dispozici". Jasný nedodělek přesně odpovídající
  zadání "již máme list v overview, teď ho potřebujeme dodělat".
- Reálné náklady (COGS, refundy, poškozené zboží) už existují jako koncept v
  `get_product_overview_stats()` (migrace `20260103000053`) pro dashboard "Products overview",
  ale jen jako klouzavé okno posledních N dní, ne pro kalendářní měsíc a ne exportovatelné.
- `products.cost_price` (migrace `20260103000052`) je zdroj nákupní ceny pro COGS.
- `shared/constants/sellerMode.ts` už obsahuje `COMMISSION_RATE` (0.1) a
  `MONTHLY_COMMISSION_CAP_CZK` (2990) jako "Phase 1 - not yet enforced" konstanty s explicitní
  poznámkou, že "Phase 2 (separate, reviewed change)" má rozhodnout přepínání mezi nimi -
  to je přesně bod 5 z pipeline.

Závěr: existující řešení pokrývá "kolik má eshop zaplatit nám", ale ne "co si eshop může
stáhnout pro daň z příjmů za kalendářní měsíc, včetně reálných nákladů a s možností nastavit
režim odvodu". To je mezera, kterou tento bod zaplňuje - nová datová vrstva navazující na
`/admin/reports`, nekonkurující stávajícímu `monthly_platform_fees`/`order_commission_ledger`
platebnímu workflow (ten zůstává beze změny).

## Implementační plán

Nová tabulka `eshop_billing_periods` (1 řádek na e-shop a kalendářní měsíc):

- `period_start` / `period_end` - skutečné hranice kalendářního měsíce (28-31 dní), ne pevných 30.
- `gross_revenue` - hrubý obrat (suma zaplacených objednávek v období).
- `real_costs` - COGS prodaného zboží + dokončené reklamace + poškozené zboží v období.
- `net_revenue` = `gross_revenue - real_costs`.
- `fee_mode` (`percentage` / `fixed` / `ledger`) - nastavitelné per eshop a měsíc.
- `fee_amount` - odvod platformě podle zvoleného režimu.
- `net_payout` = `net_revenue - fee_amount` - reálný čistý výdělek eshopu.
- `status` (`draft` / `finalized`) - měsíc se "uzavře" až po jeho skutečném konci, do té doby
  jde přepočítat.

Nová SQL funkce `get_billing_period_totals(party_id, range_start, range_end)` (SECURITY DEFINER,
stejný vzor jako existující `get_product_overview_stats`) - agreguje přes `orders`, `order_items`,
`products`, `return_requests`, `stock_movements`, `order_commission_ledger`, s vlastní kontrolou
oprávnění (`MANAGE_REPORTS`), takže funguje i pro uživatele bez `MANAGE_ORDERS`/`MANAGE_PRODUCTS`.

UI: rozšíření `/admin/reports` o sekci "Fakturační období" (tabulka + CSV export), ne nová
stránka - žádná změna Sidebar.astro nebyla potřeba (perm bit `MANAGE_REPORTS` už tam gate).

## Coding plán

1. `shared/utils/money.ts` - haléřová konverze (Kč × 100 jako integer).
2. `shared/utils/billingPeriod.ts` - kalendářní měsíc (hranice, poslední den, "je uzavřeno").
3. `shared/utils/billingFeeCalc.ts` - čistý výpočet gross → real costs → fee → net, 3 režimy.
4. Migrace `supabase/migrations/20260103000078_eshop_billing_periods.sql` - tabulka, RLS, RPC.
5. `shared/services/billingPeriodService.ts` - `listBillingPeriods`, `recomputeBillingPeriod`
   (upsert, idempotentní, respektuje `finalized`), `setBillingPeriodFeeMode`.
6. `website/src/components/admin/BillingPeriodsSection.astro` - tabulka + formulář na fee_mode
   + tlačítko přepočtu (jen pro `MANAGE_AUDIT`) + odkaz na CSV export.
7. `website/src/pages/admin/reports/index.astro` - napojení služby, POST akce, auto-zajištění
   aktuálního měsíce při načtení stránky.
8. `website/src/pages/admin/reports/billing-periods.csv.ts` - CSV export (hrubá i reálná čísla
   v jednom souboru), stejný vzor jako existující `admin/settings/newsletter/export.csv.ts`.
9. i18n klíče `admin.reports.billingPeriods.*` v `cs.ts` a `en.ts`.
10. Jest testy pro (2) a (3).

## Implementace - co bylo uděláno

Všechny soubory z coding plánu jsou hotové:

- `supabase/migrations/20260103000078_eshop_billing_periods.sql`
- `shared/utils/money.ts`, `shared/utils/billingPeriod.ts`, `shared/utils/billingFeeCalc.ts`
- `shared/services/billingPeriodService.ts`
- `website/src/components/admin/BillingPeriodsSection.astro`
- `website/src/pages/admin/reports/index.astro` (rozšířeno)
- `website/src/pages/admin/reports/billing-periods.csv.ts`
- `shared/i18n/locales/cs.ts`, `shared/i18n/locales/en.ts`
- `mobile/src/__tests__/sharedServices/billingPeriod.test.ts`
- `mobile/src/__tests__/sharedServices/billingFeeCalc.test.ts`

### Klíčová rozhodnutí a jejich zdůvodnění

**Peníze v halířích jako integer.**
Zbytek kódové báze ukládá peníze jako `NUMERIC(12,2)` (přesný decimal, ne float) a počítá
v JS pomocí `Math.round(x * 100) / 100` po každém kroku (`monthlyFeeService.ts`,
`commissionLedgerService.ts`, `tax.ts`).
Zavedení nového celočíselného typu sloupce jen pro tuto tabulku by rozbilo konzistenci a
vynutilo konverze na každém spojení s `orders.total_amount` apod.
Zachoval jsem tedy `NUMERIC(12,2)` ve schématu (to je beztak přesný decimal, ne float), ale
`shared/utils/billingFeeCalc.ts` interně provádí VŠECHNY mezivýpočty (gross, real costs, fee,
net) v celočíselných halířích (`kcToHaleru`/`haleruToKc`) a zaokrouhluje jen jednou na konci
každého kroku - to je striktnější než zbytek kódové báze a přesně naplňuje požadavek "pracuj v
halířích jako integer".

**`fee_mode` bez automatického přepínání.**
`percentage` = čistě 10 % z obratu (bez stropu), `fixed` = čistě fixní paušál 2990 Kč.
Vědomě jsem NEPŘEVZAL `Math.min(turnover*rate, cap)` logiku z `monthlyFeeService.ts` - ta
kombinace obou vzorců do jednoho je přesně to rozhodnutí "kdy přepnout", které má podle
zadání implementovat až bod 5.
Tento bod jen ukládá, který režim je pro daný eshop/měsíc aktuálně nastavený, a počítá podle
něj - `fee_mode` lze změnit ručně přes UI (`BillingPeriodsSection.astro` → formulář →
`setBillingPeriodFeeMode`).

**`ledger` režim pro `smalljobs_commission` eshopy.**
Tyto eshopy už platí odvod průběžně za každou objednávku (`order_commission_ledger`, 30 %).
Nevytvářel jsem pro ně druhý, konkurenční měsíční platební mechanismus - `fee_amount` pro
`ledger` režim je jen informativní součet `commission_amount` z ledgeru za daný měsíc, needitovatelný
(v UI se místo přepínače zobrazí poznámka). Reálné náklady (COGS/refundy/poškození) se ale
počítají stejně pro OBA režimy prodeje, protože daň z příjmů potřebuje mít čísla každý eshop,
bez ohledu na to, jak platí nás.

**Zápisy (přepočet, změna fee_mode) jdou přes `createAdminClient()` (service role), ne přes
běžný RLS klient.**
Stejný vzor jako cron pro `monthly_platform_fees`. RLS politika "Auditors write billing periods"
vyžaduje `MANAGE_AUDIT` - v aplikačním kódu se ale tato práva kontrolují EXPLICITNĚ před tím,
než se service-role klient vůbec použije (`canManageBilling` guard v `reports/index.astro`),
aby uživatel jen s `MANAGE_REPORTS` (bez `MANAGE_AUDIT`) nikdy nespustil zápis ani nepřímo.

**Umístění UI.**
Rozšířil jsem existující `/admin/reports` (přesně to "dodělej list v overview") místo nové
stránky. Nebyla proto potřeba změna `Sidebar.astro` ani nový permission bit - `MANAGE_REPORTS`
(512) už tuto stránku gatuje a sedí sémanticky ("reporty/export dat").

## Testy

- `cd website && pnpm typecheck` → **prošlo bez chyb** (exit code 0).
- `cd mobile && pnpm typecheck` → **prošlo bez chyb** (exit code 0).
- `npx eslint` na všechny nově vytvořené/upravené `.ts`/`.astro` soubory → 0 chyb (jen
  preexistující "no-explicit-any" warningy stejného stylu jako zbytek kódové báze, a
  prettier formátovací warningy v testech, které jsem opravil pomocí `--fix`).
- **Jednotkové testy jsou napsané** (`billingPeriod.test.ts` - konec měsíce pro 28/29/30/31
  dní vč. přestupného roku a stoletých výjimek 1900/2000; `billingFeeCalc.test.ts` - hrubý →
  reálné náklady → odvod → čistý pro všechny 3 režimy vč. zaokrouhlení), ale **`pnpm test` v
  `mobile/` v tomto worktree momentálně nejde spustit** - selže i preexistující, dřív fungující
  test (`variantInventory.test.ts`) se stejnou chybou
  (`[BABEL] .../react-native-env.js: .plugins is not a valid Plugin property`), tedy jde o
  prostředí (verze `jest-expo`/`react-native`/`@babel/core` po instalaci závislostí v tomto
  worktree), ne o problém způsobený touto změnou.
  Log dokazující preexistenci: stejná chyba na neupraveném testu.
  **Náhradní ověření**: spustil jsem identické assertions přes `npx tsx` přímo proti zdrojovým
  `.ts` souborům (bez jest) - všech 29 assertions prošlo (viz níže "Jak ověřit" pro reprodukci).
  Toto NENÍ náhrada za skutečný `pnpm test` běh a je potřeba to prověřit/opravit, jakmile bude
  prostředí funkční - netvrdím, že jsem Jest test suite spustil zeleně, protože jsem ho
  nespustil.
- **DB migrace ověřena přímo proti běžícímu lokálnímu Supabase** (docker, port 54322) uvnitř
  `BEGIN; ... ROLLBACK;` transakce (žádná trvalá změna, nic jsem needitoval v `supabase db push`
  historii):
  - Migrace se aplikuje bez chyby (všechny reference na `parties`, `orders`, `order_items`,
    `products`, `return_requests`, `stock_movements`, `inventory_items`,
    `order_commission_ledger`, `is_owner()`, `user_has_permission()`, `update_updated_at()`
    existují).
  - `get_billing_period_totals()` zavolána jako přihlášený owner (`SET LOCAL role authenticated`
    + `request.jwt.claim.sub`) proti reálným seedovaným datům (`Repasado`, září 2026) vrátila
    správný `gross_revenue = 57559.00` odpovídající skutečné zaplacené objednávce v datech.
  - INSERT + SELECT do `eshop_billing_periods` jako owner prošel (RLS politiky fungují).
- **`./scripts/db-push.sh development` jsem NEspustil** - shared lokální dev DB (sdílená mezi
  souběžnými worktrees dle poznámky v paměti `project_shared_local_supabase_worktrees`) už má
  aplikovanou migraci `20260103000079` z jiného souběžně běžícího bodu pipeline, která v tomto
  branch/worktree ještě neexistuje (`git worktree` byl založen z `master` před tím, než ten jiný
  bod svou migraci přidal).
  `supabase db push` proto skončí chybou `LegacyDbPushMissingLocalError` a navrhuje
  `migration repair` - to jsem VĚDOMĚ neudělal, protože by to mohlo poškodit historii migrací
  patřící jinému souběžně pracujícímu bodu.
  Migrace v tomto branch je hotová a syntakticky/logicky ověřená (viz výše), ale zůstává
  nepushnutá do sdílené dev DB - to je v pořádku, protože branch se stejně nemerguje
  automaticky.
- **`shared/supabase/types.ts` jsem NEregeneroval** ze stejného důvodu (vyžaduje push migrace
  do živé DB). Všechny nové soubory ale záměrně používají netypovaný `SupabaseClient` (stejný
  vzor jako `monthlyFeeService.ts`/`commissionLedgerService.ts`), takže `pnpm typecheck` na
  tom nezávisí a prošel čistě.
- **Vizuální ověření UI v prohlížeči jsem NEDĚLAL** - nemám v tomto běhu k dispozici browser
  tooling ani nasazený dev server s vyplněnými env proměnnými (`.env.development` v tomto
  worktree chybí, `.gitignore`d). Nutno ověřit ručně - viz postup níže.

## Jak ručně otestovat

1. `cd .claude/worktrees/eshop-billing-periods`
2. Zkopírovat/vyplnit `.env.development` (podle `.env.development.example`), pak
   `./scripts/db-push.sh development` (poté co se worktree rebasuje na aktuální shared DB
   stav, nebo se migrace ručně přehraje na čistou DB).
3. `supabase gen types > shared/supabase/types.ts`
4. `cd website && pnpm dev`, přihlásit se jako owner/admin s `MANAGE_REPORTS` (a pro editaci
   `MANAGE_AUDIT`), otevřít `/admin/reports`.
5. Nasimulovat testovací objednávky v konkrétním měsíci přímo v DB (příklad pro září 2026,
   party `a0000000-0000-0000-0000-000000000001` = Repasado, upravit `party_id`/`customer_id`
   podle skutečných dat):

```sql
insert into orders (party_id, customer_id, status, payment_status, subtotal, tax_amount, total_amount, currency, paid_at)
values (
  'a0000000-0000-0000-0000-000000000001',
  (select id from customers where party_id = 'a0000000-0000-0000-0000-000000000001' limit 1),
  'delivered', 'paid', 10000, 0, 10000, 'CZK', '2026-09-15T10:00:00Z'
);
```

   Přidat i `order_items` s `product_id` odkazujícím na produkt s nastaveným `cost_price > 0`,
   aby šlo vidět nenulové reálné náklady (COGS) v přepočtu.
6. Na `/admin/reports` dole zkontrolovat sekci "Fakturační období" - řádek pro září 2026 by měl
   po refreshi (auto-recompute při GET) ukazovat aktualizovaný hrubý obrat.
7. Vyzkoušet přepnutí `fee_mode` (percentage ↔ fixed) u aktuálního měsíce a ověřit, že se
   `Odvod platformě` a `Čistý výdělek` přepočítají podle zvoleného vzorce.
8. Stáhnout CSV přes tlačítko "Exportovat CSV" a zkontrolovat, že obsahuje jak
   `gross_revenue`, tak `net_payout` sloupce.
9. Ověřit, že uživatel jen s `MANAGE_REPORTS` (bez `MANAGE_AUDIT`) vidí tabulku a export, ale
   NEVIDÍ tlačítka "Přepočítat"/select na fee_mode (per RLS + `canWrite` prop).

## Rizika a otevřené hrany

- **Souběh přepočtu s právě probíhající platbou** - `recomputeBillingPeriod` čte `orders` v
  okamžiku volání; pokud se platba potvrdí těsně po přepočtu, číslo se aktualizuje až při
  dalším načtení stránky (auto-recompute na GET) nebo ručním tlačítku "Přepočítat". Není to
  realtime - pro účel měsíčního reportu je to v pořádku, ale stojí za zmínku.
- **`finalized` stav se nikdy automaticky "znovu neotevře"** - pokud by se objednávka z uzavřeného
  měsíce dodatečně refundovala, čísla v `eshop_billing_periods` zůstanou stará, dokud někdo s
  `MANAGE_AUDIT` ručně nezmáčkne "Přepočítat" (`forceRecompute`). To je záměr (ochrana proti
  tichému přepisu už staženého daňového podkladu), ale mělo by to být zdokumentované i pro
  uživatele platformy, ne jen v review.
- **Currency** - `get_billing_period_totals` bere měnu z první nalezené zaplacené objednávky
  v období; pokud eshop nemá v daném měsíci žádnou objednávku, defaultuje na `CZK`. Platforma
  aktuálně pracuje jen s CZK (viz `sellerMode.ts`), takže to není akutní problém.
- **PDF export není implementován** - zadání zmiňuje "CSV/PDF export", udělal jsem jen CSV
  (standardní, strojově zpracovatelný formát pro daňové přiznání/účetní).
  PDF by přidalo netriviální závislost (rendering) a nepůsobí jako nutná podmínka pro "mít data
  k dani z příjmů" - CSV to zajišťuje. Pokud je PDF opravdu potřeba, navrhuji ho jako
  samostatný, menší follow-up.
- **`pnpm test` v mobile/ nejde v tomto worktree spustit** (viz sekce Testy) - je potřeba
  opravit prostředí (verze babel/jest-expo) nezávisle na tomto bodu, jinak nejde potvrdit
  zeleně ani stávající, dřív fungující testy.
- **Migrace nebyla pushnuta do sdílené lokální dev DB** kvůli konfliktu s jiným souběžným
  bodem pipeline - kdokoliv bude tento branch integrovat, musí nejdřív vyřešit pořadí migrací
  (rebase na aktuální `master`/sdílenou historii) a pak spustit `db-push.sh` + `gen types`.

## Co necháváš pro bod 5 (auto přechod 10 % / fixní 2990 Kč)

- Rozhodovací logika KDY použít `percentage` vs `fixed` pro `own_company` eshop v daném měsíci
  (např. "použij tu levnější variantu" nebo "přepni při překročení `COMMISSION_BREAK_EVEN_CZK`
  obratu") - `computeBillingPeriodTotals()` v `shared/utils/billingFeeCalc.ts` počítá OBA vzorce
  nezávisle, bod 5 může snadno přidat funkci, která vybere `fee_mode` automaticky a zavolá
  `recomputeBillingPeriod(..., { feeMode: <auto-vybraný> })`.
- Sjednocení tří dnes paralelně existujících peněžních cest: (a) `monthly_platform_fees` +
  cron (starý mechanismus, stále živý, s vlastním `Math.min(turnover*rate, cap)`), (b)
  `order_commission_ledger` per-objednávka odvod, (c) nová `eshop_billing_periods` reportovací
  vrstva. Bod 5 by měl rozhodnout, jestli `monthly_platform_fees` zůstane jako platební
  workflow a `eshop_billing_periods` jen jako reporting nad ním, nebo jestli se mají sloučit.
- Automatické vytváření/aktualizace `fee_mode` na základě historie eshopu (např. "eshop
  přešel na fixní paušál po 3 měsících nad breakpointem").

## Co necháváš pro bod 6 (audit fakturační distribuce)

- Nezávislé přepočítání/ověření správnosti čísel v `eshop_billing_periods` proti primárním
  datům (cross-check `gross_revenue` vs. suma `orders`, atd.) jako opakovaný audit proces.
- Detekce anomálií (např. eshop s `net_payout` dlouhodobě záporným ve `fixed` režimu).
- Historie změn `fee_mode` (kdo a kdy přepnul režim per eshop/měsíc) - aktuálně se změna jen
  přepíše, bez auditní stopy kdo/kdy/proč. Stojí za zvážení přidat `changed_by`/`changed_at`
  sloupce nebo log tabulku, pokud to bod 6 bude potřebovat.
