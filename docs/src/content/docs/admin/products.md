---
title: Produkty
description: Vytvářejte, upravujte a publikujte produkty - včetně modelu skupiny variant, médií a skladových zásob pro každou variantu, kategorií, podmínek a přepínače pro vyhlížené produkty
---

Sekce Produkty je jádrem vašeho katalogu.
Každý produkt patří do jedné organizace (členy), může být umístěn do více [kategorií](/docs/admin/categories), má volitelnou značku [podmínky produktu](/docs/admin/product-conditions), je skladován prostřednictvím [Skladových zásob](/docs/admin/inventory) a objevuje se v obchodě, jakmile je jeho stav `active`.
Produkt je vždy považován za *skupinu variant*, i když má jen jednu - toto je myšlenkový model, který si zachovejte při čtení zbytek této stránky.

## Požadované oprávnění

| Bit oprávnění | Název | Kdo ho má výchozí |
|---|---|---|
| 8 | MANAGE_PRODUCTS | Vlastník, Administrátor, Administrátor e-shopu (s tímto bitem) |

Bez `MANAGE_PRODUCTS` vás systém přesměruje na `/admin`.
Pokud nemáte žádnou role administrátora, budete přesměrováni na `/dashboard`, a administrátor e-shopu bez přiřazené organizace je poslán na `/admin/setup` (vlastník: `/admin/parties/new`).
Stejný bit `MANAGE_PRODUCTS` také omezuje přístup k [Recenzím](/docs/admin/reviews) a [Podmínkám produktu](/docs/admin/product-conditions).
Upravování zásob uvnitř editoru produktu vyžaduje navíc `MANAGE_INVENTORY` (bit 64) - viz [Skladové zásoby](/docs/admin/inventory).

## Seznam produktů (`/admin/products`)

Stránka seznamu načítá všechny produkty pro aktuálně vybranou organizaci, 20 na stránku.

### Lišta nástrojů

- **Pole pro vyhledávání** - filtrování podle názvu produktu (placeholder text pochází z lokalizovaného `searchPlaceholder`).
- **Filtry stavu** - rozbalovací menu s možnostmi "Všechny stavy", `active`, `draft`, `inactive`.
- **Filtry kategorie** - rozbalovací menu se všemi kategoriemi v organizaci; zobrazuje se pouze tehdy, když existuje alespoň jedna kategorie.
- **Tlačítko filtru** - odesílá GET formulář; aktuální vyhledávání, stav a kategorie jsou zachovány v dotazovém řetězci napříč paginací.
- **Označení celkového počtu** - zobrazuje počet shodujících se produktů, např. `12 produktů`.
- **Tlačítko Nový** - odkazuje na `/admin/products/new`.

### Sloupce

| Sloupec | Popis |
|---|---|
| (náhled) | Hlavní obrázek. Pokud je hlavní médium videem, vykreslí ztlumený inline `<video>` poster; pokud není žádné médium, zobrazí se malé pole s nápisem "Žádný obrázek". |
| Název | Název produktu, v tučném písmu. |
| SKU | Kód pro sledování zásob, nebo mezikreska, pokud je prázdný. |
| Stav | Barvově kódovaný odznak - `badge-active` (aktivní), `badge-draft` (náčrt), `badge-inactive` (neaktivní). |
| Cena | Zobrazená cena, formátovaná pro aktuální jazyk/měnu. |
| Zásoby | Barvově kódovaný štítek zásob (viz níže). |
| Akce | Odkaz **Upravit** na editor produktu. |

### Barvy sloupce zásob

Hodnota zásob zobrazená zde je odvozena ze skladových zásob, nikdy není ručně zadána.

| Podmínka | Barva | Štítek |
|---|---|---|
| zásoby jsou `null` (nejsledováno) | ztlumená šedá | "Bez sledování zásob" |
| zásoby `<= 0` | červená | "Vyprodáno" |
| zásoby `1-10` | oranžová/varování | `{n} na skladě` |
| zásoby `> 10` | zelená/úspěch | `{n} na skladě` |

### Prázdný stav a paginace

