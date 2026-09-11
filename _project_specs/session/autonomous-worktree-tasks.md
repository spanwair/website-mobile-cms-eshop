# Autonomní zpracování bodů dne - 2026-09-03

Tento soubor je zdroj pravdy pro autonomní hodinový pipeline. Každá hodinová
instance (cron) MUSÍ nejdřív přečíst tento soubor, než cokoliv udělá.

## Globální pravidla (platí pro všechny body)

- Každý bod se zpracovává v izolovaném git worktree (`EnterWorktree` /
  `.claude/worktrees/<name>`), NIKDY přímo v hlavním checkoutu.
- Fáze zpracování každého bodu: **1) analýza a rozbor requirementu, 2)
  implementační plán, 3) coding plán, 4) implementace, 5) testy (Jest /
  Playwright E2E dle typu změny), 6) review dokument**.
- **NIKDY nemergovat do master a NIKDY nepushovat** - branch zůstává hotová a
  otestovaná, merge dělá Jan ručně po review. (Rozhodnutí uživatele
  2026-09-03.)
- Pracovat plně autonomně bez čekání na schválení mezi fázemi.
- Pokud je bod řetězený na předchozí bod (viz "base branch" níže), worktree
  se vytváří z branch toho předchozího bodu (`git worktree add <path> -b
  <new-branch> <base-branch>`), NE z master. Důvod: uživatel chce, aby
  navazující body stavěly na code base bodu, kterému se podobají.
- Dodržet `.claude/CLAUDE.md` (max 200 řádků/soubor, žádná duplicitní logika
  mimo `shared/`, žádné komentáře krom non-obvious WHY, žádné fallbacky).
- Pokud se dotýká `website/src/pages/admin/**`, `Sidebar.astro`,
  `admin.ts` nebo `permissions.ts` → nejdřív načíst skill
  `admin-permissions`.
- Žádné em dash "—", jen "-" (Jan globální pravidlo).
- Review dokumenty a shrnutí psát česky (uživatel komunikuje česky).
- Po dokončení bodu: zapsat review do `_project_specs/session/reviews/<id>-<slug>.md`
  (jak otestovat, co bylo uděláno, co zbývá, rizika) a aktualizovat status
  níže v tomto souboru.
- **Při každém založení nového worktree** (`git worktree add .claude/worktrees/<name> ...`)
  hned poté přidat odpovídající záznam do
  `website-mobile-template.code-workspace` v rootu repa: folder entry
  `{ "name": "worktree: <name>", "path": ".claude/worktrees/<name>" }` DO
  pole `folders`, a matching task `"Reset & Start - worktree: <name>"` do
  `tasks.tasks` (zkopírovat strukturu existujícího tasku, jen změnit label a
  `cwd` na `${workspaceFolder:worktree: <name>}`). Tento soubor je
  gitignored, needuje se commitovat. Viz paměť
  `feedback_auto_update_vscode_workspace`.
- Pokud se bod nevejde do jedné hodinové session, nechat status
  `in_progress` s poznámkou co je hotové a co zbývá - příští hodinová
  session pokračuje ve STEJNÉM worktree/branch, nezakládá nový.
- Zpracovávat body přesně v pořadí 1-8 níže. Další bod se nezačíná, dokud
  není předchozí `done` (nebo `blocked` s jasným důvodem pro Jana).

## Stav worktrees (aktualizovat po každé session)

| # | Bod | Branch | Base | Status | Worktree path |
|---|-----|--------|------|--------|---------------|
| 1 | Reálné eshopy místo šablon | `feat/real-eshops-list` | master | done | `.claude/worktrees/real-eshops-list` |
| 2 | Fakturační období + reálné náklady/výdělek/odvod | `feat/eshop-billing-periods` | master | done | `.claude/worktrees/eshop-billing-periods` |
| 3 | DB indexace/oddělení per-eshop | `feat/db-per-eshop-indexing` | master | done | `.claude/worktrees/db-per-eshop-indexing` |
| 4 | Login page carousel | `feat/login-carousel` | master | done | `.claude/worktrees/login-carousel` |
| 5 | Auto přechod 10% / fixní 2990 | `feat/auto-fee-tier` | feat/eshop-billing-periods (bod 2) | done | `.claude/worktrees/auto-fee-tier` |
| 6 | Audit fakturační distribuce | `audit/billing-distribution` | feat/auto-fee-tier (bod 5, obsahuje i 2) | done | `.claude/worktrees/billing-distribution-audit` |
| 7 | Migrace Stripe → PayU | `feat/payu-migration` | audit/billing-distribution (bod 6, obsahuje 2+5+6) | done | `.claude/worktrees/payu-migration` |
| 8 | PPL pickup-point mapa - jen plán | `plan/ppl-pickup-map` | master | done | `.claude/worktrees/ppl-pickup-map` |

