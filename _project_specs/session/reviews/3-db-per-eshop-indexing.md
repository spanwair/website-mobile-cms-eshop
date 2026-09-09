# Review: 3 - DB indexace per e-shop

Branch: `feat/db-per-eshop-indexing`
Worktree: `.claude/worktrees/db-per-eshop-indexing`
Migrace: `supabase/migrations/20260103000180_eshop_scoped_query_indexes.sql`

## Interpretace zadání

Uživatel mluvil o "rozdělení databáze" a "vlastní indexačním rozvrhu" pro každý e-shop.
V systému je jeden Postgres/Supabase projekt, žádný sharding na úrovni fyzicky oddělených databází.

Interpretace: jde o to, aby dotazy specifické pro jeden e-shop (produkty, kategorie, objednávky,
inventář, košík, recenze z pohledu zákazníka/storefrontu) měly composite indexy vedené sloupcem
`party_id` (případně `customer_id`/`product_id`, pokud daný sloupec už sám o sobě implikuje
právě jeden e-shop), tak aby růst dat u jednoho e-shopu neměl dopad na výkon dotazů jiného e-shopu.

Tato interpretace se **potvrdila** analýzou kódu - naprostá většina storefront/checkout dotazů
už dnes filtruje podle `party_id` jako prvního predikátu (viz níže), ale několik konkrétních
horkých cest v `shared/services/*.ts` a `website/src/lib/shopQueries.ts` buď nemá odpovídající
index vůbec, nebo existující index nezačíná sloupci, které dotaz skutečně používá.

Administrace (cross-party admin dotazy, role, RLS pro adminy) **nebyla nijak měněna** - viz
sekce "Potvrzení nedotčené admin logiky" níže.

## Analýza

Prošel jsem `supabase/migrations/` (hlavně `20260102000005_eshop_catalog.sql`,
`20260102000006_eshop_orders.sql`, `20260102000007_eshop_pricing.sql`,
`20260102000008_eshop_inventory.sql`, `20260102000016_reviews.sql`, `20260102000017_cart.sql`,
`20260102000018_wishlist.sql`, `20260102000020_returns.sql`, `20260103000049_product_conditions.sql`,
`20260103000057_customer_self_service_orders.sql`) a všechny storefront-relevantní service
soubory (`shared/services/productService.ts`, `orderService.ts`, `inventoryService.ts`,
`searchService.ts`, `categoryService.ts`, `cartService.ts`, `customerService.ts`,
`reviewService.ts`, `wishlistService.ts`) plus `website/src/lib/shopQueries.ts`
(hlavní storefront listing pro `/shop` a `/eshop-[partySlug]`).

### Co už bylo v pořádku

- `products(party_id, status)`, `products(party_id, slug)`, `orders(party_id, status)`,
  `orders(party_id, created_at DESC)`, `categories(party_id, parent_id)`,
  `customers(party_id, email)`, `inventory_items(party_id, product_id)`,
  `product_reviews(product_id, status)` + `(party_id, status)`,
  `wishlist_items`, `product_conditions(condition_id)` na products/variants - všechny už
  mají správně vedený `party_id` (nebo jinou vhodnou vedoucí kolonu) a odpovídají skutečným
  WHERE vzorům v kódu.

### Nalezené mezery (potvrzeno přes `pg_indexes` na lokální sdílené Supabase instanci)

1. **`products`** - storefront listing (`shopQueries.fetchShopData`) filtruje vždy
   `party_id + status='active' + is_visible=true` a řadí buď podle `created_at` (default),
   `price`, nebo `rating_avg`. Existující `idx_products_party_status` neobsahuje `is_visible`
   ani řadicí sloupec, takže Postgres by musel dodatečně třídit po filtraci. Featured widget
   (homepage) navíc filtruje `is_featured=true`.
2. **`product_categories`** - filtr podle kategorie (`.eq("product_categories.category_id", id)`,
   inner join) nemá index - PK je `(product_id, category_id)`, tedy `category_id` není použitelný
   jako vedoucí sloupec. Potvrzeno: `EXPLAIN` ukázal `Seq Scan` s `Filter: (category_id = $0)`.
