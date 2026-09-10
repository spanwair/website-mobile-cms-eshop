# Bod 6: Audit fakturační distribuce

Branch: `audit/billing-distribution` (base: `feat/auto-fee-tier`, obsahuje body 2 a 5).
Worktree: `.claude/worktrees/billing-distribution-audit`.

Toto je finanční audit, ne feature.
Cíl: ověřit, že částka, kterou by e-shop dostal za měsíc, sedí na haléř přesně, ve všech edge-case scénářích, a že samotný mechanismus distribuce peněz skutečně funguje.
Přístup: číst kód, spustit reálné SQL proti běžící lokální Supabase, spustit reálné TypeScript testy (jest je v tomto worktree rozbitý, viz níže), opravit nalezené peněžně kritické chyby přímo, a jasně napsat, co je otevřený obchodní problém pro Jana.

## Analýza - jak to dnes funguje

### Tok peněz od objednávky k distribuci

```
Zákazník platí kartou
        |
        v
  Stripe Checkout (JEDEN centrální účet platformy, STRIPE_SECRET_KEY,
  žádný Stripe Connect, žádné per-eshop účty)
        |
        v
  webhook checkout.session.completed
        |
        +--> orders.payment_status = 'paid', paid_at = now()
        |
        +--> seller_mode = smalljobs_commission?
        |       ano -> order_commission_ledger: hned se strhne 30 %,
        |              zbytek (net_payable) čeká 60 dní (hold_until),
        |              limit 12 000 Kc/měsíc, přebytek se withholduje
        |       ne (own_company) -> nic dalšího se nestane hned,
        |              peníze zůstávají na účtu platformy
        |
        v
  Refundace (charge.refunded webhook)
        +--> orders.payment_status = 'refunded'
        +--> order_commission_ledger: reverseCommissionForOrder (jen smalljobs)
        |
        v
  1. den dalšího měsíce (dva nezávislé pg_cron joby, 03:00 a 03:15 UTC)
        |
        +--> monthly-platform-fees cron (bod z minulosti, PŘED bodem 2)
        |       own_company: min(obrat * 10 %, 2990 Kc) -> monthly_platform_fees
        |       (status unpaid/paid, "eshop dluží platformě")
        |
        +--> auto-fee-tier-transition cron (bod 5)
                own_company: rozhodne percentage/fixed podle obratu
                za PRÁVĚ uzavřený měsíc (COMMISSION_BREAK_EVEN_CZK = 29900 Kc),
                zapíše eshop_fee_tier_events (idempotenční brána),
                zavolá recomputeBillingPeriod -> eshop_billing_periods
                (bod 2: gross_revenue, real_costs, net_revenue, fee_amount,
                net_payout - "kolik e-shopu reálně zbyde")
        |
        v
  /admin/reports zobrazuje eshop_billing_periods.net_payout
  a nabízí CSV export ("čistý výdělek e-shopu", podklad pro daň z příjmů)
```

Dvě zcela nezávislé "fee" cesty existují paralelně pro `own_company` eshopy: stará `monthly_platform_fees` (počítá odvod stejným vzorcem, `min(obrat*10%, 2990)`, ale bez reálných nákladů) a nová `eshop_billing_periods` (bod 2/5, počítá i reálné náklady a čistý výdělek).
Obě čtou stejná zdrojová data (`orders.payment_status = 'paid'`), ale nejsou nijak provázané.
Bod 2 tuto duplicitu sám otevřeně přiznal jako riziko k vyřešení později (viz `2-eshop-billing-periods.md`, sekce "Co necháváš pro bod 5") a bod 5 ji nesloučil.
Zůstává to jako otevřený bod, viz tabulka níže.

### Nejdůležitější zjištění: neexistuje žádný automatizovaný výplatní mechanismus

Toto je zásadní zjištění celého auditu.