Pokud žádné produkty neodpovídají, se v centru zobrazí řádek s textem "Žádné produkty".
Pokud je více než jedna stránka, na dole se objeví odkazy Předchozí / Další a indikátor "Stránka X z Y (Celkem N)".

## Vytváření produktu (`/admin/products/new`)

### Jak to udělat

1. Klikněte na **Nový** v seznamu produktů.
2. Pokud váš účet může přistupovat k více organizacím, vyberte **Organizaci** z výběru v horní části (administrátor s jednou organizací toto pole nikdy nevidí).
3. Vyplňte **Název** a **Cenu** (obě povinné) a upravte automaticky navrhovaný **Slug**.
4. Volitelně nastavte SKU, čárový kód, cenu se slevou, nákladovou cenu, stav, popis, přepínač **Vyhlížené** a zaškrtněte jakékoli **Kategorie**.
5. Klikněte na **Vytvořit**.
   Bydete přesměrováni přímo do editoru produktu, kde přidáte médium, varianty a zásoby.

### Reference polí

| Pole | Povinné | Sloupec | Poznámky |
|---|---|---|---|
| Organizace | Pouze pokud je více org | `products.party_id` | Stanovuje, která organizace vlastní produkt. |
| Název | Ano | `products.title` | Název pro zákazníka. |
| Slug | Ano | `products.slug` | URL-bezpečný ID, automaticky vyplněn z názvu pomocí komponenty `SlugInput`; musí být unikátní v rámci organizace. |
| SKU | Ne | `products.sku` | Např. `KZB-PODZ-BUK`. |
| Čárový kód | Ne | `products.barcode` | EAN-13 / UPC. |
| Cena | Ano | `products.price` | Standardní cena. Jakmile produkt má varianty, stává se to skrytým neaktivním polem (viz níže). |
| Cena se slevou | Ne | `products.discount_price` | Cena prodejní; nechte prázdné, pokud není sleva. |
| Nákladová cena | Ne | `products.cost_price` | Interní náklad pro zprávy o marži; nikdy není zobrazeno zákazníkům. |
| Stav | Ano | `products.status` | `draft` / `active` / `inactive`. Nové produkty jsou výchozí `draft`. |
| Popis | Ne | `products.description` | Textový obsah. |
| Vyhlížené | Ne | `products.is_featured` | Zahrnuje produkt do sekcí "vyhlížené produkty" v obchodě. |
| Kategorie | Ne | spojovací tabulka `product_categories` | Více výběr políček; uloženo pomocí `setProductCategories`. |

Pokud ještě neexistují žádné kategorie, políčka jsou nahrazena výzvou k vytvoření kategorie, která odkazuje na [vytvoření kategorie](/docs/admin/categories) (trasa `/admin/categories/new`).

### Limit produktů pro organizaci v čekání

Organizace, která ještě není `active` (čeká na schválení vlastníka), je omezena na pevný počet produktů (`PENDING_ORG_PRODUCT_CAP`).
Hard limit je vynucován spouštěčem DB `enforce_pending_org_product_cap`; formulář pro vytvoření provede přátelskou předkontrolu a zobrazí lokalizovanou chybu "limit dosažen" namísto surové chyby DB, když je počet již na limitu.

## Upravování produktu (`/admin/products/{id}`)

Editor skládá několik nezávislých formulářů, každý odesílá `action` zpět na stejnou URL.
Čtení od nejhorní po nejspodnější: varianty, hlavní formulář produktu, médium, poté panel zásob.

### Model skupiny variant

Každý produkt je skupina variant a v jakémkoli okamžiku je přesně jeden řádek "v centru pozornosti" (vybraný řádek, označený zelenou tečkou).
Pokud existují skutečné varianty, je výchozí vybrána jedna (první, nebo ta jmenovaná v `?variant=`).
Pokud žádné neexistují, stejnou roli hraje jediný řádek na úrovni produktu.
To, co je v centru pozornosti, je cílem sekce médií a panelu zásob níže.

Panel variant (`ProductVariants` komponenta) zobrazuje:

- Tabulku existujících variant s šipkami pro opětovné uspořádání, názvem (odkaz, který vybere danou variantu), cenou, odznakem aktivní a **Upravit variantu** a **Smazat**.
- Pod ním formulář pro přidání/upravu.

