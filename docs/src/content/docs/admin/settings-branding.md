---
title: Nastavení obchodu - Vzhled značky
description: Nastavte název obchodu, logo, barvy, písma, poloměr zaoblení a styl produktových karet
---

Vzhled značky je první záložka v Nastavení obchodu a určuje, jak vypadá a jak se cítí váš obchod.
Vše, co zde nastavíte, se do výstupního motoru tématu, který vykresluje váš veřejný obchod na `/eshop-<slug>`, zařadí.
Dělá to ve spolupráci s [Rozložení](/docs/admin/settings-layout) (které sekce se objevují na domovské stránce) a [Obsah](/docs/admin/settings-content) (texty a obrázky uvnitř těchto sekcí).

Stránka je dostupná na `/admin/settings/branding` a je přístupná z položky **Nastavení** v bočním panelu (skupina Systém), poté záložka **Vzhled značky**.
Každá záložka Nastavení obchodu sdílí horní lištu záložek a tlačítko **Zobrazit obchod**, které otevře `/eshop-<váš-slug>` v nové záložce, abyste mohli předzkušet změny.

## Požadovaná oprávnění

| Bit oprávnění | Název | Kdo ho má výchozí |
|---|---|---|
| 1024 | MANAGE_SETTINGS | Vlastník, Administrátor, Administrátor e-shopu (s tímto bitem) |

Proces přístupu vynucený na horní části stránky:

1. Žádná přihlašovací relace -> přesměrován na `/login`.
2. Žádný kontext administrátora (`requireAdminCtx` vrátí null) -> přesměrován na `/dashboard`.
3. Kontext administrátora, ale žádná aktivní organizace -> přesměrován na `/admin/parties/new` (vlastník) nebo `/admin/setup` (všichni ostatní).
4. Organizace přítomna, ale chybí MANAGE_SETTINGS -> přesměrován na `/admin`.

Všechna nastavení platí pro vaši aktuálně vybranou organizaci.
Přepínejte organizace pomocí přepínače organizací před editací, pokud spravujete více než jednu.

## Designové přednastavení

Na horní části formuláře se nachází panel **Designové přednastavení**.
Každé přednastavení je karta zobrazující tři barevné vzorky (primární, sekundární, povrch), popis a písmo těla přednastavení.

- Klikněte na jakoukoli vestavěnou kartu přednastavení, abyste okamžitě vyplnili výběry barev, pole `font_heading`, `font_body` a `radius_scale`.
  Nic se neuloží, dokud nepřejmete **Uložit změny** na dole.
- Vlastní přednastavení, která jste dříve uložili, se zobrazí vedle vestavěných, označená jako vlastní, každé s tlačítkem "x" pro odstranění.
- Chcete-li uložit aktuální barvy jako znovu použitelné šablony, zadejte název do pole **název šablony** a klikněte na **Uložit jako šablona**.
  Toto pošle POST na `/api/admin/color-presets` a uloží sedm barevných polí.
- Odstranění vlastního přednastavení volá `DELETE /api/admin/color-presets?id=...` a znovu načte stránku.

Vlastní přednastavení jsou uložena pro každou organizaci v tabulce `party_color_presets`.

## Sekce Vzhled značky

| Pole | Název formuláře | Uložená sloupec | Poznámky |
|---|---|---|---|
| Název značky | `brand_name` | `brand_name` | Název obchodu zobrazený v hlavičce a titulkách. Prázdné se uloží jako null. Příklad Kytka: `Kytka z Beskyd`. |
| Podtitul | `tagline` | `tagline` | Krátký slogan pod názvem značky. Příklad Kytka: `Krása, která nikdy neuvadne`. |
| Logo | `logo_url` | `logo_url` | Výběr obrázku (viz níže). Logo v hlavičce. |
| Favicon | `favicon_url` | `favicon_url` | Výběr obrázku. Ikona v záložce prohlížeče. |

### Výběr obrázku

Logo, favicon a fotografie obchodu používají sdílený kontrolér pro výběr obrázků.
Každý zobrazuje textové pole s URL, malou náhledovou miniaturom 40x40, když je nastavená hodnota, tlačítko **Vymazat** a tlačítko **Vybrat z knihovny**.
Vybrat z knihovny otevře výběr médií vyplněný z vaší [knihovny médií](/docs/admin/settings-content) (tabulka `store_media`).
Můžete také přímo vložit jakýkoli externí URL do textového pole.

## Sekce Kontakt

| Pole | Název formuláře | Uložená sloupec | Poznámky |
|---|---|---|---|
| Telefon | `contact_phone` | `contact_phone` | Zobrazeno v patičce a na kontaktní stránce. |
| E-mail | `contact_email` | `contact_email` | Typ vstupu `email`. |
| Obchodní doba | `business_hours` | `business_hours` | Volný text. Placeholder `Po-Ne: 8:30 - 20:00`. |
| Kód měny | `currency_code` | `currency_code` | Max. 3 znaky, vynucené velké písmo při uložení. Výchozí je `CZK`. Kytka používá `CZK`. |

Poznámka pod touto sekcí vysvětluje, že tyto detaily se zobrazují na obchodě (kontaktní stránka a patička).

## Sekce Návštěva obchodu

