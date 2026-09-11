# Finální souhrn - autonomní zpracování 8 bodů dne (2026-09-03)

Celý pipeline dokončen. Všech 8 worktrees je hotových, otestovaných a čeká na
ruční review + merge. **Nic nebylo automaticky sloučeno do master ani
pushnuto** - to je záměr (rozhodnutí Jana z 2026-09-03).

Detailní review každého bodu (analýza, plán, implementace, testy, rizika,
přesné manuální kroky) je v `_project_specs/session/reviews/<n>-<slug>.md`
uvnitř příslušného worktree. Tento dokument je jen rozcestník.

## Pořadí mergování - doporučení

Body 5, 6 a 7 na sobě přímo staví (viz sloupec Base) - je potřeba je
mergovat v pořadí **2 → 5 → 6 → 7**, ne v libovolném pořadí, jinak vzniknou
konflikty. Body 1, 3, 4, 8 jsou nezávislé, lze mergovat kdykoliv.

**Před jakýmkoliv mergem:** vyřešit kolizi čísel migrací - více worktrees
souběžně vytvořilo migrace se stejným/blízkým prefixem (`...78`), protože
vznikaly paralelně z master ve stejnou dobu. Při mergování je nutné migrace
přečíslovat do jedné konzistentní řady a znovu spustit
`./scripts/db-push.sh development` + `supabase gen types`.

---

## 1. Reálné eshopy místo šablon

**Branch:** `feat/real-eshops-list` (base: master) - `.claude/worktrees/real-eshops-list`

Nová sekce "Reálné eshopy" na landing page nad (nyní skrytými, ne smazanými)
šablonami - Kytka z Beskyd jako první položka, CTA blok pro založení
vlastního eshopu mezi listem eshopů a šablonami. DB-driven (`store_configs`
+ 4 nové sloupce + RPC), škáluje do budoucna.

**Testováno:** typecheck, lint, build čisté. Nový Playwright test 5/5.
Vizuálně ověřeno screenshoty (odhalen a opraven CSS bug s jedním eshopem
roztaženým na celou šířku).

**Vedlejší oprava:** `global-setup.ts` - seed pod replica módem přeskakoval
trigger tvořící `store_configs`, testovací obchody nikdy nešly v adresáři.

**Riziko:** chybí reálný screenshot Kytka z Beskyd (placeholder zatím).
`shared/supabase/types.ts` doporučeno přegenerovat oficiálním CLI před
mergem.

**Jak otestovat:** viz `_project_specs/session/reviews/1-real-eshops-list.md`,
sekce "Jak to ručně otestovat".

---

## 2. Fakturační období + reálné náklady/výdělek/odvod

**Branch:** `feat/eshop-billing-periods` (base: master) - `.claude/worktrees/eshop-billing-periods`

Rozšíření `/admin/reports` o sekci "Fakturační období": tabulka
`eshop_billing_periods` (1 řádek/eshop/kalendářní měsíc), hrubý obrat,
reálné náklady (COGS + reklamace + poškození), odvod, čistý výdělek. CSV
export hrubých i reálných čísel pro daň z příjmů. Peníze počítány v
halířích jako integer. `fee_mode` nastavitelný, ale automatické přepínání
nechalo záměrně na bod 5.

**Testováno:** typecheck čistý (website i mobile). Migrace ověřena přímo
proti běžící DB (BEGIN/ROLLBACK). `pnpm test` v mobile/ nešel spustit
(rozbité prostředí jest-expo/babel - nesouvisí se změnou, viz níže).

**Riziko:** PDF export nehotový (jen CSV). Migrace nepushnutá do sdílené
dev DB kvůli kolizi čísel s jinou souběžnou branch.

**Jak otestovat:** viz review, sekce "Jak ručně otestovat" (obsahuje SQL na
vložení testovací objednávky).

---

## 3. DB indexace per-eshop pro performance

**Branch:** `feat/db-per-eshop-indexing` (base: master) - `.claude/worktrees/db-per-eshop-indexing`

Potvrzena interpretace: žádný sharding, composite indexy vedené `party_id`
pro storefront dotazy (products, kategorie, objednávky, inventář, košík).
12 nových indexů, jedna migrace, čistě aditivní. Role/RLS/administrace
nedotčeny (explicitně ověřeno a zdokumentováno).

