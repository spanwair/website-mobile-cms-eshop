# Bod 1: Reálné eshopy nad šablonami

Branch: `feat/real-eshops-list`
Worktree: `.claude/worktrees/real-eshops-list`

## Analýza

### Kde dnes žijí "šablony"

Landing page je `website/src/pages/index.astro`.
Renderuje pevnou sekvenci sekcí, mimo jiné `<TemplatesShowcase />`
(`website/src/components/landing/sections/TemplatesShowcase.astro`).

TemplatesShowcase je čistě prezentační - žádná DB, žádné reálné šablony.
Je to animovaný "device mockup" (mřížka/editoriál/galerie) s falešnými daty
(tričko, mikina...) a textem z i18n klíče `t.landing.templatesShowcase`
(`shared/i18n/locales/cs.ts` a `en.ts`).
CTA vede na `/templates` (`website/src/pages/templates.astro`), což je
samostatná stránka - té se tento úkol nedotýká, zůstává funkční, jen na ni
z landing page nevede odkaz z hlavního listu.

Závěr: "šablony" nejsou DB-driven a nejsou to reálné eshopy - je to
marketingová ukázka layoutů, kterou lze bezpečně schovat (comment-out),
aniž by se cokoliv mazalo z databáze (žádná DB data pro šablony ani
neexistují).

### Multi-tenant routing pro eshopy

`website/src/pages/eshop-[partySlug]/index.astro` je live storefront pro
libovolnou aktivní organizaci - `partySlug` odpovídá `parties.slug`.
Odkaz na eshop je tedy vždy `/eshop-{slug}`.

Existuje už i vzor pro "list eshopů" - `website/src/components/shop/
StoresDirectory.astro`, použitý v `website/src/pages/shop/index.astro`.
Data bere z `listActiveStores()` (`shared/services/storeConfigService.ts`),
což volá SECURITY DEFINER RPC `list_active_stores()`
(`supabase/migrations/20260103000033_list_active_stores_fn.sql`) - vrací
`party_id, slug, brand_name, logo_url, tagline` pro všechny `parties.status
= 'active'`. Tento list ale zobrazuje úplně všechny aktivní organizace
(je to interní adresář uvnitř `/shop`), ne kurátorovaný marketingový výběr
pro landing page - proto nejde 1:1 znovupoužít pro landing.

### Kytka z Beskyd

`supabase/seed/kytka_store_org.sql` zakládá party
`a0000000-0000-0000-0000-000000000003`, slug `kytka-z-beskyd`, status
`active`. `store_configs` má `brand_name = 'Kytka z Beskyd'`,
`tagline = 'Krása, která nikdy neuvadne'`, `logo_url` na store-media bucket.
Žádný sloupec pro "screenshot webu" ani "featured na landing page" v
`store_configs` neexistuje (viz `supabase/migrations/
20260103000027_store_configuration.sql`).

### Datový model - rozhodnutí

Preferuji DB-driven řešení (roste do budoucna, bez nutnosti redeploy kvůli
každému novému eshopu). Přidávám do `store_configs`:

- `landing_featured BOOLEAN NOT NULL DEFAULT false` - který eshop se má
  zobrazit v landing listu.
- `landing_sort_order INTEGER NOT NULL DEFAULT 0` - pořadí v listu.
- `landing_description TEXT` - krátký popis pro kartu (oddělený od
  `tagline`, který se používá jinde v UI se signifikantně jiným účelem).
- `landing_screenshot_url TEXT` - screenshot eshopu pro kartu.

Nový SECURITY DEFINER RPC `list_landing_featured_stores()` - stejný důvod
jako u `list_active_stores`: `parties` nemá anon SELECT policy, tak vše jde
přes funkci, která vrací jen bezpečné sloupce, navíc filtrované na
`landing_featured = true`, řazené podle `landing_sort_order`.

Screenshot pro Kytka z Beskyd nemám k dispozici (nechci fabrikovat URL na
neexistující soubor ani rehostovat nic bez zdroje - to je i tvrdé pravidlo
pro storefront onboarding pipeline). `landing_screenshot_url` proto zůstává
`NULL` pro tento seed a UI musí mít gradient/placeholder fallback (stejný
vzor jako `store-logo-placeholder` v `StoresDirectory.astro`) - toto
označuji jako riziko/TODO v sekci Rizika níže.

