---
title: Podmínky produktu
description: Definujte označená podmínky s kódováním barev, která produkty a varianty mohou mít - včetně vzoru pro výrobu na objednávku.
---

Podmínky produktu jsou krátké, kódované barevné štítky, které může produkt nebo varianta nosit v obchodě - „Nové“, „Zánovní“, „Stav A“ nebo „Na zakázku“ od Kytka z Beskyd.
Podmínky jsou definovány pro každou organizaci, poté vybrány z rozbalovací nabídky **Podmínka** při úpravě [produktu](/docs/admin/products).
Tato stránka je dostupná na `/admin/products/conditions`.

Podmínka je *označení*, ne stav skladových zásob.
To, zda je položka „na skladě“, je odvozováno ze [Skladových zásob](/docs/admin/inventory), nikdy není zde nastaveno jako manuální podmínka.

## Požadované oprávnění

| Bit oprávnění | Název | Kdo ho má výchozí |
|---|---|---|
| 8 | MANAGE_PRODUCTS | Vlastník, Administrátor, Administrátor e-shopu (s tímto bitem) |

Jedná se o stejný bit, který omezuje přístup k [Produktům](/docs/admin/products) a [Recenzím](/docs/admin/reviews).
Bez něj vás systém přesměruje na `/admin`; bez jakéhokoli role administrátora na `/dashboard`; administrátor e-shopu bez organizace se přesune na `/admin/setup`.

## Stránka (`/admin/products/conditions`)

Ekran má dvě části: kartu formuláře pro vytvoření/upravu nahoře a tabulku existujících podmínek níže.
Spětný odkaz na **Produkty** v horní části vás vrátí na seznam produktů.

### Formulář pro vytvoření / úpravu

Nadpis formuláře zní „Nový stav“ nebo „Upravit stav“ v závislosti na tom, zda jste přišli s `?edit={id}`.

| Pole | Požadováno | Sloupec | Poznámky |
|---|---|---|---|
| Kód | Ano | `product_conditions.code` | Krátký interní klíč, zkrácen při uložení, např. `made_to_order`, `a`, `new`. |
| Označení | Ano | `product_conditions.label` | Text určený pro zákazníka, zkrácený, např. `Na zakázku`, `Stav A`. |
| Barva | Ne | `product_conditions.color_hex` | Nativní vstup pro výběr barvy; výchozí je `#7CB342`, pokud není nastaven. |
| Pořadí seřazování | Ne | `product_conditions.sort_order` | Celočíselné pořadí, výchozí je `0`. |
| Aktivní | Ne | `product_conditions.is_active` | Zaškrtávací pole, výchozí pro nové podmínky. |

Tlačítka: **Vytvořit** (nové) nebo **Uložit** (upravit), plus odkaz **Zrušit**, který se objevuje pouze při úpravě (odstraní `?edit`).
Po úspěchu se stránka přesměruje zpět na `/admin/products/conditions`.

### Tabulka podmínek

| Sloupec | Zdroj | Poznámky |
|---|---|---|
| Kód | `code` | Ztučnělý. |
| Označení | `label` | |
| Barva | `color_hex` | Malý zaoblený vzorek vyplněný hex kódem, následovaný hex řetězcem. |
| Seřazení | `sort_order` | |
| Stav | `is_active` | `badge-active` ("Aktivní") nebo `badge-inactive` ("Neaktivní"). |
| Akce | | Odkaz **Upravit** a tlačítko **Smazat** (dialog potvrzení). |

Pokud nejsou žádné podmínky, tabulka zobrazí jeden centrován řádek „Žádné podmínky“.

## Vzor pro výrobu na objednávku (Kytka z Beskyd)

Kytka z Beskyd využívá koncept podmínek pro florální obchod s výrobou na objednávku.
Organizace nastavuje přesně jednu podmínku:

| Kód | Označení | Barva | Seřazení |
|---|---|---|---|
| `made_to_order` | Na zakázku | `#C97B4A` | 1 |

Jak je to použito v katalogu:

- Produkty a varianty vyrobené na objednávku mají toto `condition_id`; položky na skladě mají `NULL` (žádné označení).
- Úmyslně **neexistuje** podmínka „na skladě“ - stav na skladě je odvozován ze skladových zásob, takže manuální označení by bylo zbytečné a mohlo by dojít k rozpojení.
- Varianty vyrobené na objednávku jsou nastaveny jako `track_inventory = false` ve [Skladových zásobách](/docs/admin/inventory), takže řemeslný podnik nikdy nebude chybně zobrazen jako vyprodaný - vždy může přijmout objednávku.

Obchod čte přiřazenou podmínku, aby vykreslil štítek „Na zakázku“, a čte skladové zásoby (ne jakoukoli podmínku), aby rozhodl o stavu na skladě / vyprodaný.

## Data a úložiště (cloud)

- **Tabulka:** `product_conditions` (id, party_id, code, label, color_hex, sort_order, is_active, created_at, updated_at). Řádky jsou omezeny na aktuální organizaci pomocí `party_id`.
- **Odkazováno na:** `products.condition_id` a `product_variants.condition_id`.
- **Služba:** `productConditionService` (`fetchProductConditions`, `createProductCondition`, `updateProductCondition`, `deleteProductCondition`).
- Nejsou zapojeny žádné úložiště ani Edge Functions.

## Související stránky

- [Produkty](/docs/admin/products) - rozbalovací nabídka Podmínka v editoru produktu vybírá z těchto označení
- [Skladové zásoby](/docs/admin/inventory) - kde se nachází skutečné chování na skladě / výroba na objednávku (`track_inventory`)
- [Kategorie](/docs/admin/categories) - jiný způsob, jak jsou produkty organizovány pro prohlížení
