---
title: Nastavení obchodu - Obsah
description: Upravte texty pro hlavní banner, podhlavní banner, akci pro výkup a zápatí, spravujte snímky hlavního bannera a nahrajte média
---

Sekce Obsah obsahuje upravitelná textová bloky vaší domovské stránky, plus slider hlavního bannera a vaši médiální knihovnu.
Funkční s [Rozložení](/docs/admin/settings-layout) (které bloky jsou zobrazeny) a [Vzhled značky](/docs/admin/settings-branding) (jak jsou stylizovány).
Média, která zde nahrajete, je stejná knihovna používaná výběry obrázků v sekci Vzhled značky, a také v [Produkty](/docs/admin/products), [Kategorie](/docs/admin/categories) a v blogu CMS.

Stránka je dostupná na `/admin/settings/content`, k níž se dostanete z položky **Nastavení** v bočním panelu, poté se kliknutím na záložku **Obsah**.

## Oprávnění vyžadovaná

| Bit oprávnění | Název | Kdo ho má výchozí |
|---|---|---|
| 1024 | MANAGE_SETTINGS | Vlastník, Administrátor, Administrátor obchodu (s tímto bitem) |

Řetězec ochrany: žádná přihlašovací relace -> `/login`; žádný kontext administrátora -> `/dashboard`; žádná aktivní organizace -> `/admin/parties/new` (vlastník) nebo `/admin/setup`; chybějící MANAGE_SETTINGS -> `/admin`.

Stránka používá skryté pole `_action` k směrování mezi čtyřmi operacemi: `save_content`, `save_slide`, `delete_slide`, `upload_media` a `delete_media`.

## Sekce obsahu

Hlavní formulář upravuje čtyři bloky bohatého textu, každý se svým vlastním editorovým kartou.

| Sekce | Sloupec obsahu | Sloupec formátu | Kde se objevuje |
|---|---|---|---|
| Hero | `hero_content` | `hero_format` | Hlavní banner (když je slider hlavního bannera prázdný) |
| Subhero | `subhero_content` | `subhero_format` | Podhlavní banner |
| Buyback | `buyback_content` | `buyback_format` | Blok akce pro výkup / výměnu |
| Footer | `footer_content` | `footer_format` | Oblast bohatého textu v zápatí |

Každá editorová karta nabízí:

- Přepínač **Formát** se dvěma přepínači: **Markdown** nebo **HTML**.
  Vybraný formát je uložen v odpovídajícím sloupci `*_format` a určuje, jak se obsah vykreslí.
- Monospaced pole pro **Obsah** (6 řádků, zvětšitelné).
- Živý box **Náhled**, který vykresluje aktuální obsah, nebo zprávu "nic zatím" při prázdném stavu.

Můžete vložit nahraná média do jakéhokoli bloku pomocí tokenu pro média, `{{media:<slug>}}`, který se při vykreslení vyřeší na URL média.
Zkopírujte přesný token z tabulky médiální knihovny (viz níže).

Stiskněte **Uložit změny**, abyste poslali POST s `_action=save_content`; všechny čtyři bloky jsou uloženy společně pomocí `updateStoreConfig`.
Prázdná textová pole se ukládají jako null.

## Snímky hlavního bannera

Pod formulářem se nachází editor **Snímky hlavního bannera**.
Pokud existuje jeden nebo více viditelných snímků, řídí hlavní banner domovské stránky jako slider a má přednost před prostým textem `hero_content`.

Pole formuláře pro přidání/upravu:

| Pole | Název formuláře | Uložený sloupec | Poznámky |
|---|---|---|---|
| Nadpis | `headline` | `headline` | Povinné, zkrácené. |
| Podnadpis | `subheadline` | `subheadline` | Volitelné. |
| Obrázek | `image_url` | `image_url` | Výběr obrázku (vyberte z knihovny nebo vložte URL). |
| Text CTA | `cta_text` | `cta_text` | Označení tlačítka. |
| Odkaz CTA | `cta_link` | `cta_link` | Cíl tlačítka. |
| Pořadí | `sort_order` | `sort_order` | Číslo; nižší se zobrazí dříve. |
| Viditelné | `is_visible` | `is_visible` | Zaškrtávací pole, výchozí stav zaškrtnuto. |