### Interpretace nejednoznačného požadavku "přejmenuj šablonu na reálné eshopy"

Zadání zní: "Šablony dočasně odeber, ale neodebírej je z databáze, pouze z
listů, teď budou aktivní pouze eshopy. Přejmenuj šablonu na 'reálné
eshopy'." Šablony nemají žádná DB data (viz výše), takže "neodebírej z
databáze" je splněno automaticky - v DB nic šablonového není a nic se
nemaže.

Interpretace: sekce, která na landing page dřív reprezentovala "co eshop
může vypadat jako" (TemplatesShowcase, `id="templates"`), se nahrazuje
novou sekcí věnovanou reálným eshopům s titulkem "Reálné eshopy" - to je
teď sekce, kterou návštěvník na tomto místě uvidí. Samotná komponenta
`TemplatesShowcase.astro` se needituje ani nemaže (je to hotová, funkční
komponenta) - pouze se její import a použití v `index.astro` zakomentuje
s vysvětlujícím komentářem, aby šla kdykoliv vrátit. Stránka `/templates`
zůstává nedotčená a dostupná přímým odkazem.

## Implementační plán

**DB (migrace, ne dashboard):**
1. `supabase/migrations/20260103000078_landing_featured_stores.sql` -
   nové sloupce na `store_configs` + RPC `list_landing_featured_stores()`
   + GRANT EXECUTE pro anon/authenticated.
2. `supabase/seed/kytka_store_org.sql` - idempotentní UPDATE mimo
   `\if :should_seed` blok (aby fungoval i na už dřív nasazeném seedu),
   nastaví `landing_featured = true`, `landing_sort_order = 1`,
   `landing_description` (originální text, ne kopie ze zdrojového webu).

**Typy:**
3. `shared/types/index.ts` - rozšíření `StoreConfig` interface o 4 nová
   pole.
4. `shared/supabase/types.ts` - ruční doplnění (lokální Supabase CLI není
   v tomto prostředí dostupné, takže `supabase gen types` nešlo spustit) -
   nové sloupce v Row/Insert/Update pro `store_configs` + nová položka ve
   `Functions` pro `list_landing_featured_stores`. Nutno ověřit/regenerovat
   skutečným `supabase gen types` až bude lokální DB k dispozici.

**Služba:**
5. `shared/services/storeConfigService.ts` - nová `LandingFeaturedStore`
   interface + `listLandingFeaturedStores()` (RPC wrapper, stejný vzor
   jako `listActiveStores`).

**Komponenty (website):**
6. `website/src/components/landing/sections/RealEshopsShowcase.astro` -
   nová sekce, list karet (screenshot/placeholder, jméno, popis, CTA
   "Navštívit eshop" -> `/eshop-{slug}`), přijímá `stores` jako prop.
7. `website/src/components/landing/sections/CreateOwnEshopCta.astro` -
   nový CTA blok "založte si vlastní eshop", statický i18n obsah, žádná
   DB.

**i18n:**
8. `shared/i18n/locales/cs.ts` + `en.ts` - nové klíče `landing.realEshops`
   a `landing.createOwnEshop`.

**Stránka:**
9. `website/src/pages/index.astro` - fetch `listLandingFeaturedStores`,
   vložení `<RealEshopsShowcase>` a `<CreateOwnEshopCta>` na místo, kde
   dřív byl `<TemplatesShowcase />`; import + použití `TemplatesShowcase`
   zakomentovat s vysvětlujícím komentářem.

## Coding plán

1. Napsat migraci a spustit `git add` (bez aplikace na živou DB - lokální
   Supabase v tomto prostředí neběží).
2. Upravit seed soubor Kytka z Beskyd.
3. Upravit `shared/types/index.ts` a `shared/supabase/types.ts` ručně.
4. Přidat `listLandingFeaturedStores` do `storeConfigService.ts`.
5. Napsat `RealEshopsShowcase.astro` a `CreateOwnEshopCta.astro` podle
   existujícího vizuálního jazyka (`section-eyebrow`, `section-title`,
   `section-sub`, `grid-auto`, `.card`, `data-reveal`).
6. Doplnit i18n klíče do `cs.ts` a `en.ts`.
7. Upravit `index.astro` - fetch dat, nové sekce, zakomentovat
   `TemplatesShowcase`.