Pro `own_company` e-shopy (většina platformy) platí doslova to, co říká komentář v migraci `20260103000072_monthly_platform_fees.sql`: "all order proceeds land in the platform's single central Stripe account untouched."
Všechny peníze ze všech e-shopů na platformě chodí do JEDNOHO centrálního Stripe účtu platformy.
Nikde v kódu není Stripe Connect, `transfer_data`, `application_fee_amount`, ani `on_behalf_of` - ověřeno grep přes `website/src/lib/integrations/stripe.ts` a `website/src/pages/api/stripe/webhook.ts`.
Tabulka `parties` neobsahuje ŽÁDNÉ pole pro bankovní účet nebo IBAN e-shopu - ověřeno přímo ve schématu.
`eshop_billing_periods.net_payout` je tedy čistě INFORMATIVNÍ číslo: řekne e-shopu "tolik by sis měl/a nechat pro daň z příjmů", ale nic v aplikaci tuto částku e-shopu skutečně nepošle, nezaznamená jako závazek platformy vůči e-shopu, ani nenabídne tlačítko "vyplatit."

Pro srovnání, OBĚ existující "opačné" peněžní cesty MAJÍ alespoň manuální bookkeeping workflow:

- `monthly_platform_fees` (e-shop dluží platformě): `status` unpaid/paid, `paid_at`, `paid_by`, `payment_reference`, tlačítko "Mark as paid" v `/admin/payouts`.
- `order_commission_ledger` (platforma dluží smalljobs tvůrci): `status` held/eligible/paid/reversed, `hold_until`, `payout_reference`, tlačítko "Mark as paid."

Ani jedna z těchto dvou cest ale reálně NEODESÍLÁ peníze přes API (žádné `stripe.transfers.create`, žádné SEPA/ACH volání) - "Mark as paid" je čistě administrativní záznam potvrzující, že peníze byly přesunuty MIMO aplikaci (bankovním převodem, ručně).
To je v pořádku jako MVP přístup, pokud je to vědomé rozhodnutí.

Pro `own_company` e-shopy ale CHYBÍ i tento manuální bookkeeping krok úplně.
Neexistuje řádek "platforma dluží e-shopu X Kč za srpen", žádný stav, žádné tlačítko, žádný záznam kdy/jestli byla částka e-shopu poslána.
`net_payout` je jen sloupec v reportovací tabulce.
Pokud tedy platforma dnes reálně provozuje `own_company` e-shopy, musí existovat zcela mimo-aplikační proces (fakturace, ruční bankovní převod na základě telefonátu/emailu), o kterém aplikace neví vůbec nic - a proto to ani nejde ověřit, zda proběhl, natož automatizovat nebo auditovat.

**Doporučení**: toto je obchodní rozhodnutí (viz tabulka níže, "Otevřený problém pro Jana"), ne něco, co lze technicky opravit v rámci auditu.
Reálné řešení vyžaduje buď (a) Stripe Connect (per-eshop connected accounts, `transfer_data`/`application_fee_amount`, aby Stripe sám dělil peníze), nebo (b) minimálně stejný manuální bookkeeping vzor jako u `monthly_platform_fees`/`order_commission_ledger` - nová tabulka/stav "payout owed to eshop", tlačítko "Mark as paid", pole pro bankovní účet e-shopu.

### Co je "čistý výdělek" a je to totéž co "částka k výplatě e-shopu"

Ano, je to totéž, a je to jednoznačně zdokumentované v kódu.

`shared/utils/billingFeeCalc.ts` řádek 29: `netPayoutKc: number; // what the eshop actually earns after real costs and the platform fee`.
UI popisek v `shared/i18n/locales/cs.ts` (`admin.reports.billingPeriods.colNetPayout`) říká přímo "Čistý výdělek".
`net_revenue` (gross - real_costs, PŘED odvodem) je jen mezikrok, ne částka k výplatě - tu bod 2 sám nazývá jinak ("Čistý obrat", ne "výdělek").
Vzorec je tedy jednoznačně: **čistý výdělek = částka k výplatě e-shopu = gross_revenue - real_costs - fee_amount**, přesně podle zadání bodu 6.

## Testovací sada a výsledky

Jest (`cd mobile && pnpm test`) v tomto worktree NEJDE spustit - potvrzeno POTŘETÍ (po bodu 2 a bodu 5), stejná preexistující chyba prostředí (`[BABEL] .../react-native-env.js: .plugins is not a valid Plugin property`, `jest-expo`/`@babel/core`/`react-native` verzní konflikt).
Zkusil jsem `jest --clearCache` a přímé spuštění bez wrapperu, chyba je stejná.
Toto teď blokuje TŘI po sobě jdoucí body pipeline a mělo by být urgentní samostatný úkol, ne něco, co se dál jen zapisuje do review.

