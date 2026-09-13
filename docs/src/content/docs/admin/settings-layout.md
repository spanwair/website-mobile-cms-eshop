---
title: Nastavení obchodu - Rozložení
description: Vyberte, které sekce se zobrazí na domovské stránce vašeho obchodu a v jakém pořadí.
---

Karta Rozložení určuje, které bloky tvoří domovskou stránku vašeho obchodu a v jakém pořadí se na ní zobrazují.
Spolupracuje s [Vzhledem značky](/docs/admin/settings-branding) (jak tyto bloky vypadají) a [Obsahem](/docs/admin/settings-content) (co se nachází uvnitř bloků s hlavním obrázkem, podsekcí a patičkou).

Stránka je dostupná na `/admin/settings/layout`, dostanete se na ni z položky **Nastavení** v bočním panelu, poté se klikněte na kartu **Rozložení**.

## Požadované oprávnění

| Bit oprávnění | Název | Kdo ho má výchozí |
|---|---|---|
| 1024 | MANAGE_SETTINGS | Vlastník, Administrátor, Administrátor obchodu (s tímto bitem) |

Stejná řetězec ochrany jako u ostatních karet nastavení: žádná přihlašovací relace -> `/login`; žádný kontext administrátora -> `/nástěnka`; žádná aktivní organizace -> `/admin/parties/new` (vlastník) nebo `/admin/setup`; chybějící MANAGE_SETTINGS -> `/admin`.

## Seznam sekcí domovské stránky

Stránka vykreslí jeden řádek pro každou dostupnou sekci domovské stránky.
Každý řádek obsahuje **zaškrtávací políčko** (zahrnout tuto sekci nebo ne) a vstup pro číslo **Pořadí**.

| Klíč sekce | Název | Co vykreslí na domovské stránce |
|---|---|---|
| `hero` | Banner s hlavním obrázkem | Hlavní horní banner (nebo slider s hlavním obrázkem). Text pochází z [Obsah](/docs/admin/settings-content). |
| `subhero` | Podsekce s hlavním obrázkem | Sekundární banner pod hlavním obrázkem. Text z Obsahu. |
| `categories` | Prezentace kategorií | Mřížka vašich [kategorií](/docs/admin/categories). |
| `featured_products` | Vybrané produkty | Produkty označené jako vybrané v [Produkty](/docs/admin/products). |
| `benefits` | Výhody / odznaky důvěryhodnosti | Položky z [Výhod](/docs/admin/settings-benefits). |
| `condition_explainer` | Vysvětlení stavu produktu | Vysvětluje označení stavu produktu (např. Kytka "Na zakázku"). |
| `buyback_promo` | Akce zpětného odkupu / výměny | Blok zpětného odkupu; text z Obsahu. |
| `blog_preview` | Předzobrazení blogu | Nejnovější příspěvky z CMS blogu. |
| `newsletter` | Registrace newsletteru | Formulář newsletteru na domovské stránce (viz [Newsletter](/docs/admin/settings-newsletter)). |

Pořadí zobrazené výše je výchozí pořadí pro zcela nový obchod (definováno v registru sekcí).

### Jak funguje pořadí

- Pole **Pořadí** je jednoduché číslo.
  Nižší čísla se zobrazí výše na stránce.
- Při uložení jsou zachovány pouze zaškrtnuté sekce.
  Jsou seřazeny podle hodnoty Pořadí a poté uloženy jako seřazený seznam klíčů sekcí.
- Výchozí hodnota předvyplněná v každém poli Pořadí je aktuální index sekce v uloženém rozložení, nebo konec seznamu, pokud není aktuálně zahrnuta.
- Chcete-li sekci posunout nahoru, dejte jí menší číslo než sekci, kterou chcete nad ní.
  Nemusíte používat spojité čísla; seznam je seřazen numericky a poté zploštěn.

### Příklad Kytka z Beskyd

Obchod Kytka ukládá toto přesné pořadí:

```
hero, subhero, benefits, categories, featured_products, condition_explainer, blog_preview, newsletter
```

Poznámka: Kytka vynechává `buyback_promo` (jeho zaškrtávací políčko není zaškrtnuto), takže tato sekce nikdy nevykreslí na své domovské stránce.

## Ukládání

Stiskněte **Uložit změny**, abyste odeslali formulář.
Server čte každé zaškrtávací políčko `include_<key>` a číslo `order_<key>`, zachovává pouze zahrnuté, seřazuje podle pořadí a zapisuje výslednou pole do sloupce `homepage_layout` pomocí `updateStoreConfig`.
Zelený banner potvrzuje uložení.

Uložená hodnota je při čtení očištěna: jakýkoli neznámý nebo odstraněný klíč sekce je zahozen, a pokud se seznam ukáže jako prázdný, místo toho se použije celé výchozí rozložení, takže zastaralá hodnota nikdy nemůže narušit vykreslování domovské stránky.

## Data a úložiště (cloud)

- Čte a zapisuje sloupec `homepage_layout` (JSON pole klíčů sekcí) v řádku `store_configs` pro váš `party_id`.
- Žádné jiné tabulky, nádrže ani funkce nejsou dotčeny.

## Související stránky

- [Nastavení obchodu - Vzhled značky](/docs/admin/settings-branding) - barvy, písma a styl karet pro tyto sekce
- [Nastavení obchodu - Obsah](/docs/admin/settings-content) - text pro hlavní obrázek, podsekci a patičku zobrazený uvnitř bloků rozložení
- [Nastavení obchodu - Výhody](/docs/admin/settings-benefits) - položky vykreslené sekcí `benefits`
- [Nastavení obchodu - Newsletter](/docs/admin/settings-newsletter) - ovládá formulář sekce `newsletter`
- [Kategorie](/docs/admin/categories) - zdroj pro prezentaci kategorií
- [Produkty](/docs/admin/products) - zdroj pro sekci `featured_products`