| Pole varianty | Sloupec | Poznámky |
|---|---|---|
| Název | `product_variants.name` | Např. `Střední (25-35 cm)`. Povinné. |
| Cena | `product_variants.price` | Cena, kterou zákazníci skutečně platí za tuto variantu. Může být prázdná. |
| SKU | `product_variants.sku` | Kód pro variantu. |
| Aktivní | `product_variants.is_active` | Přepíná stav `badge-active` / `badge-inactive` varianty. |

Akce variant a jejich hodnoty formuláře `action`:

- **Přidat** (`add_variant`) / **Uložit variantu** (`update_variant`) - vytvořit nebo upravit; formulář se automaticky přepne do režimu úpravy, když je vybrána varianta, a odkaz **Přidat** ho resetuje na prázdný formulář (`edit_variant=new`).
- **Smazat** (`delete_variant`) - smaže variantu po dialogu potvrzení.
- **Uspořádat** (`move_variant`, směr `up`/`down`) - šipky nahoru/dolů vymění `product_variants.sort_order` s sousedním řádkem. Horní řádek skrývá svou šipku nahoru, spodní řádek svou šipku dolů.

**Důležité pravidlo cenotvorby:** jakmile produkt má alespoň jednu variantu, obchod vždy zobrazuje cenu *varianty*, nikdy ne `products.price`.
Proto editor skryje hlavní vstupy pro cenu a cenu se slevou a zobrazí poznámku "Cena je nastavena variantami" - cena na úrovni produktu se stane neaktivním polem.
Při nule variant je zobrazeny a používány vstupy pro cenu a cenu se slevou na úrovni produktu.

Příklad Kytka z Beskyd: "Podzimní věnec z bukového listí" je jeden produkt se třemi variantami velikosti - `Malý (15-25 cm)` 290, `Střední (25-35 cm)` 490, `Větší (36-46 cm)` 690 CZK - každá s vlastní cenou a vlastním řádkem zásob.

### Hlavní formulář produktu

Stejné pole jako v formuláři pro vytvoření (Název, Slug, SKU, Čárový kód, Cena/Cena se slevou, pokud neexistují varianty, Nákladová cena, Stav, Popis, Vyhlížené, Kategorie) plus:

| Pole | Sloupec | Poznámky |
|---|---|---|
| Podmínky | `products.condition_id` | Rozbalovací menu s [podmínkami produktu](/docs/admin/product-conditions) organizace, plus možnost "Bez podmínek". Pro Kytko mají produkty na objednávku podmínku "Na zakázku" a ty na skladě žádnou. |

**Uložit** zapisuje produkt a znovu aplikuje přiřazení kategorií, poté se vrátí do seznamu produktů.
**Smazat** (samostatné červené tlačítko, dialog potvrzení) trvale odstraní produkt.

### Pracovní postup stavu

| Stav | Význam |
|---|---|
| `draft` | Skrytý pro zákazníky; používejte při budování produktu. Výchozí pro nové produkty. |
| `active` | Veřejně viditelný a kupovatelný. |
| `inactive` | Skrytý pro obchod, ale zachován - vhodné pro sezónní položky. |

### Médium: obrázky a videa

Sekce médií (`ProductImages` komponenta) se přímo nahrává do Supabase Storage a zaznamenává řádky v `product_images`.
Médium je omezeno na variantu v centru pozornosti:

- S vybranou variantou je nejprve zobrazeno její vlastní médium, a pod ním je uvedena sdílená (bezvariantní) skupina jako záložní možnost, kterou dědí každá varianta bez vlastního média.
- Jednoduchý produkt bez variant používá pouze sdílenou skupinu.

**Obrázky** (`upload_image` akce):

1. Klikněte na **Vybrat soubor** (akceptuje `image/jpeg, image/png, image/webp, image/gif`); povoleno více souborů.
2. Volitelně nastavte **Alt text** a zaškrtněte **Nastavit jako primární**.
3. Klikněte na **Nahrát obrázek**.
   Soubory jsou uloženy do bucketu `product-images` na cestě `{party_id}/{product_id}/{variant_id nebo "shared"}/{timestamp}-{i}.{ext}`, a veřejná URL je zapsána do `product_images.url`.
   Pouze první soubor respektuje zaškrtnutí "primární".