Místo toho jsem spustil identickou logiku dvěma způsoby, oba se skutečným, ověřitelným výstupem:

**A) SQL integrační testy přímo proti běžící lokální Supabase** (docker, port 54322).
Migrace 78 a 79 byly v tomto worktree v `supabase_migrations.schema_migrations` označené jako aplikované, ale odpovídající tabulky/funkce ve sdílené DB fyzicky neexistovaly (nekonzistentní stav zděděný ze souběžného worktree).
Aplikoval jsem obě migrace přímo (idempotentní `CREATE TABLE IF NOT EXISTS` / `CREATE OR REPLACE FUNCTION`, žádná destruktivní akce), aby DB odpovídala tomu, co už tvrdí.
Deset scénářů, dvě izolované testovací "party" (smazané na konci skriptu):

| # | Scénář | Výsledek |
|---|--------|----------|
| 1 | Měsíc bez objednávek (obrat 0 Kc) | PASS - gross=0, real_costs=0, žádný pád |
| 2 | Hrubý obrat + COGS (2 ks * cost_price) | PASS - gross=1000 (order total), cogs=800 (2*400) |
| 3 | Hranice měsíce: objednávka v 23:59:59.999 posledního dne se počítá, v 00:00:00.000 dalšího měsíce ne | PASS |
| 4 | Refundace přes Stripe (`original_payment`) - dvojí odečet | **PŘED opravou: potvrzený bug** (gross=0, real_costs=1000 navíc) - **PO opravě: PASS** (gross=0, real_costs=0, čistý efekt ~0) |
| 5 | Refundace přes `store_credit` (Stripe nedotčen) | PASS - gross zůstává 1000, real_costs odečten jen jednou |
| 6 | Poškozené zboží (`stock_movements type=damage`) | PASS - damaged_loss = 3*400 = 1200 |
| 7 | Souběh dvou parties ve stejném měsíci | PASS - žádný cross-party únik |
| 8 | Idempotentní upsert `eshop_billing_periods` (dvakrát stejné období) | PASS - jeden řádek, žádná duplicita |
| 9 | Zaokrouhlení 10 % z 12345 Kc | PASS - přesně 1234.50 Kc, žádný drift |
| 10 | Unikátní constraint `eshop_fee_tier_events` (druhý insert stejného období) | PASS - `23505 unique_violation` |

**B) TypeScript čisté funkce a service vrstva přes `npx tsx`** (přímo proti zdrojovým `.ts` souborům, žádný jest/babel/RN potřeba, protože `shared/` kód nemá RN závislost):

- `money.ts` + `billingPeriod.ts` + `billingFeeCalc.ts`: 32 assertions, všechny PASS (délky měsíců 28/29/30/31 vč. přestupných a stoletých výjimek 1900/2000, hranice 29900/29900.01/29901/29899.99, zaokrouhlení 12345 Kc a 100.03 Kc, reconciliation identity gross=net_revenue+real_costs a net_payout=net_revenue-fee napříč šesti různými částkami, nulový obrat).
- `feeTierService.ts` přes fake Supabase klient: 11 assertions, všechny PASS (cross-party izolace ve stejném běhu, idempotence dvojího spuštění včetně "druhý běh ignoruje změněný vstup", reverzibilita fixed->percentage, přeskočení `smalljobs_commission`, odmítnutí neuzavřeného měsíce).

Celkem **53 reálně spuštěných a prošlých assertions/scénářů** (10 SQL + 32 + 11 tsx), plus existující jednotkové testy z bodu 2/5 rozšířené o nové případy (viz níže).

**C) Trvalé jednotkové testy přidané do repa** (spustí se, jakmile bude jest prostředí opravené):

- `mobile/src/__tests__/sharedServices/billingFeeCalc.test.ts` - přidána sekce "bod 6 audit: rounding and reconciliation" (4 nové testy).
- `mobile/src/__tests__/sharedServices/feeTierService.test.ts` - přidán test cross-party izolace ve stejném běhu cronu.
- `cd website && pnpm typecheck` - prošlo bez chyb.
- `cd mobile && pnpm typecheck` - prošlo bez chyb.
- `npx eslint` na všechny upravené soubory - 0 chyb, jen preexistující stylistické warningy v `email.ts` (soubor byl nad 200 řádků už před tímto bodem, viz otevřené problémy), nové testovací soubory jsou čisté (`--fix` aplikován).