| Pole | Název formuláře | Uložená sloupec | Poznámky |
|---|---|---|---|
| Adresa obchodu | `store_address` | `store_address` | Fyzická adresa. Placeholder `Vodičkova 10, Praha 1`. |
| URL mapy | `store_map_url` | `store_map_url` | Odkaz na Google Maps nebo podobné. Placeholder `https://maps.google.com/...`. |
| Fotografie obchodu | `store_photo_url` | `store_photo_url` | Výběr obrázku. Fotografie fyzického obchodu. |
| Téma patičky | `footer_theme` | `footer_theme` | Vybrat: **Světle** nebo **Tmavě**. Kontroluje pozadí patičky. Kytka používá `dark`. |

Téma patičky zde je stejné nastavení odkazované z záložky [Odkazy patičky](/docs/admin/settings-footer).

## Sekce Barvy

Sedm výběrů barev rozloženo v mřížce.
Každý zobrazuje nativní barevný vzorek HTML plus aktuální hex hodnota v monospaced písmu vedle něj.
Když aplikujete přednastavení, hex popis se aktualizuje v reálném čase.

| Výběr | Název formuláře | Uložená sloupec | Výchozí | Hodnota Kytka |
|---|---|---|---|---|
| Primární | `color_primary` | `color_primary` | `#4F46E5` | `#7C4F93` |
| Sekundární | `color_secondary` | `color_secondary` | `#7C3AED` | `#C97B4A` |
| Pozadí | `color_background` | `color_background` | `#FFFFFF` | `#FDFBF7` |
| Povrch | `color_surface` | `color_surface` | `#F8F9FA` | `#F7F1E8` |
| Text primární | `color_text_primary` | `color_text_primary` | `#212529` | `#2E2A26` |
| Text sekundární | `color_text_secondary` | `color_text_secondary` | `#6C757D` | `#7A6F63` |
| Okraj | `color_border` | `color_border` | `#E9ECEF` | `#E8DFD0` |

Tyto sedm hodnot je vloženo jako CSS vlastní vlastnosti do obchodu, takže jejich změna přepíše barvy tlačítek, odkazů, karet a pozadí v celém obchodě.

## Sekce Typografie

| Pole | Název formuláře | Uložená sloupec | Výchozí | Hodnota Kytka |
|---|---|---|---|---|
| Písmo nadpisu | `font_heading` | `font_heading` | `Inter` | `Playfair Display` |
| Písmo těla | `font_body` | `font_body` | `Inter` | `Lora` |
| Poloměr zaoblení | `radius_scale` | `radius_scale` | `default` | `soft` |

Poloměr zaoblení je výběr s třemi možnostmi, které škálují `border-radius` v celém obchodě:

| Hodnota | Popis |
|---|---|
| `sharp` | Ostré rohy |
| `default` | Výchozí rohy |
| `soft` | Jemné rohy |

Písma se zadávají podle názvu; použijte písmo dostupné pro obchod (název rodiny Google Fonts, jako je `Playfair Display` a `Lora`).

## Sekce Komponenty

| Kontrolér | Název formuláře | Uložená sloupec | Poznámky |
|---|---|---|---|
| Varianta produktové karty | `product_card_variant` | `product_card_variant` | Výběr. Možnosti níže. Kytka používá `luxury`. |
| Zapnout seznam přání | `enable_wishlists` | `enable_wishlists` | Zaškrtávací políčko, výchozí zaškrtnuto. Zapíná nebo vypíná funkci seznamu přání v obchodě. |

Možnosti varianty produktové karty (z registru variant):

| Hodnota | Popis |
|---|---|
| `classic` | Klasické - obrázek, název, cena, hodnocení |
| `minimal` | Minimální - obrázek, název, cena |
| `luxury` | Luxusní - velký obrázek, písmo nadpisu, skromná cena |

Toto určuje, jak se každá produktová taška vykreslí v obchodě a v náhledech [Produktů](/docs/admin/products).

## Ukládání

Jedno tlačítko **Uložit změny** na dole odesílá celý formulář pomocí POST na stejnou URL.
V případě úspěchu se zobrazí zelený banner s uloženou zprávou; v případě selhání se zobrazí červený banner s chybovou zprávou vrácenou funkcí `updateStoreConfig`.
Všechna pole jsou zapsána v jednom `UPDATE` do řádku v `store_configs` odpovídajícím vaší `party_id`.

## Data a úložiště (cloud)

- Čte a zapisuje jeden řádek v `store_configs` (klíčovaný pomocí `party_id`) pomocí `fetchStoreConfig` / `updateStoreConfig`.
- Čte `store_media` (pro výběry obrázků) pomocí `fetchStoreMedia`.
- Čte `party_color_presets` pomocí `fetchColorPresets`; tlačítka Uložit jako šablona / odstranit volají `/api/admin/color-presets`.
- Na této stránce není přímo zapisováno žádné úložiště; nahrávání médií probíhá na záložce [Obsah](/docs/admin/settings-content) (úložiště `store-media`).

## Související stránky

- [Nastavení obchodu - Rozložení](/docs/admin/settings-layout) - vyberte, které sekce domovské stránky se zobrazují a v jakém pořadí
- [Nastavení obchodu - Obsah](/docs/admin/settings-content) - hrdinský, podhlavní, text patičky a knihovna médií, která napájí výběry obrázků zde
- [Nastavení obchodu - Patička](/docs/admin/settings-footer) - sloupce a odkazy patičky; také používá téma patičky nastavené zde
- [Produkty](/docs/admin/products) - produktové tašky vykreslené s variantou karty zvolenou zde