4. Na každém uloženém obrázku: **Nastavit primární** (`set_primary` - nastavuje `is_primary`, vymaže ho u ostatních) a **Smazat** (`delete_image`, s potvrzením). Primární obrázek má odznak "Primární".

**Videa** (`upload_video` akce):

1. Klikněte na **Vybrat soubor** (akceptuje `video/mp4, video/webm, video/ogg, video/quicktime`); povoleno více.
2. Klikněte na **Nahrát video**.
   Soubory jdou do bucketu `product-videos` se stejnou schématickou cestou a řádek je zapsán s `media_type = "video"`.
   Videa se vykreslují jako náhledy s ovládacím panelem a mohou být **Smazána** (potvrzení).

Malý klientový skript aktualizuje název výběru souborů na vybrané jméno souboru, nebo "N souborů" pro více výběr.

### Panel zásob (uvnitř editoru)

Spodní karta zrcadlí samostatnou stránku [Skladové zásoby](/docs/admin/inventory), ale cílí na jediný řádek v centru pozornosti.
Zobrazuje dlaždice statistik Skladem / Rezervováno / Dostupné / Min. práh / Max. práh, odznaky pro vyprodáno a nízké zásoby a - pouze pokud máte také `MANAGE_INVENTORY` - tři formuláře:

- Políčko zaškrtnutí **Na vyžádání** (`set_on_demand`) - zaškrtnutí nastavuje `inventory_items.track_inventory = false`, takže položka je vždy objednatelná.
- **Upravit zásoby** (`adjust_inventory`) - množství (±), typ pohybu (úprava / nákup / vrácení / poškození), volitelná poznámka.
- **Aktualizovat limity** (`update_thresholds`) - minimální (nízké zásoby) a maximální limity.

Nedávné pohyby zásob (až 5) jsou uvedeny níže.
Viz [Skladové zásoby](/docs/admin/inventory) pro plnou sémantiku těchto polí.
Pokud řádek v centru pozornosti nemá záznam o zásobách, panel zobrazí "Žádný záznam o zásobách".

## Data a úložiště (cloud)

- **Tabulky:** `products` (party_id, condition_id, title, slug, sku, barcode, price, discount_price, cost_price, tax_rate, status, is_featured, is_visible, description, rating_avg, review_count), `product_variants` (name, sku, price, attributes, condition_id, is_active, sort_order), `product_images` (url, alt, is_primary, media_type, variant_id, sort_order), `product_categories` (product_id, category_id spojovací), `inventory_items`, `stock_movements`, `product_conditions`.
- **Buckety úložiště:** `product-images` a `product-videos`, cesta `{party_id}/{product_id}/{variant_id|"shared"}/{timestamp}-{i}.{ext}`.
- **Služby:** `productService` (`fetchProducts`, `createProduct`, `updateProduct`, `deleteProduct`, `setProductCategories`), `productImageService` (přidat/smazat/nastavit primární obrázek, přidat/upravit/smazat/uspořádat variantu), `inventoryService`, `productConditionService`, `categoryService`.
- **Odkazované spouštěče DB:** `ensure_variant_inventory_item` / `create_default_inventory_item` automaticky vytvářejí řádky zásob; `enforce_pending_org_product_cap` vynucuje limit produktů pro organizaci v čekání.
- Všechny dotazy jsou omezeny na `ctx.partyId`, takže jedna organizace nikdy nemůže vidět katalog jiné.

## Související stránky

- [Kategorie](/docs/admin/categories) - organizujte produkty do prohledatelné, v navigaci viditelné hierarchie
- [Podmínky produktu](/docs/admin/product-conditions) - značky, z nichž volí rozbalovací menu Podmínky
- [Skladové zásoby](/docs/admin/inventory) - zásoby na variantu, limity, na vyžádání, pohyby zásob
- [Recenze](/docs/admin/reviews) - moderování recenzí zákazníků (stejný bit MANAGE_PRODUCTS)
- [Ceny](/docs/admin/pricing) - slevy a kupóny, které odkazují na produkty
- [Objednávky](/docs/admin/orders) - objednávky obsahují položky produktů
