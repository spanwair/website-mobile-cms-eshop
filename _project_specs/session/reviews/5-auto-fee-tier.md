# Bod 5: Automatický přechod mezi 10 % a fixním paušálem 2990 Kč

Branch: `feat/auto-fee-tier` (base: `feat/eshop-billing-periods`, bod 2).
Worktree: `.claude/worktrees/auto-fee-tier`.

## Analýza

### Datový model z bodu 2, na kterém stavím

`eshop_billing_periods` (migrace `20260103000078`) je jeden řádek na e-shop a kalendářní
měsíc, se sloupcem `fee_mode` (`percentage` / `fixed` / `ledger`), `gross_revenue`,
`real_costs`, `net_revenue`, `fee_amount`, `net_payout`, `status` (`draft` / `finalized`).

Klíčové funkce z bodu 2, které znovu použiji beze změny (žádná duplicitní logika):

- `shared/utils/billingPeriod.ts` - `getCalendarMonthPeriod`, `previousCalendarMonth`,
  `isPeriodElapsed` - přesně to, co potřebuji pro "1. den měsíce, za právě uzavřené období".
- `shared/utils/billingFeeCalc.ts` - `computeBillingPeriodTotals` počítá OBA vzorce
  (percentage/fixed) podle zadaného `feeMode` - já jen musím ROZHODNOUT, který `feeMode` použít.
- `shared/services/billingPeriodService.ts` - `recomputeBillingPeriod(client, partyId, year,
  monthIndex0, { feeMode, forceRecompute })` - přesně ten zápisový mechanismus, který potřebuji.
  Volá se stejně z ruční admin akce (`/admin/reports` POST) i teď z mého cron jobu - jedna
  cesta zápisu pro obojí.
- `shared/constants/sellerMode.ts` - `COMMISSION_BREAK_EVEN_CZK = MONTHLY_COMMISSION_CAP_CZK /
  COMMISSION_RATE = 2990 / 0.1 = 29900` - PŘESNĚ ten práh ze zadání ("nad 29900"). Nikde
  nehardcoduji `29900`, importuji tuto konstantu.

### Cron/scheduled job vzor - už existuje, žádné Supabase Edge Functions

`supabase/functions/` obsahuje jen `delete-account` a `hello-template` - žádný cron precedent.
Skutečný vzor pro "spusť se 1. dne měsíce" už existuje dvakrát v repu a NEPOUŽÍVÁ Supabase Edge
Functions, ale `pg_cron` + `pg_net` volající vlastní Astro API route chráněnou sdíleným
tajemstvím (`x-cron-secret` header, `CRON_SECRET` env):

- `supabase/migrations/20260103000073_monthly_fee_cron.sql` → `POST
  /api/cron/monthly-platform-fees` (`website/src/pages/api/cron/monthly-platform-fees.ts`),
  spouští se `0 3 1 * *` (1. den měsíce, 03:00 UTC), počítá **předchozí** měsíc.
- `supabase/migrations/20260103000076_shipment_status_cron.sql` → `POST
  /api/cron/refresh-shipment-statuses`, každých 30 minut.

Důvod (zdokumentovaný přímo v migraci 73): byznys logika má žít na jednom místě
(`shared/services/*`) vedle veškeré ostatní fee logiky, a stejné volání pak může poslat i email
přes existující Resend integraci - to `pg_net`/`pg_cron` samotné neumí. Přesně tento vzor
použiji: nová migrace přidá `cron.schedule('auto-fee-tier-transition', '15 3 1 * *', ...)`
volající novou route `/api/cron/auto-fee-tier` (posunuto o 15 minut oproti
`monthly-platform-fees`, aby se nekryly, ne že by to bylo nutné, ale je to zbytečné riziko
souběhu zadarmo).

### Notifikační systém - `/admin/notifications`

`notifications` + `user_notifications` (migrace `20260102000004`) - `notifications.type` je
Postgres ENUM (`low_inventory`, `new_order`, `failed_payment`, `new_registration`,
`system_alert`, `role_invitation`). `shared/services/notificationService.ts` má
`createNotification(client, input, userIds)` (insert + fanout do `user_notifications`) a
`fetchUserNotifications` - to je přesně datový zdroj `/admin/notifications/index.astro`.
**`createNotification` nemá dosud ŽÁDNÉHO volajícího v celém repu** - je to hotová, ale zatím
nepoužitá infrastruktura. Budu jejím prvním skutečným volajícím.

