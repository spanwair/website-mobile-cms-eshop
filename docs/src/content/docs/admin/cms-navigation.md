---
title: Navigace (Horní menu)
description: Vytvořte horní menu obchodu a rozbalovací menu mega-menu z kategorií a obsahových stránek
---

Builder Navigace ovládá menu, které se zobrazuje v hlavičce vašeho obchodu.
Je to první záložka v sekci Obsah a nachází se vedle [Stránky](/docs/admin/cms-pages), [Blog](/docs/admin/cms-blog), [Tým](/docs/admin/cms-team), [FAQ](/docs/admin/cms-faq) a [Právní dokumenty](/docs/admin/cms-legal).
Každý položka menu odkazuje buď na jednu z vašich [Kategorií](/docs/admin/categories) nebo na vlastní URL (obvykle na [obsahovou stránku](/docs/admin/cms-pages) na adrese `/stranka/{slug}`), a položky lze vnořit do rozbalovacích menu a seskupit do sloupců mega-menu.

## Požadované oprávnění

| Bit oprávnění | Název | Kdo ho má výchozí |
|---|---|---|
| 2048 | MANAGE_CMS | Vlastník, Administrátor, Administrátor obchodu (s tímto bitem) |

Bez bitu MANAGE_CMS vás systém přesměruje na `/admin`.
Pokud jste ještě nezvolili žádnou organizaci, budete přesměrováni na `/admin/parties/new` (vlastník) nebo `/admin/setup` (administrátor obchodu).
Čistí zákazníci (role USER) jsou přesměrováni na `/dashboard`.

## Co se zobrazuje v hlavičce obchodu

Vaše živá hlavička je sestavena z dvou zdrojů, které jsou sloučeny a seřazeny podle **Pořadí seřazení**:

1. Ručně vybrané `nav_items`, které vytvoříte na této stránce (pouze řádky, kde je zaškrtnuto **Viditelné**).
2. Jakákoli [Kategorie](/docs/admin/categories), která má nastavenou značku „zobrazit v navigaci“ - tyto jsou automaticky přidány s odkazem na obchod filtrovaný podle této kategorie.

To znamená, že nemusíte ručně znovu vytvářet strom svých kategorií.
Použijte tuto stránku pro odkazy, které strom kategorií nemůže vyjádřit: stránku „O nás“, cílovou stránku „Na objednávku“, odkaz na blog nebo promoční URL.

Pro Kytka z Beskyd se kategorie (Podzimní věnce, Celoroční věnce, Svatební kytice a dekorace, Smuteční věnce, Sušené květiny do vázy, Dárkové sety) zobrazují automaticky a tato stránka se používá k přidání odkazů, jako je „Výroba na zakázku“, která směřuje na obsahovou stránku `/stranka/vyroba-na-zakazku`.

## Formulář pro přidání / úpravu

Formulář v horní části stránky vytváří nový položku nebo upravuje existující, když se dostanete pomocí tlačítka **Upravit** (URL se změní na `/admin/cms/navigation?edit={id}`).
Nadpis se zobrazuje jako „Přidat položku navigace“ při vytváření a „Upravit“ při úpravě.

### Reference polí

| Pole | Sloupec v `nav_items` | Požadováno | Popis |
|---|---|---|---|
| Název | `label` | Ano | Kliknutelný text zobrazený v hlavičce (např. `Výroba na zakázku`). |
| Rodiční položka | `parent_id` | Ne | Vyberte nejvyšší položku, pod kterou tuto položku vnořit jako dceřinu rozbalovacího menu. Pokud je položka nejvyšší úrovně, nechte pole prázdné. Rozbalovací menu zobrazuje pouze položky nejvyšší úrovně a položka, kterou upravujete, je vyloučena, takže nemůže být svým vlastním rodičem. |
| Odkaz na kategorii | `category_id` | Ne | Směřujte položku na jednu ze svých kategorií. Když je vybrána kategorie, pole URL je ignorováno a uloženo jako null - cílem odkazu je kategorie. |
| URL | `url` | Ne | Vlastní cílový odkaz. Jedná se o vytvářenelný combobox: navrhuje všechny obsahové stránky (zobrazené jako jejich název, hodnota `/stranka/{slug}`), a můžete také zadat jakýkoli vlastní cesty nebo kompletní URL. Prázdná hodnota dostane přední křížek (`o-nas` se stane `/o-nas`); hodnoty začínající `/`, `http://`, `https://` nebo `www.` jsou zachovány tak, jak byly zadány. |
| Název sloupce mega-menu | `column_label` | Ne | Má smysl pouze u dceřiných položek. Když je rodič mega menu, tento název skupuje dceřiné položky do tituleovaného sloupce (např. zadejte `iPhone`, abyste vytvořili sloupec). Dceřiné položky sdílející stejný název sloupce se zobrazují společně. |
| Pořadí seřazení | `sort_order` | Ne | Číslo, nižší se zobrazí dříve. Výchozí 0. Toto seřazení je sdíleno s automaticky přidanými položkami kategorií, takže upravte čísla, abyste je uspořádali tak, jak chcete. |
| Mega menu (skupuje dceřiné položky do sloupců) | `is_mega` | Ne | Zaškrtávací políčko. Označte položku nejvyšší úrovně jako mega menu, aby se její dceřiné položky vykreslily jako rozbalovací menu s více sloupci se seskupenými podle jejich názvů sloupců. Zobrazeno jako zaškrtnutí v seznamu. |
| Viditelné | `is_visible` | Ne | Zaškrtávací políčko, výchozí zaškrtnuto u nových položek. Nezaškrtnuté položky jsou uloženy, ale nikdy nejsou vykresleny v hlavičce obchodu. |