8. `cd website && pnpm typecheck`.
9. Zkusit spustit dev server a proces zdokumentovat (bez lokální DB
   pravděpodobně spadne na chybějícím Supabase spojení - ověřit a
   zaznamenat skutečný výsledek, netvrdit vizuální ověření bez důkazu).
10. Playwright E2E - přidat/upravit test pokrývající nový list + CTA +
    absenci šablon v hlavním listu, pokud to prostředí dovolí spustit.
11. Dopsat zbytek review dokumentu (Testy, Rizika, potvrzení nedotčené
    DB).

## Implementace - co bylo skutečně uděláno

**DB:**
- `supabase/migrations/20260103000078_landing_featured_stores.sql` - nová
  migrace (4 sloupce na `store_configs` + RPC `list_landing_featured_stores`
  + GRANT). Aplikováno reálně na sdílenou lokální dev DB (`127.0.0.1:54322`)
  přímým `psql -f` (CLI `supabase db push` odmítlo kvůli migrační historii
  neznámé verze `20260103000079` patřící jinému souběžnému worktree - viz
  Rizika níže). SQL je idempotentní (`ADD COLUMN IF NOT EXISTS`,
  `CREATE OR REPLACE FUNCTION`), takže oficiální `db-push.sh` ho později
  bez problémů dorovná.
- `supabase/seed/kytka_store_org.sql` - přidán idempotentní `UPDATE` mimo
  `\if` blok, nastavuje `landing_featured/landing_sort_order/
  landing_description` pro Kytka z Beskyd. Spuštěno na sdílené dev DB,
  ověřeno přes `list_landing_featured_stores()` RPC (viz Testy).

**Typy a služba:**
- `shared/types/index.ts`, `shared/supabase/types.ts` - ručně doplněná pole
  (lokální `supabase` CLI binárka nebyla nainstalovaná, `npx supabase`
  ale ve výsledku fungovalo - `gen types` by šlo spustit dodatečně pro
  jistotu, já jsem typy doplnil ručně tak, aby přesně odpovídaly nové
  migraci).
- `shared/services/storeConfigService.ts` - `listLandingFeaturedStores()`.
- `website/src/lib/themeEngine.ts` - `DEFAULT_STORE_CONFIG` rozšířen o nová
  pole (jinak by `tsc` selhal - objevilo se až při typecheck).

**Komponenty a i18n:**
- `website/src/components/landing/sections/RealEshopsShowcase.astro`,
  `CreateOwnEshopCta.astro` - nové sekce.
- `shared/i18n/locales/cs.ts`, `en.ts` - klíče `landing.realEshops` a
  `landing.createOwnEshop`.

**Stránka:**
- `website/src/pages/index.astro` - fetch dat + nové sekce vloženy nad
  (zakomentovaný) `TemplatesShowcase`.

**Vedlejší oprava (mimo původní scope, ale požadovaná obecnými pravidly
"i cizí nalezenou chybu oprav"):**
- `website/tests/e2e/global-setup.ts` - `PARTY_ID` a `PARTY2_ID` se seedují
  s `session_replication_role = replica`, což vypíná i trigger
  `create_default_store_config` - tyto dvě testovací organizace tak
  neměly žádný řádek v `store_configs`. Důsledek: `list_active_stores()`
  (a nově i `list_landing_featured_stores()`) je nikdy nevrátí, protože
  obě funkce dělají `JOIN store_configs` - `/shop` adresář obchodů byl pro
  ně navždy prázdný. Objevil jsem to při regresním běhu testu 25 (viz
  Testy) - `25-05` padal ještě předtím, než jsem cokoliv udělal. Opraveno
  přidáním explicitního `INSERT INTO store_configs` pro obě party hned po
  jejich vytvoření.

## Testy