**Testováno:** aplikováno na lokální DB, ověřeno `pg_indexes` + before/after
`EXPLAIN ANALYZE` (strukturální validace, malý seed data neukáže reálné
zrychlení).

**Otevřené otázky:** jestli `idx_orders_party_payment_status` má zůstat
(je spíš admin dotaz); nalezen (needitovaný) cross-party bug v
`shopQueries.ts` u `product_conditions` lookupu.

**Jak otestovat:** čistě DB - viz review, sekce "Jak ověřit ručně" (psql
příkazy nebo Supabase Studio).

---

## 4. Login page carousel

**Branch:** `feat/login-carousel` (base: master) - `.claude/worktrees/login-carousel`

Three.js WebGL animace na `/login` nahrazena lehkým vanilla-JS carouselem
z 5 existujících e-shop fotek, auto-advance 4.5s, fade přechod, respektuje
`prefers-reduced-motion`. Desktop layout mírně zvětšen (920px→1080px).
Mobilní view beze změny (stejné CSS pravidlo jako dřív).

**Testováno:** typecheck čistý, vizuálně ověřeno na desktopu (browser
tooling), `01-auth.spec.ts` 9/9 passed.

**Riziko:** mobilní viewport se nepodařilo fyzicky vyfotit v sandboxu -
doporučeno rychlé ruční ověření zúžením okna pod 760px.

**Jak otestovat:** `pnpm dev` → `/login`, sledovat carousel, zúžit okno.

---

## 5. Automatický přechod 10 % / fixní 2990 Kč

**Branch:** `feat/auto-fee-tier` (base: `feat/eshop-billing-periods`, bod 2) - `.claude/worktrees/auto-fee-tier`

Nový pg_cron job (1. den měsíce, 03:15 UTC) vyhodnocuje uzavřený měsíc
proti hranici 29 900 Kč, přepíná `fee_mode`, zapisuje auditní stopu do
`eshop_fee_tier_events` (idempotenční brána přes `UNIQUE` constraint),
notifikuje in-app + email jen při skutečné změně.

**Bug nalezený a opravený:** `get_billing_period_totals()` (z bodu 2) vždy
padala při volání service-role klientem (`auth.uid()` je NULL) - tedy
přepočet v `/admin/reports` tiše selhával při každém běhu. Opraveno.

**Testováno:** 10 assertions přes `tsx` (hranice, idempotence, reverzibilita),
migrace ověřena proti běžící DB.

**Riziko:** `pnpm test` v mobile/ potvrzeně rozbitý podruhé - doporučeno
řešit jako samostatný urgentní úkol (blokuje regresní testování peněžního
kódu).

**Jak otestovat:** viz review, obsahuje přesný `curl` příkaz na ruční
vyvolání cronu bez čekání na 1. den měsíce.

---

## 6. Audit fakturační distribuce (KRITICKÉ)

**Branch:** `audit/billing-distribution` (base: `feat/auto-fee-tier`, bod 5) - `.claude/worktrees/billing-distribution-audit`

Nejdůležitější zjištění celého dne: **neexistuje žádný automatizovaný
výplatní mechanismus pro `own_company` eshopy.** Všechny platby chodí na
jeden centrální Stripe účet, `net_payout` je čistě informativní číslo -
žádná tabulka, stav, tlačítko ani bankovní účet eshopu v DB. **Toto je
otevřené obchodní rozhodnutí pro Jana**, ne technická oprava.

**3 reálné bugy nalezené a opravené:** dvojí odečet refundované částky u
Stripe refundací (net_revenue vycházelo záporně místo ~0), tichá chyba na
`/admin/reports` bez indikace selhání, chybějící `timeZone: 'UTC'` v
emailových notifikacích (mohl ukázat špatný měsíc).

**Testováno:** 53 reálně spuštěných scénářů/assertions (10 SQL + 32 + 11
tsx) - zaokrouhlování, hranice měsíců, refundace, cross-party izolace,
idempotence.

**Otevřené problémy pro Jana** (viz review, tabulka): chybějící výplatní
mechanismus, dvě paralelní fee cesty (`monthly_platform_fees` vs.
`eshop_billing_periods`), odvod z hrubého obratu i po store_credit refundaci,
ruční vs. automatický `fee_mode`, částečné refundace, mid-month seller_mode
přechod, rozbité jest prostředí (potvrzeno potřetí).

