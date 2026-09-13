---
title: Právní stránky
description: Kontrolní seznam standardních právních a informativních dokumentů, který sleduje, které existují, a poskytuje odkazy pro jejich vytvoření nebo úpravu.
---

Záložka Pravní stránky je kontrolní seznam standardních právních a informativních dokumentů pro e-shop, které by obchod měl mít.
Samotná stránka neukládá dokumenty - každý z nich je běžná stránka obsahu, kterou upravujete přes [Pages](/docs/admin/cms-pages).
Tato záložka pouze sleduje, které ze standardních slugů již existují, a poskytuje vám možnost vytvořit chybějící s jedním kliknutím.
Nachází se pod záložkou **Právní** v CMS vedle [Navigation](/docs/admin/cms-navigation), [Pages](/docs/admin/cms-pages), [Blog](/docs/admin/cms-blog), [Team](/docs/admin/cms-team) a [FAQ](/docs/admin/cms-faq).

## Požadované oprávnění

| Bit oprávnění | Název | Kdo ho má výchozí |
|---|---|---|
| 2048 | MANAGE_CMS | Vlastník, Administrátor, Administrátor e-shopu (s tímto bitem) |

Bez `MANAGE_CMS` budete přesměrováni na `/admin`.

## Kontrolní seznam (`/admin/cms/legal`)

Každý řádek představuje jeden standardní dokument, který zobrazuje jeho název, stav a akci:

| Stav | Akce |
|---|---|
| Vytvořen | Odkaz **Upravit stránku** otevře existující stránku obsahu na `/admin/cms/pages/{id}`. |
| Chybí | Tlačítko **Vytvořit stránku** otevře `/admin/cms/pages/new` předvyplněné standardním slugem a názvem. |

### Standardní sada dokumentů

Vstrojené slugy (české názvy, protože platforma je primárně pro CS) jsou:

| Slug | Název |
|---|---|
| `obchodni-podminky` | Obchodní podmínky |
| `ochrana-osobnich-udaju` | Ochrana osobních údajů |
| `cookies` | Zásady používání cookies |
| `vraceni-zbozi` | Vrácení zboží a odstoupení od smlouvy |
| `reklamace` | Reklamační řád |
| `platba-a-doprava` | Platba a doprava |
| `cenik-sluzeb-a-oprav` | Ceník služeb a oprav |
| `zaruka-originality` | Záruka originality |
| `peclive-testovano` | Pečlivě testováno |
| `vyhodne-ceny` | Výhodné ceny |
| `zakaznicky-servis` | Zákaznický servis |
| `kariera` | Kariéra |
| `esim` | eSIM |
| `bonusovy-program` | Bonusový program |

### Dokument o prodejní oznámení pro komise

Jedním extra řádkem je oznámení o prodeji komiseura (`SMALLJOBS_SALE_NOTICE_SLUG`).
Je automaticky vygenerováno v okamžiku, kdy organizace přepne na režim prodejce `smalljobs_commission` (viz [Organizations](/docs/admin/parties)) a je zde uvedeno, aby administrátoři mohli stále zkontrolovat.

## Data a úložiště (cloud)

- **Tabulka:** `content_pages` (samotné dokumenty; stejná tabulka [Pages](/docs/admin/cms-pages) je spravuje).
- **Služby:** `fetchContentPages` (`contentPageService`); konstanty `SMALLJOBS_SALE_NOTICE_SLUG`, `SMALLJOBS_SALE_NOTICE_TITLE_CS` z `legalTemplates`.
- **Komponenta:** `CmsTabs`.
- Záložka sama o sobě neobsahuje žádná data - je to přehled nad existujícími stránkami obsahu, omezený na `ctx.partyId`.

## Související stránky

- [Pages](/docs/admin/cms-pages) - zde jsou právní dokumenty skutečně autorizovány a upravovány
- [Footer](/docs/admin/settings-footer) - zde tyto dokumenty propojí do sloupců nočního kola obchodu
- [Organizations](/docs/admin/parties) - přepnutí na režim komise automaticky vytvoří dokument o prodejní oznámení