Fanout vzor (kdo dostane notifikaci) už existuje v `notify_low_stock()` (migrace
`20260103000020`, DB trigger): globální ownery (`profiles.role = 8`) SJEDNOCENÉ s členy dané
party s `role >= 2` (`user_party_roles JOIN profiles`). Použiji stejnou logiku, ale v JS
(`resolvePartyNotificationRecipients` v `notificationService.ts`), protože moje volání
nepřichází z DB triggeru, ale z cron API route (service-role klient) - a service-role klient
obchází RLS úplně (`BYPASSRLS`), takže žádná speciální SQL funkce není potřeba, stačí přímé
`SELECT`y stejným klientem.

Přidávám novou hodnotu enumu `notification_type` = `'fee_tier_change'` (`ALTER TYPE ... ADD
VALUE IF NOT EXISTS`). `/admin/notifications/index.astro` zobrazuje `n.type` přímo (monospace
sloupec) bez i18n mapování typu, takže žádná změna té stránky není potřeba.

### Email mechanismus

`website/src/lib/integrations/email.ts` - Resend, s dev fallbackem (`console.log`, pokud chybí
`RESEND_API_KEY`). Existuje přesný precedent pro "měsíční informativní email eshopu" -
`sendMonthlyFeeNotice` (volaná z `/api/cron/monthly-platform-fees`) a `sendPayoutLimitReached`.
Přidám `sendFeeTierChangeNotice` stejným stylem (stejná HTML struktura, `getT(lang)`,
`formatPrice`, dev-fallback `console.log`). Email jde na `parties.billing_email` (stejné pole
jako `monthlyFeeService.ts` používá), jazyk z `parties.lang` (migrace `20260103000077`).

### KRITICKÝ Nález: `get_billing_period_totals()` je nevolatelná ze service-role klienta (bug z bodu 2)

Můj cron job potřebuje zjistit hrubý obrat za právě uzavřený měsíc **stejnou agregační logikou**
jako bod 2 (COGS, refundy, poškození - ne duplikovat SQL v JS). Jediný existující zdroj té
logiky je SQL funkce `get_billing_period_totals(p_party_id, p_range_start, p_range_end)`
(SECURITY DEFINER), volaná přes `client.rpc(...)`.

Ověřil jsem přímo proti běžící lokální Supabase (docker, port 54322, `BEGIN; ... ROLLBACK;`,
žádná trvalá změna):

```sql
BEGIN;
SELECT current_setting('request.jwt.claims', true) AS jwt_claims;  -- prázdné (žádný JWT nastaven)
SELECT auth.uid()    AS uid_no_claims;    -- NULL
SELECT is_owner()    AS is_owner_no_claims;  -- false
ROLLBACK;
```

Toto přesně simuluje, co se stane, když `get_billing_period_totals` zavolá `createAdminClient()`
(service-role klient) - service-role JWT nemá claim `sub`, takže `auth.uid()` je `NULL`,
`is_owner()` i `user_has_permission(NULL, ...)` vrátí `false`, a funkce vyhodí
`RAISE EXCEPTION 'insufficient_permission'`.

**A `recomputeBillingPeriod` (bod 2) volá TUTO RPC VÝHRADNĚ přes `createAdminClient()`** - jak
z automatického přepočtu při GET na `/admin/reports`, tak z ruční akce "Přepočítat"/"Uložit" v
`BillingPeriodsSection.astro`. Znamená to, že **celá funkce "Fakturační období" z bodu 2 v
současné podobě při běhu v prohlížeči vždy selže** (chyba se v `reports/index.astro` nikde
nekontroluje - `await recomputeBillingPeriod(...)` bez kontroly `error`, takže selže tiše a
tabulka zůstane prázdná/needchronizovaná). Bod 2 to nezachytil, protože jejich manuální test byl
proti `get_billing_period_totals` voláno jako přihlášený owner (`SET LOCAL role authenticated`),
ne skutečnou service-role cestou, kterou `reports/index.astro` doopravdy používá, a vizuální
test v prohlížeči neproběhl (bylo to v jejich review otevřeně přiznáno).

**Toto opravuji jako součást bodu 5**, protože bez toho nejde vůbec zavolat
`get_billing_period_totals` z mého cron jobu (service-role kontext) - a je to přesně ten typ
nálezu, který mám podle instrukcí opravit i mimo svůj primární úkol. Ověřil jsem funkční opravu:

```sql
BEGIN;
SELECT set_config('request.jwt.claims', '{"role":"service_role"}', true);
SELECT auth.role() AS role_service, auth.uid() AS uid_service;
-- role_service = 'service_role', uid_service = NULL
ROLLBACK;
```