3. **`inventory_items`** - `fetchOutOfStockMap`/`fetchInventoryTrackingMap`/
   `fetchInventoryByProduct`/`fetchInventoryRowsByProduct` filtrují podle `product_id` (nebo
   IN-listu `product_id`) bez `party_id` v daném volání. Existující
   `idx_inventory_party_product (party_id, product_id)` nejde použít efektivně bez znalosti
   `party_id`. Tohle je jedna z nejčastěji volaných cest - běží na každé kartě produktu na
   každém listingu.
4. **`orders`** - `fetchOrders` (customer_id filtr), `customerService.fetchCustomer`
   (order_count) a hlavně RLS politika `"Customers read own orders"`
   (`customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())`) filtrují podle
   `customer_id` bez indexu. `payment_status` filtr ve `fetchOrders` také nemá odpovídající
   index (analogicky k `idx_orders_party_status`).
5. **`customers`** - RLS `"Customers read own record"` a `"Customers read own orders"` filtrují
   `user_id = auth.uid()` - bez indexu vůbec.
6. **`addresses`** - FK `customer_id` bez indexu (adresář zákazníka, výběr adresy při checkoutu).
7. **`carts`** - `getOrCreateCart` filtruje `party_id` SOUČASNĚ s `user_id` NEBO `session_id`
   v jednom dotazu. Existující indexy `idx_carts_user`/`idx_carts_session` jsou
   jednosloupcové - dvoupredikátový dotaz (běží prakticky na každém zobrazení storefrontu kvůli
   košíku a při každém přidání do košíku) nemá dedikovaný composite index.

### EXPLAIN ANALYZE proti lokální instanci

Lokální sdílená Supabase (port 54322) má jen malá seed data (řádově jednotky až desítky řádků
na tabulku, protože ji sdílí více worktree agentů souběžně). Proto Postgres plánovač i bez
nových indexů zvolí `Seq Scan` - při tak malém počtu řádků je to objektivně nejlevnější plán,
žádný index ho nepřebije. Baseline (před migrací) na 3 reprezentativní dotazy proto ukazuje
`Seq Scan` ve všech případech - viz sekce "Testy" níže s konkrétními plány.

## Implementační plán

Chybějící indexy (tabulka / sloupce / typ):

| # | Tabulka | Sloupce | Typ | Zdůvodnění (WHERE/ORDER BY v kódu) |
|---|---------|---------|-----|--------------------------------------|
| 1 | products | `(party_id, created_at DESC)` | partial btree `WHERE status='active' AND is_visible=true` | default řazení storefront listingu |
| 2 | products | `(party_id, price)` | partial btree, stejná podmínka | `sort=price_asc/price_desc` |
| 3 | products | `(party_id, rating_avg DESC)` | partial btree, stejná podmínka | `sort=rating` |
| 4 | products | `(party_id, created_at DESC)` | partial btree `WHERE status='active' AND is_visible=true AND is_featured=true` | homepage featured widget |
| 5 | product_categories | `(category_id, product_id)` | btree (covering, PK je opačně) | filtr podle kategorie |
| 6 | inventory_items | `(product_id, variant_id)` | btree | stock mapy volané na každé kartě produktu |
| 7 | orders | `(customer_id, created_at DESC)` | btree | self-service RLS + fetchOrders + order_count |
| 8 | orders | `(party_id, payment_status)` | btree | fetchOrders payment_status filtr |
| 9 | customers | `(user_id)` | partial btree `WHERE user_id IS NOT NULL` | RLS self-service lookup |
| 10 | addresses | `(customer_id)` | btree | FK bez indexu, checkout/adresář |
| 11 | carts | `(party_id, user_id)` | partial btree `WHERE user_id IS NOT NULL` | getOrCreateCart dvoupredikátový dotaz |
| 12 | carts | `(party_id, session_id)` | partial btree `WHERE session_id IS NOT NULL` | getOrCreateCart pro hosty |