Status hodnoty: `pending`, `in_progress`, `blocked`, `done`.

**Cron job ID:** `b80b1a99` (hodinově v :12, session-only, exspiruje po 7 dnech -
až budou všechny body `done`/`blocked`, poslední iterace ho sama smaže přes
`CronDelete`).

**DŮLEŽITÉ omezení:** Tento cron běží pouze uvnitř této Claude Code CLI
session. Pokud se terminál/session zavře, hodinové zpracování se zastaví -
rozdělané worktrees a tento soubor zůstanou zachované, lze pokračovat ručně
příkazem "pokračuj v autonomním zpracování bodů dne" v nové session.

---

## Bod 1 - Reálné eshopy místo šablon

**Originální zadání:** Nad šablony dáme reálné weby které již na platformě
běží. První z nich je Kytka z Beskyd e-shop. Jako další dáme šablony.
E-shopy budou do budoucna přibývat. Chceme tedy je řadit do listu.
Screenshot, jméno eshopu, popis. Tlačítko do eshopu. Pod listem bude další
block který bude vybízet lidí k založení vlastního eshopu. Pod tím budou
teprve vylistované šablony. Šablony dočasně odeber, ale neodebírej je z
databáze, pouze z listů, teď budou aktivní pouze eshopy. Přejmenuj šablonu
sekci na "Reálné eshopy".

**Poznámky pro subagenta:**
- Najít, kde se dnes na webu renderují "šablony" (landing/marketing stránka,
  pravděpodobně `website/src/pages/` nějaká sekce templates).
  Kytka z Beskyd je referenční implementace: `supabase/seed/kytka_store_*.sql`.
- Zjistit, jestli existuje mechanismus pro "aktivní eshopy na platformě"
  (dotaz do `store_configs`/`parties` s nějakým `is_live`/`status` flagem) -
  pokud ne, navrhnout ho v analýze.
- Data pro list: screenshot, jméno, popis, CTA tlačítko do eshopu.
- Neodstraňovat šablony z DB, pouze z UI listů (flag/filter, ne DELETE).
- Sekce s výzvou k založení vlastního eshopu mezi listem eshopů a listem šablon.

---

## Bod 2 - Fakturační období per eshop + reálné náklady/výdělek/odvod

**Originální zadání:** Chceme aby si každý e-shop vylosoval vlastní
fakturaci za daný měsíc od 01 do posledního dne v měsíci (27, 30, 31) dní
podle toho kolik bylo v měsíci dnů. Poté musí být znát reálné náklady,
výdělek, odvod eshopu pro nás za fixní nebo 10% odvod. Vždy chceme aby měl
e-shop data k dani z příjmů stejně tak aby si mohl vyexportovat reálné a
hrubé výdělky. Již máme list v overview, teď ho potřebujeme dodělat.

**Poznámky pro subagenta:**
- Najít existující "list v overview" (pravděpodobně admin dashboard /
  reports / nějaká billing tabulka) a navázat na něj, ne stavět od nuly.
- Fakturační období = kalendářní měsíc (1. až poslední den, 27-31 dní dle
  měsíce).
- Potřeba: hrubý výdělek (obrat), reálné náklady, čistý výdělek, platforma
  odvod (10 % NEBO fixních 2990 Kč - viz bod 5 pro logiku přepínání).
- Export dat pro daň z příjmů (CSV/PDF export hrubých i reálných výdělků).
- Prostuduj `feedback_pricing_model.md` z paměti (10% vs €499/€799 fixed
  tiers) - ověřit, jestli aktuální DB schéma pro platby/odvody vůbec
  existuje, nebo se zakládá poprvé zde.