`auth.role()` (GoTrue funkce) správně vrací `'service_role'`, i když `auth.uid()` je `NULL` -
na rozdíl od `anon`/`authenticated` volajících, kde `auth.role()` vrátí `'anon'`/`'authenticated'`.
Bezpečná, přesná podmínka: přidat `OR auth.role() = 'service_role'` do permission-check uvnitř
`get_billing_period_totals` (nová migrace, `CREATE OR REPLACE FUNCTION` - nemodifikuji už
existující commitnutou migraci `20260103000078`). Toto NEOTEVÍRÁ přístup pro `anon`/
`authenticated` volající (ti mají svou vlastní `auth.role()` hodnotu, nikdy `'service_role'` -
service-role klíč je tajný, nikdy neopouští server).

## Implementační plán

1. **Migrace `supabase/migrations/20260103000079_auto_fee_tier.sql`**:
   - `ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'fee_tier_change';`
   - Oprava `get_billing_period_totals` (viz výše - `CREATE OR REPLACE FUNCTION`, přidání
     `auth.role() = 'service_role'` do permission checku, jinak beze změny).
   - Nová tabulka `eshop_fee_tier_events` - auditní historie KAŽDÉHO vyhodnocení (i beze změny,
     to je klíč pro idempotenci):
     `id, party_id, period_start, previous_fee_mode, new_fee_mode, changed (bool),
     gross_revenue, threshold_amount, notified_in_app (bool), notified_email (bool),
     created_at`. `UNIQUE (party_id, period_start)` - **toto je idempotenční pojistka**: druhý
     běh cronu pro stejné období narazí na `23505 unique_violation` při INSERTu a nic dalšího
     neudělá.
   - RLS: `SELECT` pro `authenticated` s `MANAGE_REPORTS` (512) nebo owner (stejné jako
     `eshop_billing_periods`, aby šla historie později zobrazit v UI). **Žádná INSERT/UPDATE
     politika pro `authenticated`** - záměrně, tabulka je zapisovatelná jen service-role klientem
     (přes `ALTER DEFAULT PRIVILEGES ... TO service_role` z migrace `20260103000023`), aby ji
     nemohl přepsat/zfalšovat ani uživatel s `MANAGE_AUDIT`.
   - `cron.schedule('auto-fee-tier-transition', '15 3 1 * *', ...)` → `POST
     /api/cron/auto-fee-tier`, stejný `x-cron-secret` vzor jako existující cron joby.

2. **`shared/utils/billingFeeCalc.ts`** (rozšíření, ne nový soubor) - čistá funkce
   `decideAutoFeeMode(grossRevenueKc): "percentage" | "fixed"`, srovnání v halířích
   (`kcToHaleru(gross) > kcToHaleru(COMMISSION_BREAK_EVEN_CZK)`), striktní `>` (29900 zůstává
   percentage, 29901 přepne). Nezávisle jednotkově testovatelná bez DB.

3. **`shared/services/feeTierService.ts`** (nový soubor) -
   `evaluateFeeTierForClosedPeriod(client, party, year, monthIndex0)`:
   - Guard: `isPeriodElapsed` musí být `true`, jinak throw (nikdy nevyhodnocuj neuzavřený měsíc).
   - `getCurrentFeeTier(client, partyId)` - poslední `new_fee_mode` z `eshop_fee_tier_events`
     (`ORDER BY period_start DESC LIMIT 1`), default `'percentage'`, pokud historie neexistuje.
   - `get_billing_period_totals` RPC pro hrubý obrat uzavřeného měsíce.
   - `decideAutoFeeMode(grossRevenueKc)` → `newFeeMode`.
   - `recomputeBillingPeriod(client, partyId, year, monthIndex0, { feeMode: newFeeMode,
     forceRecompute: true })` - **stejná zápisová cesta jako ruční UI akce v bodě 2**, žádná
     druhá implementace fee výpočtu.
   - INSERT do `eshop_fee_tier_events` JAKO POSLEDNÍ krok - to je idempotenční brána (viz Coding
     plán, bod "Idempotence" níže).