Pořadí sloupců u `products` je zvoleno tak, že filtrovací podmínky (`status`, `is_visible`,
`is_featured`) jsou vyřešeny přímo v partial-index predikátu (`WHERE`), a index samotný nese jen
`party_id` + skutečný řadicí sloupec - index tak zůstává malý a zároveň přesně sedí na
`ORDER BY`.

## Coding plán

Jedna migrace (`20260103000180_eshop_scoped_query_indexes.sql`) - všech 12 indexů je čistě
aditivních, nic se nemaže ani nepřejmenovává, takže nehrozí konflikt při aplikaci a dává smysl
je držet pohromadě jako jeden logický celek ("per-eshop query indexing"). Na konci `ANALYZE`
na dotčených tabulkách, aby plánovač měl aktuální statistiky ihned po vytvoření indexů.

### Volba čísla migrace

V `supabase/migrations/` (hlavní checkout i tento worktree) končilo očíslování na `...000077`.
V dalších souběžných worktree byl ale zjištěn konflikt na `...000078`
(`eshop-billing-periods` i `real-eshops-list` používají stejný prefix) a navíc worktree
`ai-admin-assistant` už zabral `...000078` a `...000079` jinými migracemi. Nejvyšší reálně
existující číslo napříč worktrees bylo tedy `79`. Zvolil jsem `20260103000180`
(79 + 100 rezerva, zaokrouhleno), aby při budoucím mergi všech větví nedošlo k další kolizi.

### CONCURRENTLY vs. běžný CREATE INDEX

Zadání žádalo `CREATE INDEX CONCURRENTLY IF NOT EXISTS` kde to dává smysl, s tím, že
`CONCURRENTLY` nejde uvnitř transakčního bloku. Ověřil jsem přímo na lokální DB:

```
BEGIN;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test ON products(party_id);
ROLLBACK;
-- ERROR:  CREATE INDEX CONCURRENTLY cannot run inside a transaction block
```

Supabase CLI (`supabase db push`) posílá obsah každého migračního souboru jako jeden
multi-statement příkaz, což Postgres implicitně obalí do jedné transakce - `CONCURRENTLY` by
tedy v běžném `db push` flow spolehlivě selhalo. Navíc jsem se pokusil `supabase db push`
reálně spustit z tohoto worktree a narazil jsem na už zmíněný konflikt čísel migrací mezi
souběžnými worktree (`LegacyDbPushMissingLocalError` - remote má aplikované `78`/`79`, které
tento worktree fyzicky nemá jako soubory) - to je mimo rozsah tohoto úkolu (bude se řešit při
mergi), ale potvrzuje to, že `CONCURRENTLY` v tomto repu zatím nikde použité není a zavedení by
vyžadovalo speciální non-transakční spouštěč, který projekt nemá.

**Rozhodnutí:** použit běžný `CREATE INDEX IF NOT EXISTS` (bez `CONCURRENTLY`) pro všech 12
indexů. Zdůvodnění je i přímo v hlavičce migračního souboru. Riziko viz "Rizika" níže.

## Implementace

Migrace: `supabase/migrations/20260103000180_eshop_scoped_query_indexes.sql`

Nic nemazáno, nic nepřejmenováno - pouze `CREATE INDEX IF NOT EXISTS` (12x) + `ANALYZE` (7x).
Žádný soubor pod `website/src/pages/admin/**`, `Sidebar.astro`, `admin.ts` ani
`shared/constants/permissions.ts` nebyl otevřen ani změněn.

## Testy

Migrace byla aplikována přímo na lokální sdílenou Supabase Postgres instanci (port 54322,
kontejner `supabase_db_website-mobile-template`) přes `psql` (bez `supabase db push`, viz výše
proč - historie migrací je mezi worktree dočasně nekonzistentní, což je mimo rozsah tohoto
úkolu). Všech 12 indexů bylo úspěšně vytvořeno a ověřeno v `pg_indexes`.

`cd website && pnpm typecheck` proběhl bez chyb (žádný TS soubor nebyl migrací dotčen, ale
požadavek byl explicitně ověřit).