## Opravené chyby

| # | Chyba | Zdůvodnění opravy | Ověření |
|---|-------|-------------------|---------|
| 1 | `get_billing_period_totals()` dvakrát odečítala refundovanou částku pro objednávky refundované přes Stripe (`original_payment`) - jednou vyloučením z `gross_revenue` (`payment_status='refunded'`), podruhé přes `return_requests.refund_amount` v `real_costs` | Peněžně kritická chyba: plně refundovaná objednávka (zákazník zaplatil a dostal zpět) uměle SNIŽOVALA čistý výdělek e-shopu o částku refundace navíc, místo aby měla nulový čistý efekt. Ověřeno na reálných datech: 1000 Kc objednávka -> `net_revenue = -1000` místo `~0`. | Nová migrace `20260103000080_fix_billing_refund_double_count.sql`, `CREATE OR REPLACE FUNCTION` (stejný vzor jako bod 5, žádná úprava commitnuté migrace). Scénář 4 v SQL sadě: PASS po opravě. |
| 2 | `/admin/reports` tiše ignorovala chybu z `recomputeBillingPeriod` (auto-recompute při GET i POST akce) - tabulka zůstala prázdná/neaktuální bez jakékoli indikace | Money-critical stránka nesmí předstírat, že čísla jsou aktuální, když přepočet selhal. | Přidán `error` prop do `BillingPeriodsSection.astro`, viditelný alert při selhání, i18n klíč `recomputeError` (cs+en). `pnpm typecheck` prošlo. |
| 3 | `sendMonthlyFeeNotice` a `sendFeeTierChangeNotice` (email.ts) renderovaly název měsíce bez `timeZone: 'UTC'` - na serveru v jiné časové zóně než UTC (např. americké) by email o "změně režimu odvodu za červenec" mohl ukazovat "červen" | Ověřeno reprodukcí: `TZ=America/New_York` skutečně posunulo "červenec 2027" na "červen 2027" bez opravy. Email s nesprávným měsícem u finanční notifikace je zavádějící. | Přidáno `timeZone: 'UTC'` do obou volání `toLocaleDateString`. Ověřeno stejným reprodukčním skriptem po opravě - správně "červenec 2027". |

Nad rámec těchto oprav jsem nezávisle ZNOVU ověřil (ne opravoval, protože už opraveno v bodě 5) bug zmíněný v review bodu 5: `get_billing_period_totals()` volaná přes service-role klienta (`auth.role() = 'service_role'`).
Potvrzeno přímo v psql se simulovaným service-role JWT, PŘED i PO aplikaci migrace `20260103000080` (fix zůstal zachovaný, protože jsem ho zkopíroval do nové `CREATE OR REPLACE FUNCTION`): funkce už nevyhazuje `insufficient_permission` a vrací správná data.

## Kontrolované oblasti - souhrnná tabulka

