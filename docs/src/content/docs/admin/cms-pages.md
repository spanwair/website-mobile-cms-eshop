---
title: Stránky obsahu
description: Vytvářejte a upravujte stránky obsahu obchodu, jako jsou O nás, Kontakt, FAQ a cílové stránky na míru
---

Stránky obsahu jsou samostatné informační stránky vašeho obchodu - O nás, Kontakt, informace o doručení, detaily o výrobě na míru a všechny právní dokumenty.
Každá stránka se vykreslí na živé stránce na adresě `/stranka/{slug}` a lze ji propojit z vašeho hlavičkového panelu pomocí [Navigace](/docs/admin/cms-navigation) nebo z patičky.
Jedná se o druhou záložku v sekci Obsah, vedle [Navigace](/docs/admin/cms-navigation), [Blog](/docs/admin/cms-blog), [Tým](/docs/admin/cms-team), [FAQ](/docs/admin/cms-faq) a [Právní dokumenty](/docs/admin/cms-legal).

## Požadované oprávnění

| Bit oprávnění | Název | Kdo ho má výchozí |
|---|---|---|
| 2048 | MANAGE_CMS | Vlastník, Administrátor, Administrátor e-shopu (s tímto bitem) |

Bez bitu MANAGE_CMS vás systém přesměruje na `/admin`.
Pokud není vybrána žádná organizace, budete přesměrováni na `/admin/parties/new` (vlastník) nebo `/admin/setup` (administrátor e-shopu).
Zákazníci (role USER) jsou přesměrováni na `/nástěnka`.

## Seznam stránek (`/admin/cms/pages`)

Panel nástrojů zobrazuje počet ("N stránek obsahu") a tlačítko **+ Nová stránka**.
Tabulka uvádí všechny stránky pro aktivní organizaci, seřazené podle **Pořadí seřazování** sestupně.

| Sloupec | Zdroj | Poznámky |
|---|---|---|
| Název | `title` | Ztučnělý. |
| Slug | `slug` | Zobrazený jako živá cesta `/stranka/{slug}`. |
| Šablona | `template` | Jedna z `default`, `about`, `contact`, `faq`. |
| Viditelný | `is_visible` | Zobrazuje "Viditelný" nebo "Skrytý". |
| Akce | - | **Upravit** a **Smazat**. |

**Smazat** zde vyžaduje potvrzení a okamžitě odstraní stránku.
Pokud nejsou žádné stránky, tabulka zobrazí "Není zatím žádné stránky obsahu."

Pro Kytka z Beskyd tato seznam obsahuje stránky jako `o-me`, `kontakt`, `vyroba-na-zakazku`, `velikosti-vencu`, `nas-tym`, `faq`, plus právní sadu (`obchodni-podminky`, `ochrana-osobnich-udaju` a tak dále).

## Vytváření stránky (`/admin/cms/pages/new`)

### Jak to udělat

1. Klikněte na **+ Nová stránka** v panelu nástrojů.
2. Zadejte **Název** (povinné). Slug se automaticky vyplní z názvu, dokud jej manuálně upravíte.
3. Upravte **Slug**, pokud je to nutné (pouze malá písmena, čísla a mezery).
4. Vyberte **Šablonu**.
5. Napište **Text** a vyberte odpovídající **Formát textu** (Markdown nebo HTML).
6. Volitelně vyplňte **SEO název** a **SEO popis**.
7. Volitelně nastavte **Zobrazit v sloupci patičky (klíč)** a **Pořadí seřazování**.
8. Nechte **Viditelný** zaškrtnuté pro okamžité publikování, nebo ho odškrtněte, abyste ji zachovali jako návrh.
9. Klikněte na **Vytvořit stránku**. Budete okamžitě přesměrováni na obrazovku pro úpravu nové stránky.

Tlačítko **Zrušit** a odkaz **← Zpět** vás vrátí na seznam stránek.

### Reference polí

| Pole | Sloupec v `content_pages` | Povinné | Popis |
|---|---|---|---|
| Název | `title` | Ano | Nadpis stránky, zobrazený jako `<h1` na živé stránce a použitý jako fallback pro `<title>`. |
| Slug | `slug` | Ano | Segment URL; stránka se nachází na `/stranka/{slug}`. Automaticky odvozený z názvu, upravitelný, ověřený pro `[a-z0-9]` s jedním mezery. Musí být unikátní v rámci vaší organizace. |
| Šablona | `template` | Ne | Varianta rozložení - viz tabulku šablon níže. Výchozí je `default`. |
| Text | `body` | Ne | Hlavní obsah. Podporuje Markdown nebo surový HTML v závislosti na formátu. |
| Formát textu | `body_format` | Ne | `markdown` (výchozí) nebo `html`. Markdown je analyzován do HTML, poté jsou obě cesty sterilizovány. |
| SEO název | `seo_title` | Ne | Přepíše název prohlížeče/záložky a název vyhledávacího výpisu. Fallback na Název. |
| SEO popis | `seo_description` | Ne | Meta popis pro vyhledávače. |
| Zobrazit v sloupci patičky (klíč) | `show_in_footer_column` | Ne | Klíč sloupce patičky (např. `information`). Přiřazuje tuto stránku k sloupci patičky, aby se objevila v patičce obchodu. Právní stránky Kytky používají `information`. |
| Pořadí seřazování | `sort_order` | Ne | Číslo, nejmenší první. Kontroluje pořadí v seznamu a v rámci sloupce patičky. Výchozí 0. |
| Viditelný | `is_visible` | Ne | Výchozí zaškrtnuto. Obchod zobrazuje pouze stránky, kde je toto pravda; skryté stránky vrátí návštěvníkům 404, ale zůstávají upravitelné zde. |