### Before/After EXPLAIN ANALYZE (3 reprezentativní dotazy)

Data v lokální DB jsou malá (desítky řádků na tabulku), takže plánovač i po vytvoření indexů
přirozeně volí `Seq Scan`, protože je na tomhle objemu levnější - to je správné/očekávané
chování plánovače, ne chyba indexu. Aby šla ověřit strukturální použitelnost nových indexů,
použil jsem `SET enable_seqscan = off` (nedestruktivní, jen session-level nastavení plánovače)
a ukazuji, že dotaz index skutečně dokáže využít a vrací identická data.

**1) Listing produktů jednoho e-shopu (`party_id` + `status='active'` + `is_visible` + řazení podle `created_at`)**

Before (bez indexu, plánovač i s SEQ scan zapnutým):
```
Seq Scan on products
  Filter: (is_visible AND (status = 'active'::text) AND (party_id = $0))
  Rows Removed by Filter: 46
Execution Time: 0.091 ms
```

After (`enable_seqscan=off`, nucené použití indexu):
```
Bitmap Heap Scan on products
  Recheck Cond: ((party_id = $0) AND (status = 'active'::text) AND is_visible)
  ->  Bitmap Index Scan on idx_products_party_rating_active
        Index Cond: (party_id = $0)
Execution Time: 0.115 ms
```
(Plánovač na tomhle objemu zvolil jeden z ekvivalentních partial indexů se stejným `party_id`
prefixem - `idx_products_party_created_active` by posloužil identicky pro `ORDER BY created_at`.)

**2) Objednávky jednoho zákazníka (self-service, `orders.customer_id`)**

Before:
```
Seq Scan on orders
  Filter: (customer_id = $0)
  Rows Removed by Filter: 12
```

After (index scan bez nucení, plánovač ho zvolil sám i na tomhle malém objemu):
```
Index Scan using idx_orders_customer_created on orders
  Index Cond: (customer_id = $0)
```

**3) Produkty v jedné kategorii (`product_categories.category_id`)**

Before:
```
Seq Scan on product_categories
  Filter: (category_id = $0)
  Rows Removed by Filter: 48
```

After (index scan zvolen automaticky):
```
Index Only Scan using idx_product_categories_category on product_categories
  Index Cond: (category_id = $0)
```

**Poznámka k interpretaci výsledků:** Na produkčním objemu dat (tisíce až statisíce produktů/
objednávek na e-shop) by rozdíl byl řádový (O(n) seq scan vs. O(log n) index scan) - na
aktuálním malém seedu je rozdíl v `Execution Time` zanedbatelný nebo dokonce mírně horší u
indexu (kvůli plánovacím nákladům `Bitmap Heap Scan` navíc), což je pro tak malá data očekávané
a nevypovídá nic o chování na reálném objemu. Validace zde tedy stojí primárně na strukturální
správnosti (index odpovídá skutečnému WHERE/ORDER BY vzoru v kódu), ne na naměřeném zrychlení.

## Rizika

- **Velikost indexů:** aktuálně všech 12 nových indexů má cca 16 kB (prázdné B-tree stránky na
  malém seedu). Na produkčním objemu porostou úměrně počtu řádků splňujících partial predikát
  (u `products` indexů jen aktivní+viditelné produkty, ne draft/inactive - drží je to menší, než
  kdyby index nebyl partial).
- **Dopad na zápisy:** každý nový index = jeden extra update na INSERT/UPDATE/DELETE dotčeného
  řádku. U `products`/`orders`/`carts` jde o tabulky s běžnou frekvencí zápisu (ne extrémně
  vysokou), 4 nové indexy na `products` jsou největší přírůstek zápisové režie u jedné tabulky -
  akceptovatelné vzhledem k tomu, že storefront čtecí provoz (listing, karty produktů) je o
  řády častější než admin zápisy.