4. **`shared/services/notificationService.ts`** (rozšíření) -
   `resolvePartyNotificationRecipients(client, partyId)` (owner-fanout stejný jako
   `notify_low_stock`, jen v JS pro service-role kontext) + rozšíření typu parametru
   `createNotification`'s `input` z přísného generovaného `Database["public"]["Tables"]
   ["notifications"]["Insert"]` na vlastní `NewNotificationInput` (řetězcový `type`) - jinak
   nejde přidat `'fee_tier_change'` bez regenerace `shared/supabase/types.ts`, kterou (stejně
   jako bod 2) nemohu bezpečně spustit proti sdílené dev DB (viz Rizika). `createNotification`
   dosud nemá ŽÁDNÉHO volajícího v repu, takže rozšíření typu je bez rizika pro existující kód.

5. **`website/src/pages/api/cron/auto-fee-tier.ts`** (nová route) - stejná kostra jako
   `monthly-platform-fees.ts`: ověření `x-cron-secret`, načtení `own_company` + `active` parties,
   pro každou zavolat `evaluateFeeTierForClosedPeriod`, a POUZE pokud `changed === true` a
   `alreadyEvaluated === false`: vytvořit in-app notifikaci (`createNotification` +
   `resolvePartyNotificationRecipients`) a poslat email (`sendFeeTierChangeNotice`), pak
   označit `notified_in_app`/`notified_email` v `eshop_fee_tier_events`.

6. **`website/src/lib/integrations/email.ts`** (rozšíření) - `sendFeeTierChangeNotice` ve stylu
   `sendMonthlyFeeNotice`/`sendPayoutLimitReached`.

7. **i18n** - `shared/i18n/locales/en.ts` + `cs.ts`, nová sekce `email.feeTierChange.*`
   (subject/heading/oba směry přechodu + krátké texty pro in-app title/body, sdílené se stejnou
   sekcí, ne trojitá duplicita textů).

8. **Testy** - `mobile/src/__tests__/sharedServices/decideAutoFeeMode.test.ts` (hranice 29900 /
   29901, i opačný směr) + rozšíření `billingFeeCalc.test.ts` pokud se hodí přidat pokrytí přímo
   tam místo nového souboru (rozhodnu při psaní, ať soubor nepřekročí 200 řádků).

## Coding plán

1. Migrace `20260103000079_auto_fee_tier.sql` - napsat, ověřit v `BEGIN; ... ROLLBACK;` proti
   sdílené lokální DB (stejná technika jako bod 2 - `db-push.sh` NEspouštět, viz Rizika).
2. `decideAutoFeeMode` v `billingFeeCalc.ts`.
3. `shared/services/feeTierService.ts`.
4. `resolvePartyNotificationRecipients` + typ `NewNotificationInput` v `notificationService.ts`.
5. `sendFeeTierChangeNotice` v `email.ts`.
6. i18n klíče `cs.ts` + `en.ts`.
7. `website/src/pages/api/cron/auto-fee-tier.ts`.
8. `shared/types/index.ts` - přidat `'fee_tier_change'` do `NotificationType` union (ručně
   udržovaný soubor, NE auto-generovaný - v pořádku editovat).
9. Jednotkové testy.
10. `cd website && pnpm typecheck`.

### Idempotence - jak přesně je zajištěná

Dva souběžné/opakované běhy cronu pro STEJNÉ (`party_id`, `period_start`):

1. `recomputeBillingPeriod` se zavolá VŽDY (i podruhé) - to je neškodné, protože je to sám o
   sobě idempotentní upsert (`onConflict: "party_id,period_start"`) - druhé volání jen znovu
   zapíše stejná čísla. Toto NENÍ místo, kde hrozí duplicitní efekt.
2. Teprve INSERT do `eshop_fee_tier_events` je bránou pro "pošli notifikaci". `UNIQUE (party_id,
   period_start)` zaručuje, že **maximálně jeden** běh cronu (i při skutečném souběhu dvou
   procesů najednou, ne jen sekvenčním retry) tento insert úspěšně provede - druhý dostane
   `23505 unique_violation`, službě to vrátí `alreadyEvaluated: true`, a API route notifikaci
   ani email vůbec nezavolá.
3. Pořadí (nejdřív přepočet, pak insert-jako-brána) je záměrné: i kdyby insert selhal z jiného
   důvodu (síť), přepočet čísel v `eshop_billing_periods` už proběhl správně - horší case je
   "chybí notifikace", ne "špatná čísla v reportu". Toto je zdokumentované jako riziko níže.

Toto budu ověřovat v testech spuštěním evaluace dvakrát nad stejnými daty a kontrolou, že podruhé
`alreadyEvaluated === true` a žádná notifikace/email se nevolá (mock/spy na `createNotification`
a `sendFeeTierChangeNotice`).

## Implementace - co bylo uděláno

Všechny soubory z coding plánu jsou hotové:

- `supabase/migrations/20260103000079_auto_fee_tier.sql` - enum hodnota, oprava
  `get_billing_period_totals`, tabulka `eshop_fee_tier_events`, RLS, cron schedule.
- `shared/utils/billingFeeCalc.ts` - přidána `decideAutoFeeMode(grossRevenueKc)`.
- `shared/services/feeTierService.ts` (nový) - `getCurrentFeeTier`,
  `evaluateFeeTierForClosedPeriod`, `markFeeTierEventNotified`.
- `shared/services/notificationService.ts` - `NewNotificationInput` (odvázáno od
  auto-generovaného typu), `resolvePartyNotificationRecipients`.
- `shared/types/index.ts` - `'fee_tier_change'` přidáno do `NotificationType` (ručně udržovaný
  soubor, ne auto-generovaný).
- `website/src/lib/integrations/email.ts` - `sendFeeTierChangeNotice`.
- `website/src/pages/api/cron/auto-fee-tier.ts` (nová route).
- `shared/i18n/locales/cs.ts`, `shared/i18n/locales/en.ts` - sekce `email.feeTierChange.*`
  (sdílená pro email i in-app notifikaci, žádná trojitá duplicita textů).

### Ověření migrace proti sdílené lokální DB (BEGIN/ROLLBACK, žádná trvalá změna)

- Migrace `78` + `79` se aplikují bez chyby.
- `get_billing_period_totals` zavolána se simulovaným service-role JWT
  (`set_config('request.jwt.claims', '{"role":"service_role"}', true)`) proti reálným datům
  strany Repasado za září 2026 → vrátila `gross_revenue = 57559.00` bez výjimky (před opravou
  vždy vyhazovala `insufficient_permission` - ověřeno zvlášť, viz Analýza).
- `eshop_fee_tier_events` - INSERT jednoho řádku prošel; druhý INSERT se STEJNÝM
  `(party_id, period_start)` skončil `ERROR: duplicate key value violates unique constraint
  eshop_fee_tier_events_party_id_period_start_key` - idempotenční brána funguje přesně podle
  plánu.
- Nová hodnota enumu `'fee_tier_change'` nejde použít VE STEJNÉ transakci, ve které byla přidána
  (`ERROR: unsafe use of new value ... New enum values must be committed before they can be
  used.`) - to je standardní, dobře zdokumentované chování Postgresu, netýká se to skutečného
  provozu (migrace se commitne dávno předtím, než cron poprvé vloží notifikaci, jde o úplně
  jiná spojení/transakce). Ověřeno zvlášť s existující hodnotou enumu (`'system_alert'`), aby šlo
  otestovat mechaniku tabulky/constraintu bez nutnosti cokoliv trvale commitnout do sdílené DB.
- `./scripts/db-push.sh development` jsem opět NEspustil, ze stejného důvodu jako bod 2 -
  sdílená lokální DB je mezi worktrees sdílená a obsahuje migrace jiných souběžných bodů
  pipeline, které v historii TÉTO branch nejsou. `supabase gen types` jsem taky NEspustil -
  proto `feeTierService.ts` a rozšíření `notificationService.ts` používají netypovaný
  `SupabaseClient` pro nové tabulky, stejně jako `billingPeriodService.ts` z bodu 2.

## Testy

- `cd website && pnpm typecheck` → **prošlo bez chyb** (exit code 0).
- `cd mobile && pnpm typecheck` → **prošlo bez chyb** (exit code 0).
- `npx eslint` na všechny nové/upravené `.ts` soubory (website i shared, přes konfiguraci
  z `mobile/.eslintrc.js`, protože `shared/` nemá vlastní lint config) → **0 chyb**, jen
  formátovací (prettier) warningy, opravené přes `--fix` v souborech, které jsem skutečně psal
  (`feeTierService.ts`, rozšíření `notificationService.ts`, `billingFeeCalc.ts`, testy).
  `shared/types/index.ts` jsem přes `--fix` VĚDOMĚ nepouštěl - má desítky preexistujících
  stylistických warningů (single- vs double-quote konvence) nesouvisejících s mým jednořádkovým
  přidáním `'fee_tier_change'`, a plošný reformat by zbytečně nafoukl diff nesouvisejícím
  obsahem. `website/src/lib/integrations/email.ts` má 4 preexistující `no-console` warningy
  (dev-fallback logování) - moje nová funkce přidává jeden další ve STEJNÉM stylu jako 3
  existující funkce vedle ní, není to regrese.
- **Jednotkové testy napsané a OVĚŘENĚ SPUŠTĚNÉ** (viz níže, `pnpm test` v `mobile/` v tomto
  worktree stále nejde spustit - stejná preexistující chyba prostředí jako u bodu 2,
  `[BABEL] .../react-native-env.js: .plugins is not a valid Plugin property`, reprodukoval jsem
  ji znovu čerstvě v tomto běhu na `billingFeeCalc.test.ts`/`billingPeriod.test.ts` - je to
  problém verzí `jest-expo`/`react-native`/`@babel/core` v tomto worktree, ne něco, co
  způsobuje tento bod. Bod 2 to samé zjištění nechal jako otevřené riziko pro "někoho jiného" -
  je teď potvrzené DRUHÝM po sobě jdoucím bodem pipeline se stejným otiskem, takže silně
  doporučuji, aby to bylo příští prioritní samostatný úkol, ne něco, co se dál jen zapisuje do
  review a ignoruje):
  - `mobile/src/__tests__/sharedServices/billingFeeCalc.test.ts` - rozšířeno o
    `decideAutoFeeMode` (hranice 29900/29901, haléřová přesnost 29900.01/29899.99, nízký i
    vysoký obrat).
  - `mobile/src/__tests__/sharedServices/feeTierService.test.ts` (nový) -
    `evaluateFeeTierForClosedPeriod` proti in-memory fake Supabase klientovi
    (`testUtils/fakeBillingClient.ts`, sdílený mezi Jest testem a ověřovacím tsx skriptem):
    přechod percentage→fixed nad prahem, žádná změna pod/na prahu, přechod fixed→percentage v
    dalším měsíci po poklesu obratu, `smalljobs_commission` eshopy se PŘESKAKUJÍ úplně,
    neuzavřené období vyhodí chybu, a **dvojí spuštění pro STEJNÉ uzavřené období je
    idempotentní** (druhé volání vrátí `alreadyEvaluated: true`, `changed: false`, a zachová
    PRVNÍ rozhodnutí i když se mezitím vstupní obrat v mocku změnil).
  - **Náhradní skutečné spuštění přes `npx tsx`** (stejná technika jako bod 2, ale tentokrát
    including plnou idempotenční logiku, ne jen čisté funkce): napsal jsem dočasný skript
    importující `decideAutoFeeMode` a `evaluateFeeTierForClosedPeriod` přímo ze zdrojových
    `.ts` souborů (žádný Jest/Babel/React Native jest preset potřeba, protože `shared/` kód
    nemá RN závislost) a spustil ho - **všech 10 assertions prošlo**, včetně scénáře dvojího
    spuštění. Log:
    ```
    PASS  decideAutoFeeMode: 29900 stays percentage
    PASS  decideAutoFeeMode: 29901 switches to fixed
    PASS  decideAutoFeeMode: 29900.01 switches to fixed (haler precision)
    PASS  decideAutoFeeMode: 29899.99 stays percentage
    PASS  evaluateFeeTierForClosedPeriod: switches percentage -> fixed above threshold
    PASS  evaluateFeeTierForClosedPeriod: no change reported at/below threshold
    PASS  evaluateFeeTierForClosedPeriod: fixed -> percentage the month after revenue drops
    PASS  evaluateFeeTierForClosedPeriod: skips smalljobs_commission parties
    PASS  evaluateFeeTierForClosedPeriod: refuses an unelapsed period
    PASS  evaluateFeeTierForClosedPeriod: double run is idempotent (no re-decision)
    10 assertions passed
    ```
    Tento skript odhalil a pomohl mi opravit skutečnou chybu v mém PRVNÍM návrhu testů (chyběl
    seed `parties` v mocku, `recomputeBillingPeriod` interně načítá `seller_mode` z `parties`) -
    tedy to nebylo jen "typecheck prošel", opravdu to prošlo reálnou logikou včetně chybové
    cesty.
  - Toto NENÍ náhrada za skutečný zelený `pnpm test` běh - netvrdím, že jsem Jest suite spustil
    zeleně, protože jsem ho nespustil. Testy jsou ale napsané tak, aby prošly beze změny, jakmile
    bude prostředí opravené.
- **End-to-end lokálně**: cron endpoint (`POST /api/cron/auto-fee-tier`) jsem NESPUSTIL proti
  běžícímu `pnpm dev` serveru - `.env.development` v tomto worktree chybí (`.gitignore`d,
  stejná situace jako bod 2), takže `createAdminClient()`/`RESEND_API_KEY`/`CRON_SECRET` by
  neměly hodnoty. SQL/DB vrstva (migrace, RPC oprava, idempotenční UNIQUE constraint) je ale
  ověřená přímo proti běžící lokální Supabase (viz sekce Implementace výše) a business logika
  nad ní přes tsx (viz výše) - to pokrývá obě poloviny cesty, jen ne doslova HTTP request na
  Astro route. Přesné kroky pro ruční ověření celé cesty najdeš níže.

## Jak ručně otestovat

1. `cd .claude/worktrees/auto-fee-tier`
2. Vyplnit `.env.development` (podle `.env.development.example`) + `RESEND_API_KEY` (nebo
   nechat prázdné - pak email jde jen do konzole, `[email:dev] ...`) + `CRON_SECRET` (libovolný
   string, musí sedět s tím, co pošleš v hlavičce).
3. Migrace v tomto branch NEJSOU pushnuté do sdílené dev DB (viz Rizika) - je potřeba je nejdřív
   sladit/rebase se stavem ostatních souběžných bodů pipeline, pak
   `./scripts/db-push.sh development` a `supabase gen types > shared/supabase/types.ts`.
4. `cd website && pnpm dev`.
5. Nasimulovat "uzavřený měsíc s vysokým obratem" pro nějaký `own_company` eshop (např.
   Repasado, `a0000000-0000-0000-0000-000000000001`) - vlož zaplacenou objednávku s
   `paid_at` v MINULÉM kalendářním měsíci a `total_amount` > 29900:
   ```sql
   insert into orders (party_id, customer_id, status, payment_status, subtotal, tax_amount, total_amount, currency, paid_at)
   values (
     'a0000000-0000-0000-0000-000000000001',
     (select id from customers where party_id = 'a0000000-0000-0000-0000-000000000001' limit 1),
     'delivered', 'paid', 35000, 0, 35000, 'CZK', date_trunc('month', now()) - interval '15 days'
   );
   ```
6. "Nasimulovat 1. den měsíce" bez čekání na skutečný cron - zavolej route ručně (funguje pro
   libovolný den v měsíci, vždy vyhodnotí měsíc bezprostředně předcházející dnešku, viz
   `previousCalendarMonth` v Analýze):
   ```bash
   curl -X POST http://localhost:4321/api/cron/auto-fee-tier \
     -H "x-cron-secret: <hodnota z .env.development>" -H "Content-Type: application/json"
   ```
   Odpověď by měla obsahovat `"changed": 1` (nebo víc, podle počtu eshopů s obratem nad prahem).
7. Zkontroluj `/admin/reports` (přihlášen jako owner/admin s `MANAGE_REPORTS`) - řádek pro
   minulý měsíc by měl mít `fee_mode = fixed` a odpovídající přepočtená čísla.
8. Zkontroluj `/admin/notifications` - měla by přibýt nová notifikace typu `fee_tier_change`
   pro globální ownery a členy dané party s rolí >= eshop_admin.
9. Zkontroluj konzoli dev serveru (nebo Resend dashboard, pokud je `RESEND_API_KEY` vyplněný) -
   měl by se objevit `[email:dev] ... SUBJECT: ... MODE: percentage -> fixed`.
10. Zavolej STEJNÝ curl příkaz ZNOVU (simulace retry/redeploy) - odpověď by tentokrát měla mít
    `"changed": 0` pro tohoto eshopu (je v `unchanged`), a v `/admin/notifications` NEPŘIBUDE
    druhá notifikace ani druhý email v konzoli.
11. Sniž obrat pod práh (nová objednávka do dalšího měsíce s nízkým obratem, nebo počkej do
    dalšího měsíce) a zavolej cron znovu pro OVĚŘENÍ REVERZIBILITY - `fee_mode` by se měl vrátit
    na `percentage` a přijít druhá notifikace/email o návratu.

## Rizika a otevřené hrany

- **`pnpm test` v `mobile/` nejde v tomto worktree spustit** - potvrzeno podruhé (bod 2 i bod
  5), stejná chyba prostředí (babel/jest-expo verze). Doporučuji samostatný úkol na opravu,
  nezávislý na obsahu pipeline bodů - je to teď blokující DVA po sobě jdoucí body.
- **Migrace nebyla pushnuta do sdílené lokální dev DB** - ze stejného důvodu jako bod 2
  (konflikt čísel migrací mezi souběžnými worktrees). Kdokoliv bude větve integrovat, musí
  přečíslovat migrace v pořadí, ve kterém se body skutečně mergují.
- **`shared/supabase/types.ts` neregenerován** - `eshop_billing_periods` (bod 2) i
  `eshop_fee_tier_events` (tento bod) chybí v generovaných typech, dokud nepůjde spustit
  `supabase gen types` proti sdílené DB se všemi merged migracemi. Nová/upravená místa proto
  úmyslně používají netypovaný `SupabaseClient` - jakmile budou typy regenerované, doporučuji
  projít `feeTierService.ts`/`notificationService.ts` a přitáhnout typování zpět na
  `SupabaseClient<Database>`, kde to půjde.
- **Chybějící historii pro měsíce, kdy cron neproběhl vůbec** (výpadek serveru přes 1. den
  měsíce) - `evaluateFeeTierForClosedPeriod` vždy vyhodnocuje jen `previousCalendarMonth(now)`
  vzhledem k okamžiku volání, ne všechny přeskočené měsíce zpětně. Stejné omezení má i
  existující `monthly-platform-fees` cron (bod 2 dědictví) - řešení (např. průchod všech
  neohodnocených měsíců od poslední `eshop_fee_tier_events` položky) by bylo možné přidat jako
  follow-up, ale zvyšuje složitost (co když se obrat v mezitím "přeskočeném" měsíci ještě mění)
  a není to explicitně požadováno zadáním ("vyhodnocuje se výhradně 1. den následujícího
  měsíce").
- **Pořadí zápisu při souběhu** - `recomputeBillingPeriod` proběhne VŽDY (i při souběhu dvou
  běhů cronu), teprve INSERT do `eshop_fee_tier_events` je notifikační brána. Pokud by INSERT
  selhal z JINÉHO důvodu než unique violation (např. výpadek sítě) PO úspěšném přepočtu, čísla
  v `eshop_billing_periods` budou správná, ale žádná notifikace/audit záznam nevznikne pro ten
  měsíc - příští měsíc už se ale vyhodnocuje nezávisle, takže se to samo nenapraví. Považuji to
  za přijatelné riziko (stejné jako existující `monthly-platform-fees` cron má se svým
  `notified_at` polem - i tam neúspěšný email zůstane`notified_at = null` navždy, bez retry).
- **Emailová i in-app notifikace se posílají "at-most-once, best-effort"** - pokud selže
  `resolvePartyNotificationRecipients`/`createNotification`, cron pokračuje dál a i tak zkusí
  poslat email (a naopak) - to je záměr (jeden selhavší kanál nesmí blokovat druhý ani zbytek
  dávky), ale znamená to, že admin může dostat email bez in-app notifikace nebo naopak. Obojí
  je ale zapsané v `eshop_fee_tier_events.notified_in_app`/`notified_email`, takže je to
  auditovatelné a dohledatelné.
- **`website/src/lib/integrations/email.ts` přesahuje 200řádkový limit z CLAUDE.md** - byl už
  přes limit před tímto bodem (420 řádků před mou úpravou), moje přidaná funkce ho zvětšila o
  ~35 řádků. Nerozdělil jsem soubor - byl by to netriviální refaktor zasahující všechny
  stávající volající napříč projektem, mimo rozsah tohoto peněžně zaměřeného bodu. Doporučuji
  rozdělení `email.ts` podle domény (auth/objednávky/billing/marketing) jako samostatný
  refaktoringový úkol.

## Tabulka pokrytých edge-cases

| Edge-case | Pokryto | Výsledek |
|---|---|---|
| Obrat přesně 29 900 Kč | `billingFeeCalc.test.ts` + tsx | zůstává `percentage` |
| Obrat 29 901 Kč | `billingFeeCalc.test.ts` + tsx | přepne na `fixed` |
| Obrat 29 900,01 Kč (haléřová hranice) | `billingFeeCalc.test.ts` + tsx | přepne na `fixed` |
| Obrat 29 899,99 Kč | `billingFeeCalc.test.ts` + tsx | zůstává `percentage` |
| Přechod fixed → percentage při poklesu | `feeTierService.test.ts` + tsx | `changed: true`, `previousFeeMode: "fixed"` |
| Žádná změna měsíc od měsíce | `feeTierService.test.ts` + tsx | `changed: false`, žádná notifikace/email se nevolá (gate v cron route) |
| Dvojí spuštění jobu pro stejné období | `feeTierService.test.ts` + tsx | druhé volání `alreadyEvaluated: true`, zachová první rozhodnutí, žádný duplicitní zápis/notifikace |
| `smalljobs_commission` eshop | `feeTierService.test.ts` + tsx | úplně přeskočen, `fee_mode` zůstává `ledger`, žádná evaluace ani notifikace |
| Neuzavřené (aktuální) období | `feeTierService.test.ts` + tsx | vyhodí chybu, nic nezapíše |
| `get_billing_period_totals` ze service-role kontextu | ověřeno přímo v psql (BEGIN/ROLLBACK) | funguje po opravě, dřív vždy `insufficient_permission` |
| Idempotence na DB úrovni (souběžný insert) | ověřeno přímo v psql (unique constraint) | druhý INSERT skončí `23505`, žádný duplicitní řádek |