### Kategorie vs URL

Položka odkazuje na přesně jedno místo.
Pokud vyberete kategorii v poli **Odkaz na kategorii**, server uloží `category_id` a vynutí, aby `url` byl null.
Pokud necháte kategorii prázdnou, server uloží hodnotu **URL**.
Použijte combobox URL k odkazování na [obsahovou stránku](/docs/admin/cms-pages), [index blogu](/docs/admin/cms-blog) (`/blog`) nebo jakýkoli externí adresář.

### Tlačítka

- **+ Přidat položku navigace** / **Uložit změny** - odesílá formulář (vytváří nebo aktualizuje).
- **Zrušit** - zobrazuje se pouze při úpravě; vrací na `/admin/cms/navigation` a zmetouvá změny.

Po úspěšném uložení vás systém přesměruje zpět na seznam.
Chyba databáze je zobrazená v červeném upozornění nad formulářem a položka není uložena.

## Seznam navigace

Pod formulářem je každá položka (viditelná i skrytá) uvedena v pořadí seřazení.

| Sloupec | Zdroj | Poznámky |
|---|---|---|
| Název | `label` | Tučné písmo. |
| Cíl | `category_id` nebo `url` | Zobrazuje název odkazované kategorie, pokud je nastaven, jinak surový URL. |
| Rodič | `parent_id` | Název rodičovské položky, nebo pomlčka, pokud je položka nejvyšší úrovně. |
| Mega | `is_mega` | Zaškrtnutí, pokud je položka mega menu, jinak pomlčka. |
| Pořadí | `sort_order` | Číselná hodnota seřazení. |
| Akce | - | **Upravit** a **Smazat**. |

**Smazat** vyžaduje potvrzení, poté řádek okamžitě odstraní.
Pokud nejsou žádné položky, tabulka zobrazí „Není zatím žádné položky navigace.“

## Vytváření mega menu (krok za krokem)

1. Vytvořte položku nejvyšší úrovně (bez rodiče), přiřaďte jí **Název** a zaškrtněte **Mega menu**.
2. Vytvořte každou dceřinou položku a vyberte tuto položku nejvyšší úrovně jako **Rodič**.
3. Přiřaďte dceřiným položkám **Název sloupce mega-menu**, abyste je seskupili do pojmenovaných sloupců.
4. Směřujte každou dceřinou položku na kategorii nebo URL.
5. Nastavte **Pořadí seřazení** u dceřiných položek, abyste je uspořádali uvnitř svého sloupce.

## Data a úložiště (cloud)

- Tabulka: `nav_items` (sloupce `party_id`, `label`, `url`, `category_id`, `parent_id`, `column_label`, `is_mega`, `sort_order`, `is_visible`).
- Čte z `categories` (pro rozbalovací menu kategorií a pro vyřešení sloupce Cíl) a z `content_pages` (pro sestavení návrhů URL).
- Všechny řádky jsou omezeny na aktivní organizaci pomocí `party_id`.
- Vykreslování obchodu slučuje viditelné `nav_items` s kategoriemi označenými pro navigaci pomocí `fetchStorefrontNavTree`.

## Související stránky

- [Kategorie](/docs/admin/categories) - kategorie označené pro navigaci jsou automaticky přidány do hlavičky; položky odkazují na ně
- [Stránky](/docs/admin/cms-pages) - obsahové stránky se stávají návrhy URL `/stranka/{slug}` v comboboxu odkazů
- [Blog](/docs/admin/cms-blog) - odkaz na `/blog` z položky navigace, aby se zobrazily vaše příspěvky
- [Právní dokumenty](/docs/admin/cms-legal) - právní/informační stránky obvykle patří do nočního kola, nikoli do hlavičky