| Kontrolovaná oblast | Zjištění | Stav |
|---|---|---|
| Service-role fix `get_billing_period_totals` (bug z bodu 2, opravený v bodě 5) | Fix je součástí branch a funguje, ověřeno nezávisle v psql | OK |
| Refundace snižuje obrat, ze kterého se počítá odvod (dvojí odečet) | Byla to chyba, refundace přes Stripe se odečítala dvakrát | Opraveno |
| Přechod 10 % -> fixní a zpět, hranice 29900/29901 | Přesně podle zadání, striktní `>`, ověřeno na haléř | OK |
| Délky měsíce 28/29/30/31 dní vč. přestupných/stoletých výjimek | Kalendářní měsíc vždy sedí přesně, žádný pevný 30denní blok | OK |
| Měsíc bez objednávek | gross=0, fee=0, žádný pád | OK |
| Souběh více e-shopů ve stejném běhu cronu | Žádný cross-party únik, ověřeno na SQL i service vrstvě | OK |
| Idempotence (dvojí spuštění 1. dne měsíce) | `eshop_fee_tier_events` UNIQUE constraint brání duplicitě, `eshop_billing_periods` upsert je bezpečný | OK |
| Zaokrouhlování (haléře, liché částky) | Nikde neztrácí/nepřidává haléře, ověřeno na 12345 Kc, 100.03 Kc a 6 dalších částek | OK |
| Souhlas čísel gross/fee/net napříč tabulkami | `net_payout = gross_revenue - real_costs - fee_amount`, na haléř přesně | OK |
| Silent error na `/admin/reports` při selhání přepočtu | Chyba se dřív nikde nezobrazila | Opraveno |
| Časová zóna v emailových notifikacích (měsíc) | Mohla ukázat špatný měsíc mimo UTC server | Opraveno |
| **Automatizovaný výplatní mechanismus pro `own_company` e-shopy** | **Neexistuje vůbec - `net_payout` je jen číslo v reportu, žádné tlačítko, žádný stav, žádné bankovní údaje e-shopu v DB** | **Otevřený problém pro Jana** |
| Dvě paralelní "fee" cesty (`monthly_platform_fees` starý mechanismus vs. `eshop_billing_periods` nový reporting) | Obě žijí vedle sebe, nejsou provázané, počítají stejná data dvakrát nezávisle | Otevřený problém pro Jana |
| Odvod se počítá z HRUBÉHO obratu i pro refundace vyřízené přes `store_credit`/`bank_transfer` (kde objednávka zůstává `payment_status='paid'`) | Platforma si nechává plnou 10% provizi i z prodeje, který byl nakonec vrácen jinak než přes Stripe - konzistentní s PŮVODNÍM mechanismem (`monthly_platform_fees` to dělá stejně), ale otázka, jestli je to správně | Otevřený problém pro Jana |
| Ruční přepsání `fee_mode` administrátorem vs. automatický cron pro stejné období | Cron vždy `forceRecompute: true` a přepíše i ručně nastavený režim, pokud běží AŽ PO ruční změně pro stejné (ještě needitované cronem) období; žádný "byl to auto nebo ruční zásah" flag | Otevřený problém pro Jana |
| Částečná refundace (Stripe `charge.refunded` s částkou nižší než celá objednávka) | Webhook nastaví `payment_status='refunded'` bez ohledu na to, jestli šlo o celou nebo jen část částky - CELÁ objednávka zmizí z obratu, ne jen refundovaná část. Preexistující, mimo rozsah tohoto bodu (základní platební state machine, ne billing-period logika) | Otevřený problém pro Jana |
| Přechod `seller_mode` uprostřed měsíce (smalljobs_commission -> own_company nebo naopak) | Auto fee-tier by vyhodnotil CELÝ měsíc podle AKTUÁLNÍHO režimu, i když část měsíce platily jiné podmínky - okrajový případ, nespecifikováno v zadání | Otevřený problém pro Jana |
| CSV export může být neaktuální | Export čte poslední SPOČÍTANÝ řádek, přepočet proběhne jen při návštěvě `/admin/reports` nebo ručním tlačítku, ne při stažení CSV | Otevřený problém pro Jana (menší) |
| `pnpm test` v `mobile/` nejde spustit (jest/babel/react-native verzní konflikt) | Potvrzeno potřetí (bod 2, bod 5, bod 6) | Otevřený problém pro Jana (urgentní, blokuje regresní testování peněžního kódu) |

### Proč jsem tyto problémy neopravil sám

- **Chybějící výplatní mechanismus**: vyžaduje obchodní rozhodnutí (Stripe Connect vs. rozšíření manuálního bookkeeping vzoru) a pravděpodobně sběr nových citlivých údajů (bankovní účet e-shopu) - není to jednořádková technická oprava, je to nová feature s právními/bezpečnostními dopady.
- **Dvě paralelní fee cesty**: sloučení by změnilo chování EXISTUJÍCÍHO, již používaného `monthly_platform_fees`/`payouts` workflow - riziko rozbití něčeho, co dnes funguje, bez jasného zadání "sloučit teď."
- **Odvod z hrubého obratu i po store_credit/bank_transfer refundaci**: je to KONZISTENTNÍ s původním, staršícm mechanismem (`monthly_platform_fees` to dělá stejně) - změna by byla nová obchodní politika, ne oprava chyby. Opravil jsem jen prokazatelné DVOJITÉ počítání (nález č. 1), ne tuto širší otázku.
- **Ruční vs. automatický fee_mode**: vyžaduje rozhodnutí, čí volba má mít přednost, a případně nový sloupec/log - přesahuje rozsah "opravit prokazatelné chyby ve výpočtu."
- **Částečná refundace**: zasahuje do základního stavového automatu objednávek (`orders.payment_status`), používaného široko napříč aplikací (inventář, doprava, zákaznické stránky) - oprava jen v kontextu billing by riskovala rozbití něčeho jiného bez důkladné samostatné analýzy.
- **Přechod seller_mode uprostřed měsíce**: není to scénář zmíněný v zadání, a neexistuje nikde v kódu ani UI podporovaný "přepni mi mid-month" flow - řešení by bylo spekulativní.
- **Rozbité jest prostředí**: je to problém verzí závislostí (`jest-expo`/`@babel/core`/`react-native`) sdílených napříč CELÝM `mobile/` projektem, ne něco specifického pro billing kód - oprava by mohla ovlivnit i mobilní testy mimo rozsah tohoto bodu.