Pod formulářem je tabulka existujících snímků zobrazující Nadpis, Pořadí, Viditelné (Viditelné/Skryté) a Akce.

### Jak přidat nebo upravit snímek

1. Vyplňte formulář a klikněte na **Přidat snímek** k vytvoření (`_action=save_slide` bez `slide_id`).
2. Pro úpravu klikněte na **Upravit** v řádku; stránka se znovu načte s `?edit_slide=<id>` a formulář je předvyplněn.
   Upravování zobrazuje odkaz **Zrušit** a tlačítko **Uložit snímek**.
3. Pro odstranění klikněte na **Odstranit** v řádku a potvrďte výzvu (`_action=delete_slide`).

Snímky také obsahují sloupec `overlay_opacity` v databázi (síla tmavého překryvu), který je spravován tématem, nikoli je zobrazen jako pole v tomto formuláři.

## Médiální knihovna

Spodní karta je **Médiální knihovna**, která je sdílena napříč administrací.

### Nahrávání

| Pole | Název formuláře | Poznámky |
|---|---|---|
| Slug | `slug` | Malými písmeny, oddělený pomlčkami (`pattern="[a-z0-9]+(-[a-z0-9]+)*"`). Identifikátor používaný v tokenu `{{media:slug}}`. |
| Alternativní text | `alt` | Popis pro přístupnost. |
| Soubor | `file` | Akceptuje `image/*` nebo `video/*`. Povinné. |

Klikněte na **Nahrát** (`_action=upload_media`).
Nahrávání probíhá pouze tehdy, když jsou přítomny soubor s velikostí > 0 a slug.

### Tabulka médií

Každý nahraný položka je řádek s:

- **Náhled** - miniatura (tag `<img>` pro obrázky, ztlumené tag `<video>` pro videa).
- **Slug** - identifikátor, který jste nastavili.
- **Typ** - Obrázek nebo Video (z pole `media_type`).
- **Token** - řetězec `{{media:<slug>}}` plus tlačítko **Kopírovat**, které ho zkopíruje do schránky a krátce zobrazí potvrzení "zkopírováno".
- Tlačítko **Odstranit** (`_action=delete_media`) k odstranění položky.

Prázdná knihovna zobrazuje zprávu "žádná média".

## Data a úložiště (cloud)

- Bloky obsahu: čte/zapisuje `hero_content`, `hero_format`, `subhero_content`, `subhero_format`, `buyback_content`, `buyback_format`, `footer_content`, `footer_format` v řádku `store_configs` (`updateStoreConfig`).
- Snímky hlavního bannera: tabulka `hero_slides` (`fetchHeroSlides`, `createHeroSlide`, `updateHeroSlide`, `deleteHeroSlide`), omezená podle `party_id`.
- Média: tabulka `store_media` (`fetchStoreMedia`, `uploadStoreMedia`, `deleteStoreMedia`).
  Soubory jsou uloženy v bucketu Supabase Storage `store-media` a veřejná URL je uložena v `store_media.url`.

## Související stránky

- [Nastavení obchodu - Rozložení](/docs/admin/settings-layout) - povolte hlavní banner, podhlavní banner, akci pro výkup a další bloky
- [Nastavení obchodu - Vzhled značky](/docs/admin/settings-branding) - výběry obrázků zde čerpají z stejné médiální knihovny
- [Produkty](/docs/admin/products) - obrázky produktů mohou používat nahraná média
- [Kategorie](/docs/admin/categories) - obrázky kategorií používají médiální knihovnu