---

## Bod 3 - DB indexace/oddělení per-eshop pro performance

**Originální zadání:** Jak se budeme rozvíjet tak bude potřeba rozdělit i
databáze tak aby byla lépe performance aktivní pro daný e-shop. Napadá mě
tedy je lépe indexovat podle id eshopu a poté další požadovaná data. Hlavní
aby veškerý e-shop měl svůj vlastní indexační rozvrh a nezasahoval nijak do
jiného eshopu. Tohle neplatí pro administraci. Nemění nic v rolích, ty
zůstávají stejné. Změň pouze akce přes e-shop.

**Poznámky pro subagenta:**
- Toto je čistě performance/indexing úloha (composite indexy na
  `party_id`/`store_id` + další predikáty), NE sharding na úrovni
  samostatných databází (jde o jeden Supabase/Postgres). Ověřit v analýze,
  že to takto uživatel myslí, a napsat to explicitně do review.
- NESMÍ se dotknout `shared/constants/permissions.ts`, rolí, RLS policy
  logiky pro adminy - pouze zákaznické/eshop dotazy.
- Zkontrolovat `supabase/migrations/` na chybějící indexy na hlavních
  tabulkách (products, orders, inventory_items, categories...) filtrovaných
  podle party/store id.

---

## Bod 4 - Login page carousel

**Originální zadání:** Změň login page. Namísto animace použij cca 5
obrázků které budou jako automatizovaný carousel. Všechny musí být primárně
zaměřené jako e-shop obrázky. Trochu zvětši celý kontext pro PC view a
dodělej styly tak aby více vyhovovaly standardnímu web e-shop login designu,
nedělej mnoho změn, stačí se zaměřit pouze na věci které se dají vylepšit.

**Poznámky pro subagenta:**
- Malý, cílený UI zásah - nepřepisovat celou login page.
- 5 e-shop-tematických obrázků v auto-carouselu nahrazujících současnou
  animaci.
- Mírně zvětšit layout pro desktop/PC view.
- Otestovat vizuálně (dev server + prohlížeč), ne jen typecheck.

---

## Bod 5 - Automatický přechod 10 % ↔ fixní 2990 Kč

**Originální zadání:** Přidej současný automatický přechod mezi 10 % a
fixní částkou 2990 jako maximum při dovršení income v měsíci nad 29900.
Tento přechod se musí vyvolávat automaticky a automaticky i ukončovat, když
tato částka klesne. Uživatel musí být vždy notifikován jak v administraci
tak i emailem. Tato akce se vyhodnocuje až 1. dne dalšího měsíce, tak abychom
věděli, že za celé předchozí období daný e-shop navršil, nebo zůstává na
10 %.

**Poznámky pro subagenta:**
- Staví na bodu 2 (fakturační období) - worktree branchuje z
  `feat/eshop-billing-periods`.
- Práh: měsíční obrat > 29 900 Kč → odvod = fixní 2990 Kč (strop). Pod touto
  hranicí → odvod = 10 % z obratu.
- Vyhodnocení výhradně 1. den následujícího měsíce za PŘEDCHOZÍ uzavřené
  období (ne real-time v průběhu měsíce).
- Reverzibilní automaticky (přechod zpět na 10 %, když měsíční obrat klesne
  pod práh v jiném měsíci).
- Notifikace: in-app (administrace) + email, pokaždé při změně režimu.

---

## Bod 6 - Audit fakturační distribuce (KRITICKÉ, jediný zdroj příjmu platformy)

**Originální zadání:** Ověř funkčnost ověření fakturace a kolik se má
danému eshopu zaslat výdělek za daný měsíc. Celý měsíc e-shop vydělává a 1.
dne v měsíci se udělá reálná distribuce peněz za minulý měsíc, od toho se
pro nás odpočítá 10 % nebo 2990 z každého eshopu. Zjisti jak celkově tyto
funkce fungují, zkontroluj veškerou funkčnost, velice detailně. Dej si
záležet, protože toto je zatím jediná věc, na které platforma bude reálně
vydělávat.