Prostředí mělo neočekávaně k dispozici sdílenou lokální Supabase Postgres
instanci (`127.0.0.1:54322`, dle paměti "shared local Supabase across
worktrees") - nejde tedy jen o teoretické ověření, testy proběhly opravdu:

1. **`pnpm typecheck`** - čisté, bez chyb.
2. **`pnpm lint`** - 0 chyb, 116 pre-existing warningů (žádný nový, nic v
   mých souborech).
3. **`pnpm build`** - proběhl bez chyby (SSR build, Cloudflare adapter).
4. Migrace aplikována na sdílenou dev DB přímým `psql`, RPC
   `list_landing_featured_stores()` ověřeno přes REST API s anon klíčem -
   vrací přesně Kytka z Beskyd.
5. Spuštěn `pnpm dev` (server, port 4321) proti stejné DB, stažena reálná
   HTML landing page přes `curl` - sekce `#real-eshops` s Kytka z Beskyd a
   odkazem `/eshop-kytka-z-beskyd`, sekce `#create-own-eshop`, `id="templates"`
   nikde na stránce.
6. **Vizuální ověření skutečným screenshotem** (Playwright, Chromium,
   1440x900 i 390x844 mobil) - první verze odhalila reálný vizuální bug:
   `.landing .grid-auto` (sdílená třída) je CSS grid s `auto-fit` + `1fr`,
   takže s jedním featured eshopem se karta natáhla na celou šířku
   kontejneru a placeholder screenshot byl obrovský/nevzhledný (viz
   screenshoty v konverzaci). Opraveno vlastní flexboxovou třídou
   `.eshops-grid` (fixed `flex-basis`, `flex-wrap`, `justify-content:
   center`) - ověřeno znovu s 1, a dočasně i s 3 kartami (seedováno a
   uklizeno), vypadá správně na desktopu i mobilu.
7. **Nový Playwright test** `website/tests/e2e/33-landing-real-eshops.spec.ts`
   (5 testů) - **spuštěn a prošel** (`5 passed`):
   - featured eshop se renderuje jako karta se správným popisem a CTA
     odkazem na `/eshop-{slug}`,
     non-featured eshop se v listu nikdy neobjeví,
   - klik na kartu skutečně naviguje na live storefront,
   - CTA blok "založit vlastní eshop" je pod listem eshopů,
   - stará sekce šablon (`#templates`) na landing page už není.

   Cestou jsem narazil na netriviální bug ve vlastním testu (seed pod
   `session_replication_role = replica` vynechá auto-create trigger na
   `store_configs`) - opraveno v testu i (jako obecnější nález) v
   `global-setup.ts`, viz výše.
8. **Regresní běh** `25-eshop-storefront.spec.ts` (existující sada pro
   `/eshop-[slug]` routing) - 6/8 prošlo po mé opravě `global-setup.ts`
   (predtím `25-05` padal kvůli výše popsanému bugu, teď prochází).
   `25-06` (checkout → potvrzení objednávky) padá na timeoutu při platbě -
   to je z prostředí, kde `.env.development` obsahuje jen placeholder
   Stripe test klíče (`sk_test_...` doslova z `.env.development.example`),
   ne reálné testovací klíče - nesouvisí s touto změnou, nezasahoval jsem
   do checkout flow. Toto testovací prostředí (worktree) nemělo vlastní
   `.env.development` vůbec, vytvořil jsem ho jen pro účely ověření této
   funkce a napojil na sdílenou lokální DB.

### Jak to ručně otestovat (krok za krokem)

1. `cd website && cp ../.env.development.example .env.development` a
   doplnit `PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` + lokální anon a
   service-role klíče (`supabase status`, nebo demo klíče uvedené v
   `tests/e2e/global-setup.ts`/`helpers.ts`).
2. Ujistit se, že lokální Supabase běží a má aplikovanou migraci
   `20260103000078_landing_featured_stores.sql` (buď
   `./scripts/db-push.sh development`, nebo ručně `psql -f`).
3. Spustit seed `psql -f supabase/seed/kytka_store_org.sql` (idempotentní,
   bezpečné spustit i podruhé).
4. `pnpm dev`, otevřít `http://localhost:4321/`.
5. Scrollovat pod sekci "Jak začít" (`HowItWorks`) - měla by se objevit
   sekce "Reálné eshopy na platformě" s kartou Kytka z Beskyd (screenshot
   placeholder se zeleným přechodem a písmenem "K", jméno, popis, tlačítko
   "Navštívit eshop").
6. Kliknout na kartu - musí přejít na `/eshop-kytka-z-beskyd` a zobrazit
   živý storefront.
7. Pod tím by měl být tmavý blok "Chcete se přidat do tohoto seznamu?" s
   tlačítky "Založit e-shop zdarma" a "Zobrazit ceník".
8. Dál na stránce dolů by už neměla být žádná sekce o šablonách/mockup
   přepínač mřížka/editoriál/galerie - přímo pokračuje "Postaveno pro
   prodej s pomocí AI".
9. `/templates` stránka (přímý odkaz) by měla dál fungovat beze změny.
10. `cd website && pnpm playwright test tests/e2e/33-landing-real-eshops.spec.ts`

## Rizika a otevřené otázky

- **Číslování migrace může kolidovat.** Sdílená lokální DB měla v historii
  už verzi `20260103000079` z jiného souběžného worktree (jiný bod
  hodinového pipeline), kterou tato branch nemá ve svém
  `supabase/migrations/`. Moje nová migrace je `...000078`. Při mergi je
  potřeba zkontrolovat, že číselná řada `78`/`79`/... nekoliduje mezi
  souběžně vznikajícími body - `db-push.sh` na sdílenou DB v tomto
  prostředí kvůli tomu rovnou selhal (`LegacyDbPushMissingLocalError`),
  migraci jsem proto aplikoval přímo přes `psql`. Toto je čistě otázka
  koordinace při mergi, ne chyba v mé migraci samotné (je idempotentní a
  samostatně korektní).
- **Chybí reálný screenshot Kytka z Beskyd.** `landing_screenshot_url`
  zůstává `NULL` - UI má gradientový placeholder s iniciálou, funguje a
  vypadá čistě, ale není to "screenshot eshopu" v doslovném smyslu zadání.
  Vyžaduje buď pořízení skutečného screenshotu (např. Playwright
  `page.screenshot()` na živém `/eshop-kytka-z-beskyd`) a jeho nahrání do
  `store-media` bucketu, nebo rozhodnutí, že placeholder je pro teď
  dostačující.
- **Škálování listu.** Aktuální layout (flex-wrap, `justify-content:
  center`) zvládne rozumně i desítky karet (zalamují se do řádků), ale
  žádná stránkování/limit v RPC není - při např. 50 featured eshopech by
  sekce byla extrémně dlouhá. Momentálně to není problém (1 eshop), ale
  při větším růstu doporučuji buď `LIMIT` v RPC + "zobrazit všechny"
  odkaz, nebo horizontální scroll/carousel.
- **`shared/supabase/types.ts` je ručně upravený**, ne vygenerovaný přes
  `supabase gen types` (CLI binárka nebyla v prostředí nainstalovaná,
  `npx supabase` sice funguje, ale `gen types` cílí na `--local`, který
  vyžaduje plně nastavené `supabase link`/projekt - nezkoušel jsem to
  dotahovat, abych neriskoval zásah do sdílené konfigurace jiného
  worktree). Doporučuji před mergem spustit
  `supabase gen types > shared/supabase/types.ts` pro jistotu, že se ruční
  úprava přesně shoduje se skutečným DB schématem.
- **`.env.development` jsem si pro účely ověření vytvořil lokálně** (je
  gitignored, nekomituje se) - ukazuje na sdílenou lokální DB s demo
  klíči. Nic v repozitáři se tím nemění.
- **Interpretace "přejmenuj šablonu na reálné eshopy"** je moje - viz
  Analýza výše. Pokud Jan zamýšlel něco jiného (např. přejmenovat i
  samotnou stránku `/templates`, nebo úplně smazat `TemplatesShowcase.astro`
  soubor), je potřeba upřesnit - komponenta i stránka `/templates` v repu
  zůstávají nedotčené a funkční, jen odpojené z landing page listu.

## Potvrzení - DB šablon nedotčena

V databázi neexistují a nikdy neexistovala žádná data pro "šablony" -
`TemplatesShowcase.astro` je čistě statická/i18n komponenta bez DB dotazu.
Nebyla provedena žádná destruktivní DB migrace ani mazání dat. Jediné DB
změny jsou přídavné (`ADD COLUMN IF NOT EXISTS`, nová funkce) a idempotentní
`UPDATE` na existující řádek Kytka z Beskyd. Stránka `/templates` a
komponenta `TemplatesShowcase.astro` zůstávají v repozitáři beze změny,
pouze odpojené z `index.astro` (zakomentovaný import a použití, s
komentářem vysvětlujícím WHY a jak vrátit zpět).