**Jak otestovat:** viz review, obsahuje přímé SQL dotazy na ruční ověření
správnosti distribuce.

---

## 7. Migrace platebního systému Stripe → PayU

**Branch:** `feat/payu-migration` (base: `audit/billing-distribution`, bod 6) - `.claude/worktrees/payu-migration`

Zvolen PayU GPO Europe REST API (CZK). Nová gateway-agnostická vrstva
(`website/src/lib/integrations/payments/`) s factory vybírající
Stripe/PayU/mock podle env - feature-flagged přechod, ne big-bang. Sdílená
business logika (aktualizace objednávky) volaná z jednoho místa jak
webhookem, tak návratem zákazníka - zavřen preexistující race mezi oběma
cestami.

**Bug nalezený a opravený:** checkout dřív účtoval na Stripe stránce jen
cenu položek bez dopravy.

**Testováno:** zaveden mock payment gateway - hlavní checkout e2e test
poprvé v historii projektu prošel skutečně end-to-end (dřív se vždy zasekl
na reálné Stripe stránce). 47/50 e2e testů passed, s trace/video nahrávkou.
Cestou opraveny 3 další preexistující testovací chyby.

**Hlavní riziko:** žádná reálná PayU sandbox credentials nebyla k
dispozici - `payu.ts` ověřen jen podle dokumentace, staticky a přes mock,
NE proti živému PayU serveru. **Nutné projít reálný sandbox test před
nasazením do produkce.**

**Jak otestovat:** viz review, sekce s manuálními kroky + odkaz na
video/trace soubory z e2e běhu.

---

## 8. PPL pickup-point mapa - implementační plán

**Branch:** `plan/ppl-pickup-map` (base: master) - `.claude/worktrees/ppl-pickup-map`

**Pouze plán, žádný kód** (dle zadání). Klíčové zjištění: reálná PPL
mapa/widget už je v kódu naimplementovaná (`ShippingProviderSelector.astro`,
oficiální PPL Widget 2.0) - mock data se zobrazují jen proto, že na dev
serveru chybí `PUBLIC_PPL_WIDGET_API_KEY`. Není to tedy "postavit od nuly",
ale "získat API klíč + doplnit chybějící server-side validaci vybraného
pickup-pointu" (stejná mezera existuje i u Packety).

**Doporučené řešení:** použít existující widget (ne stavět vlastní mapu).
Plán: 1) získat PPL widget klíč (klient.ppl.cz/widgetadmin, vyžaduje PPL
obchodní účet - **závisí na Janovi**), 2) nastavit env var, 3) ověřit tvar
dat z widgetu, 4) doplnit `validatePplPickupPoint()` + zavolat v checkoutu
pro oba dopravce, 5) e2e test. Odhad vývojářského času mimo čekání na PPL:
1-2 dny.

**Jak otestovat:** není co spustit (plán), viz review pro 5 otevřených
otázek k rozhodnutí.

---

## Napříč pipeline - opakující se nález

**`pnpm test` v `mobile/` je potvrzeně rozbitý** (chyba
`[BABEL] .../react-native-env.js: .plugins is not a valid Plugin property`,
verzní konflikt `jest-expo`/`@babel/core`/`react-native`). Nezávisle
potvrzeno třikrát (body 2, 5, 6) na neupraveném preexistujícím testu -
není to způsobené žádnou z dnešních změn, ale blokuje to regresní
testování stále rostoucího peněžně kritického kódu. Doporučuji jako
prioritní samostatný úkol.

## Provozní poznámka k dnešnímu běhu

Cron dvakrát narazil na "session limit" API uprostřed práce (bod 4 a
dvakrát bod 7) - vždy se to vyřešilo počkáním na reset limitu a
pokračováním ve STEJNÉM worktree/branch, žádná hotová práce se neztratila
díky průběžnému commitování. Jednou (při zakládání worktree pro bod 8)
došlo k chybě obsluhy - worktree se kvůli přetrvávajícímu cwd v terminálu
založil vnořeně uvnitř jiného worktree, ihned zjištěno a opraveno před
pokračováním.
