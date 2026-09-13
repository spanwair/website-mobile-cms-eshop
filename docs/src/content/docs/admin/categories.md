---
title: Kategorie
description: Vytvořte strom kategorií, který organizuje váš katalog a řídí navigaci v obchodě
---

Kategorie organizují váš katalog do prohledávatelného, volitelně hnedou stromu a řídí menu navigace v obchodě.
Každý [produkt](/docs/admin/products) může patřit do jedné nebo více kategorií, a kategorie mohou být podřazeny rodiči k vytvoření hierarchie.
Tato sekce se nachází na `/admin/categories`.

## Požadovaná oprávnění

| Bit oprávnění | Název | Kdo ho má výchozí |
|---|---|---|
| 16 | MANAGE_CATEGORIES | Vlastník, Administrátor, Administrátor obchodu (s tímto bitem) |

Bez `MANAGE_CATEGORIES` vás systém přesměruje na `/admin`.
Žádná role administrátora vás nepřesměruje na `/nástěnka`; administrátor obchodu bez organizace se přesune na `/admin/setup` (vlastník: `/admin/parties/new`).

## Seznam kategorií (`/admin/categories`)

Seznam vykresluje celý strom kategorií zploštěný do řádků, přičemž dceřiné kategorie jsou odsazeny pod své rodiče (označení `└` a levné vyblednutí pro každý úroveň hloubky).

### Lišta nástrojů

- **Označení celkový počet** - počet kategorií, např. `6 kategorií`.
- **Tlačítko Nové** - odkazuje na `/admin/categories/new`.

### Sloupce

| Sloupec | Zdroj | Poznámky |
|---|---|---|
| Název | `categories.name` | Odsazené podle hloubky; zobrazuje `icon` kategorie (emoji, pokud je nastavené) před názvem. |
| Viditelnost | `categories.is_visible` | `badge-active` ("Viditelný") nebo `badge-inactive` ("Skrytý"). |
| Dceřiné kategorie | | Počet přímých dceřiných kategorií. |
| Akce | | Odkaz **Upravit** a tlačítko **Smazat** (dialog pro potvrzení). |

Když neexistují žádné kategorie, tabulka zobrazí jeden centrován řádek "Žádné kategorie".

Smazání se odešle zpět do seznamu s `category_id` a smaže kategorii pomocí `deleteCategory`.

## Vytváření kategorie (`/admin/categories/new`)

### Jak to udělat

1. Klikněte na **Nové** v seznamu kategorií.
2. Pokud váš účet může přistupovat k více organizacím, nejprve vyberte **Organizaci**.
3. Zadejte **Název**; **Slug** se automaticky vyplní z něj.
4. Volitelně vyberte **Rodiče**, **Ikonu**, **Pořadí** a **Obrázek** (z médiátéky).
5. Zaškrtněte **Viditelný** a/nebo **Zobrazit v navigaci** podle potřeby.
6. Klikněte na **Vytvořit**.

### Reference polí

| Pole | Požadováno | Sloupec | Poznámky |
|---|---|---|---|
| Organizace | Pouze pokud je více organizací | `categories.party_id` | Která organizace vlastní kategorii. |
| Název | Ano | `categories.name` | Zobrazovaný název, např. `Podzimní věnce`. |
| Slug | Ano | `categories.slug` | Bezpečný URL ID, automaticky navrhovaný z názvu pomocí `SlugInput`. |
| Родиč | Ne | `categories.parent_id` | Rozbalovací nabídka existujících kategorií; "Žádný rodič" ji činí nejvyšší úrovně. |
| Ikona | Ne | `categories.icon` | Krátký emoji/text (max 10 znaků) zobrazený před názvem. |
| Pořadí | Ne | `categories.sort_order` | Číselné pořadí v rámci své úrovně; výchozí hodnota je `0`. |
| Obrázek | Ne | `categories.image_url` | Vybraný pomocí `ImagePicker` z médiátéky obchodu (viz níže). |
| Viditelný | Ne | `categories.is_visible` | Výchozí zaškrtnuto u nových kategorií; skryje/zobrazí kategorii v obchodě. |
| Zobrazit v navigaci | Ne | `categories.show_in_nav` | Výchozí nezaznačeno; určuje, zda se kategorie zobrazí v navigaci/mega-menu obchodu. |

### Výběr obrázku a médiátéka

Pole **Obrázek** není pole pro volný text URL - je to komponenta `ImagePicker` propojená s médiátékou obchodu (`store_media`, načítaná pomocí `fetchStoreMedia`).
Klikněte na **Vybrat z knihovny**, abyste otevřeli výběr médií a vybrali existující obrázek; objeví se náhled 40x40 a tlačítko **Vymazat** odstraní výběr.
Podkladová uložená hodnota je URL média v `categories.image_url`.

## Úprava kategorie (`/admin/categories/{id}`)

Formulář úpravy obsahuje stejná pole jako formulář vytvoření (kromě výběru organizace - organizace kategorie je fixní).
Rozbalovací nabídka **Rodič** vylučuje samotnou kategorii, takže nemůže být svým vlastním rodičem.
Tlačítka: **Uložit** (aktualizuje a vrátí se do seznamu) a samostatné tlačítko **Smazat** (dialog pro potvrzení) pod formulářem.

## Jak kategorie spolupracují s katalogem

- Produkty jsou přiřazeny k kategoriím z [editoru produktů](/docs/admin/products) pomocí polí výběru více položek (spojovací tabulka `product_categories`). Filtrování kategorií v seznamu produktů používá stejný strom.
- `show_in_nav` přímo ovládá navigaci v obchodě - pro standardní kategorie neexistuje samostatná tabulka kurátorované navigace.
- `is_visible` skryje kategorii z obchodu bez jejího smazání nebo smazání produktů.
- Kytka z Beskyd zakládá šest kategorií nejvyšší úrovně, všechny s `show_in_nav = true`: Podzimní věnce, Celoroční věnce, Svatební kytice a dekorace, Smuteční věnce a kytice, Sušené květiny do vázy, Dárkové sety - každá s `image_url` z médiátéky obchodu.

## Data a úložiště (cloud)

- **Tabulka:** `categories` (id, party_id, name, slug, parent_id, icon, image_url, sort_order, is_visible, show_in_nav, seo_title, seo_description, created_at, updated_at). Omezeno na organizaci pomocí `party_id`.
- **Spojovací tabulka:** `product_categories` (product_id, category_id) - zapsáno z editoru produktů.
- **Média:** `store_media` pomocí `fetchStoreMedia`; `image_url` obsahuje vybraný URL z knihovny. Na této stránce neprobíhá přímé nahrávání.
- **Služby:** `categoryService` (`fetchCategoryTree`, `fetchCategories`, `fetchCategory`, `createCategory`, `updateCategory`, `deleteCategory`), `storeMediaService`.

## Související stránky

- [Produkty](/docs/admin/products) - přiřazujte produkty k kategoriím a filtrovejte seznam produktů podle kategorie
- [Podmínky produktu](/docs/admin/product-conditions) - jiný koncept organizování produktů (označky)
- [Skladové zásoby](/docs/admin/inventory) - zásoby pro produkty v těchto kategoriích