### Šablony

Šablona mění to, co obchod vykreslí, kromě obsahu.

| Šablona | Hodnota | Dodatečné vykreslení na `/stranka/{slug}` |
|---|---|---|
| Default | `default` | Pouze název a text. Používá se pro většinu stránek, včetně všech právních dokumentů. |
| O nás (vykresluje síť týmu) | `about` | Přidává aktivní [členy týmu](/docs/admin/cms-team) jako fotogalériu pod textem. |
| Kontakt (vykresluje kontaktní informace obchodu) | `contact` | Přidává telefon, e-mail a obchodní hodiny obchodu z nastavení obchodu. |
| FAQ (vykresluje akordeon FAQ) | `faq` | Přidává vaše [položky FAQ](/docs/admin/cms-faq) jako akordeon pod textem. |

Toto je důležité: Členové [Týmu](/docs/admin/cms-team) a položky [FAQ](/docs/admin/cms-faq) se nikdy nezobrazují na vlastní URL.
Objevují se pouze tehdy, když existuje a je viditelná stránka obsahu, která používá šablonu `about` (tým) nebo `faq` (FAQ).
Takže pokud chcete publikovat svůj tým, vytvořte stránku O nás se šablonou `about`; pokud chcete publikovat FAQ, vytvořte stránku se šablonou `faq`.

### Obsah textu, Markdown a média

Textové pole je prosté textové pole (10 řádků), ne editor typu WYSIWYG.

- S formátem **Markdown** můžete používat nadpisy, tučné písmo, *skloněné písmo*, seznamy, odkazy, citace a obrázky. Právní stránky Kytky jsou napsány v Markdownu (např. `## Obchodní podmínky` s podsekcemi `###`).
- S formátem **HTML** píšete surový HTML. Fixní povolený seznam tagů přežije sterilizaci (`h1`-`h6`, `p`, `br`, `hr`, `strong`, `em`, `b`, `i`, `u`, `a`, `ul`, `ol`, `li`, `blockquote`, `img`, `video`, `source`, `div`, `span`, `figure`, `figcaption`). Odkazy mohou obsahovat třídy tlačítek stránky `btn`, `btn-primary`, `btn-secondary`, `btn-ghost`; jakákoli jiná třída nebo tag (včetně `<script>`, `<iframe`, `on*` handlerů a inline stylů) je odstraněna.
- Pro vložení obrázku nebo videa z vaší médiátéky vložte do textu token média `{{media:slug}}`. Rozbalí se na správný `<img>`/`<video>` před vykreslením. Neznámý slug se tichým způsobem rozbalí na nic. Spravujte tyto média a zkopírujte jejich slugy z médiátéky v nastavení obchodu.

## Upravování stránky (`/admin/cms/pages/{id}`)

Upravovací formulář je identický s formulářem pro vytvoření, ale je předvyplněn.
Uložte pomocí **Uložit změny**; po uložení zůstanete na stránce úprav.
Oddělené tlačítko **Smazat stránku** v dolní části se ptá: "Jste si jisti? Toto nelze zrušit." před smazáním.
Pokud ID stránky neexistuje, budete přesměrováni zpět na seznam.

Změna **Slugu** živé stránky naruší všechny stávající odkazy nebo oblíbené odkazy na starou cestu `/stranka/{slug}` a naruší odkazy v hlavičce, které na ni ukazovaly - aktualizujte je v [Navigaci](/docs/admin/cms-navigation).

## Data a úložiště (cloud)

- Tabulka: `content_pages` (sloupce `party_id`, `slug`, `title`, `template`, `body`, `body_format`, `seo_title`, `seo_description`, `show_in_footer_column`, `is_visible`, `sort_order`).
- Slugy jsou normalizovány pomocí sdíleného pomocníka `resolveSlug` při uložení.
- Obchod čte viditelné stránky podle slugu pomocí `fetchContentPageBySlug`; šablony `about`/`faq`/`contact` dodatkowo čtou `team_members`, `faq_items` a kontaktní nastavení obchodu.
- Tokeny média se rozřešují proti tabulce `store_media` (Skladovací koše `store-media`).

## Související stránky

- [Navigace](/docs/admin/cms-navigation) - propojuje stránky do hlavního menu (zobrazují se jako návrhy URL `/stranka/{slug}`)
- [Tým](/docs/admin/cms-team) - zobrazuje se pouze přes stránku s šablonou `about`
- [FAQ](/docs/admin/cms-faq) - zobrazuje se pouze přes stránku s šablonou `faq`
- [Právní dokumenty](/docs/admin/cms-legal) - kontrolní seznam, který vytváří/upravuje standardní právní stránky prostřednictvím tohoto stejného editoru
- [Blog](/docs/admin/cms-blog) - pro datované články namísto trvalých stránek