- **CONCURRENTLY nepoužito:** `CREATE INDEX` (bez `CONCURRENTLY`) drží `SHARE` lock na tabulce
  po dobu building - na malých/středních tabulkách (desítky tisíc řádků) jde o sekundy, na
  produkci won't be an issue teď, ale pokud v budoucnu některá e-shop tabulka naroste na miliony
  řádků, doporučuji před dalším přidáváním indexů zavést do repa samostatný non-transakční
  spouštěč migrací (mimo `supabase db push`) a přejít na `CONCURRENTLY`. Zapsáno jako follow-up,
  ne řešeno teď (mimo rozsah tohoto úkolu).
- **Migrace nebyla aplikována přes `supabase db push`:** kvůli existující kolizi čísel migrací
  mezi souběžnými worktree (viz "Volba čísla migrace") jsem migraci ověřil přímo přes `psql`
  proti lokální DB. Až se všechny větve budou slučovat do `master`, bude potřeba standardní
  `db-push.sh development` proběhnout znovu (idempotentní díky `IF NOT EXISTS`, takže to nic
  nerozbije, jen potvrdí stav).

## Potvrzení nedotčené admin/role/RLS logiky

- Žádný soubor pod `website/src/pages/admin/**`, `website/src/components/cms/Sidebar.astro`,
  `website/src/lib/admin.ts` ani `shared/constants/permissions.ts` nebyl otevřen ani změněn.
- Migrace neobsahuje žádný `CREATE POLICY`, `ALTER POLICY`, `DROP POLICY` ani jinou změnu RLS.
- Migrace neobsahuje žádnou změnu `profiles.role`, `user_party_roles`, `roles` ani permission
  bitů.
- Nové indexy jsou čistě výkonnostní - nemění, jaká data jsou vidět (to řídí RLS/aplikační
  filtry), jen jak rychle je Postgres najde. Admin cross-party dotazy (owner vidí všechny
  parties, admin vidí přiřazené parties) fungují úplně stejně jako předtím - jen některé z nich
  (např. `orders(customer_id)`, `orders(party_id, payment_status)`) teď mají k dispozici i
  rychlejší cestu, pokud je admin panel používá pro dotaz v rámci jedné party/zákazníka - to je
  ale vedlejší efekt sdílení stejné tabulky, ne úmyslná změna admin chování.

## Jak ověřit ručně

```bash
cd .claude/worktrees/db-per-eshop-indexing
./scripts/db-push.sh development   # idempotentní, IF NOT EXISTS
docker exec -i supabase_db_website-mobile-template psql -U postgres -d postgres -c "\di idx_products_party_created_active"
```

Nebo přímo v Supabase Studiu (`http://localhost:54323`) -> Database -> Indexes, filtr na
`idx_products_party`, `idx_orders_customer`, `idx_carts_party`, `idx_product_categories_category`,
`idx_inventory_items_product_variant`, `idx_customers_user`, `idx_addresses_customer`.

## Otevřené otázky / rozhodnutí vyžadující zpětnou vazbu

1. `idx_orders_party_payment_status` - symetrický k existujícímu `idx_orders_party_status`,
   ale `payment_status` filtr ve `fetchOrders` je primárně admin-panelová funkce (byť
   party-scoped, ne cross-party). Zahrnul jsem ho, protože nemění žádnou logiku, jen zrychluje
   existující party-scoped dotaz na stejné tabulce jako ostatní storefront-related order
   indexy - pokud to má být striktně jen "akce přes e-shop" bez jakéhokoliv dotyku admin cest,
   dá se tento jeden index z migrace vyjmout bez dopadu na zbytek.
2. `shopQueries.ts` řádek 82-86 volá `product_conditions.eq("code", conditionCode)` bez
   `party_id` filtru, přestože `product_conditions` má `UNIQUE(party_id, code)` (tedy `code`
   sám o sobě není napříč e-shopy unikátní) - jde o potenciální aplikační bug (cross-party
   condition match), ne o chybějící index, takže jsem ho **neopravoval** (mimo rozsah zadání).
   Zmiňuji jen jako vedlejší zjištění pro případné budoucí zpracování.