**Poznámky pro subagenta:**
- Toto je primárně AUDIT/verifikace (staví na bodech 2 a 5, branchuje z
  `audit/billing-distribution` base = `feat/auto-fee-tier`), ne nová
  feature. Cíl: prokázat výpočtem/testy, že částka poslaná eshopu = obrat -
  platforma odvod, přesně a bez chyb v zaokrouhlení, edge-case měsících
  (27/28/29/30/31 dní), edge-case na hranici 29 900 Kč.
- Napsat exhaustivní testovací sadu (jednotkové + integrační) pokrývající:
  přechod 10%→fixní, fixní→10%, přesně na hranici, měsíc s refundovanými
  objednávkami, měsíc bez žádných objednávek, souběh více eshopů zároveň.
  Idempotence: co se stane, když se distribuční job spustí 1. dne měsíce
  dvakrát (nesmí zdvojit platbu).
- Pokud najde bug, opravit ho a jasně to uvést v review (nejde jen o
  reporting, ale o funkční opravu, protože toto je peněžně kritické).
- Výstupem MUSÍ být explicitní review dokument s tabulkou nalezených
  problémů a jejich stavem (opraveno/potvrzeno jako OK).

---

## Bod 7 - Migrace platebního systému Stripe → PayU

**Originální zadání:** Chceme celý payment systém předělat na PayU,
protože Stripe je příliš drahý. Analyzuj veškeré napojení, včetně nutných
změn a co bude vše potřeba k přechodu na PayU. Poté vytvoř detailní plán a
nakonec implementuj. Změň i e2e testy - natáčet a detailně otestovat.

**Poznámky pro subagenta:**
- Staví na bodu 6 (branchuje z `audit/billing-distribution`), protože
  změna platebního gatewaye se přímo dotýká výpočtu odvodu/distribuce
  peněz auditované v bodě 6.
- Toto je největší a nejrizikovější bod ze všech osmi. Pokud se nevejde do
  jedné hodinové session, POKRAČOVAT v dalších hodinách ve stejném
  worktree - neuzavírat narychlo.
- Fáze: 1) kompletní inventura všech míst, kde se dnes používá Stripe
  (checkout, webhooks, Connect/payouts, refundy, e2e testy), 2) srovnání s
  PayU REST API (checkout, notifikace/webhooky, refundy, marketplace/split
  payout ekvivalent Connectu - PayU nemá 1:1 Connect ekvivalent, ověřit jak
  řešit multi-tenant výplaty), 3) detailní plán migrace (feature-flag
  přechod, ne big-bang, pokud jde), 4) implementace, 5) e2e testy Playwright
  včetně nahrávky (video/trace) celého checkout+refund flow, 6) review.
- Nesmí se dotknout produkčních Stripe klíčů/prostředí bez výslovného
  svolení - pracovat proti sandboxu/testovacím klíčům PayU.
- Načíst skill `stripe-best-practices` a `stripe-docs` pro inventuru
  současného stavu před psaním plánu.

---

## Bod 8 - PPL pickup-point mapa (POUZE PLÁN, needimplementovat)

**Originální zadání:** Na Develop serveru máme stále pro PPL delivery to
box pouze mockovaná data na výběr. Chceme reálnou mapu, plugin a reálné
adresy, z kterých si bude moci uživatel vybrat, kam zásilku odeslat.
Analyzuj PPL dokumentaci a vytvoř implementační plán, který budeme poté
implementovat.

**Poznámky pro subagenta:**
- DŮLEŽITÉ: uživatel chce pouze analýzu + implementační plán, NE
  implementaci (na rozdíl od všech ostatních bodů). Nepsat produkční kód,
  jen prozkoumat aktuální mock implementaci PPL pickup-pointů v repu,
  nastudovat PPL Parcel Shop / PPL Access Point API dokumentaci a napsat
  detailní implementační plán (widget/mapa možnosti, PPL Access Point
  Locator API vs. vlastní mapa+PPL adresní feed, náklady na integraci).
- Výstup: `_project_specs/session/reviews/8-ppl-pickup-map-plan.md` s
  konkrétním, do budoucna vykonatelným plánem (kroky, soubory k úpravě,
  API endpoints, odhad práce).
- Worktree pro tento bod může zůstat prázdný na kódu - obsahuje jen
  plánovací dokument, žádné code changes nejsou očekávané.