### Doporučení

1. Rozhodnout výplatní mechanismus pro `own_company` e-shopy CO NEJDŘÍV - toto je jediná věc, na které má platforma reálně vydělávat, a dnes není vůbec technicky možné ověřit, že e-shop kdy dostal svůj podíl.
2. Minimálně jako první krok: přidat `eshop_payouts` tabulku (stejný vzor jako `monthly_platform_fees`/`order_commission_ledger` - status, `paid_at`, `payout_reference`, tlačítko "Mark as paid" v `/admin/payouts`) a pole pro bankovní účet e-shopu na `parties`, i bez plné Stripe Connect integrace.
3. Sloučit `monthly_platform_fees` a `eshop_billing_periods` do jednoho zdroje pravdy jako samostatný, promyšlený úkol.
4. Opravit jest/babel prostředí v `mobile/` jako urgentní, samostatný úkol - blokuje regresní testování měnícího se, peněžně kritického kódu už potřetí.

## Jak si Jan může sám ověřit správnost distribuce

**1. Ruční kontrola jednoho e-shopu a měsíce v SQL** (proti lokální nebo produkční DB, jen SELECT, nic nemění):

```sql
-- Skutečný hrubý obrat za měsíc podle primárních dat
SELECT COALESCE(SUM(total_amount), 0) AS skutecny_obrat
FROM orders
WHERE party_id = '<party_id>' AND payment_status = 'paid'
  AND paid_at >= '2027-07-01' AND paid_at < '2027-08-01';

-- Co si o tom myslí eshop_billing_periods
SELECT gross_revenue, real_costs, net_revenue, fee_mode, fee_amount, net_payout
FROM eshop_billing_periods
WHERE party_id = '<party_id>' AND period_start = '2027-07-01';

-- Musí platit: gross_revenue (nahoře) == gross_revenue (dole),
-- a net_payout == gross_revenue - real_costs - fee_amount (na haléř přesně)
```

**2. Ověření, že fee_mode odpovídá obratu** (mělo by být `fixed`, pokud `gross_revenue > 29900`, jinak `percentage`):

```sql
SELECT party_id, period_start, gross_revenue, fee_mode,
       CASE WHEN gross_revenue > 29900 THEN 'fixed' ELSE 'percentage' END AS mel_by_byt
FROM eshop_billing_periods
WHERE seller_mode = 'own_company'
ORDER BY period_start DESC;
```

**3. Historie rozhodnutí auto-přepínání** (proč se režim v daném měsíci změnil nebo ne):

```sql
SELECT party_id, period_start, previous_fee_mode, new_fee_mode, changed,
       gross_revenue, threshold_amount, notified_in_app, notified_email
FROM eshop_fee_tier_events
ORDER BY period_start DESC;
```

**4. Ruční test refundačního scénáře** - vlož testovací objednávku, nastav ji jako refundovanou přes Stripe (`payment_status = 'refunded'`) a přidej odpovídající `return_requests` řádek s `refund_method = 'original_payment'`, pak zavolej `get_billing_period_totals` pro daný měsíc - `refunded_amount` musí být 0 (žádné dvojí odečtení), `gross_revenue` nesmí objednávku obsahovat.

**5. Vizuální kontrola** - přihlásit se jako owner/admin s `MANAGE_REPORTS` (pro úpravy i `MANAGE_AUDIT`), otevřít `/admin/reports`, zkontrolovat sekci "Fakturační období": čísla musí sedět se SQL výše, tlačítko "Přepočítat" musí fungovat bez chyby (dřív vždy tiše selhalo kvůli service-role bugu, teď opraveno), CSV export musí obsahovat stejná čísla.
