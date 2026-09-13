---
title: Patička
description: Vytvářejte sloupce odkazů patičky obchodu, skupujte odkazy pod systémovými nebo vlastními sloupci
---

Stránka nastavení Patičky vytváří sloupce odkazů zobrazené v patičce vašeho obchodu.
Každý odkaz patří do sloupce (systémový sloupec jako „Obchod“ nebo vlastní, které pojmenujete) a může ukazovat na obsahovou stránku, filtr kategorie nebo jakoukoli URL.
Je to jedna záložka v sadě [Nastavení obchodu](/docs/admin/settings-branding) vedle [Odznaků](/docs/admin/settings-badges), [Domén](/docs/admin/settings-domains) a ostatních.

## Požadované oprávnění

| Permission bit | Name | Kdo ho má výchozí |
|---|---|---|
| 1024 | MANAGE_SETTINGS | Vlastník, Administrátor, Administrátor e-shopu (s tímto bitem) |

Bez `MANAGE_SETTINGS` vás systém přesměruje na `/admin`.

## Dispozice stránky (`/admin/settings/footer`)

Jednoduchý formulář pro přidání/upravu nad tabulkou seznamu (upravit se načte s `?edit={id}`; Zrušit se vrátí do prázdného formuláře).

### Formulář pro přidání/upravu odkazu

| Pole | Column | Poznámky |
|---|---|---|
| Column | `footer_links.column_key` | `CreatableCombobox`: vyberte systémový sloupec nebo zadejte nový vlastní klíč. Výchozí je `shop`. |
| Label | `footer_links.label` | Viditelný text odkazu. |
| URL | `footer_links.url` | `CreatableCombobox` předvyplněný vašimi obsahovými stránkami (jako `/stranka/{slug}`); můžete také zadat jakoukoli URL. |
| Sort order | `footer_links.sort_order` | Nižší čísla se zobrazí nejprve v rámci sloupce. |
| Visible | `footer_links.is_visible` | Odškrtnutí skryje odkaz bez jeho mazání. |

### Systémové sloupce

Vstrojené klíče sloupců (z `SYSTEM_FOOTER_COLUMNS`) jsou: `shop`, `information`, `purchase_info`, `customer_service` a `custom`.
Jakýkoli jiný klíč, který zadáte, se stane vlastním sloupcem a bude zobrazen pod tímto doslovným klíčem.

### Tabulka seznamu

Sloupce: Sloupec (lokalizovaný název), Název, URL, Pořadí, Viditelné, Akce (**Upravit** / **Smazat** s `confirm()`).
Prázdný seznam zobrazuje vycentrovovaný řádek „žádné odkazy“.

Kytka z Beskyd nastavuje tři sloupce: `shop` (odkazy na kategorie), `information` (o nás, tým, průvodce na míru, průvodce velikostmi, blog, kontakt) a `customer_service` (FAQ, kontakt).
Světle/tmavý vzhled patičky je řízen zvlášť pomocí `footer_theme` v [Vzhledu značky](/docs/admin/settings-branding).

## Data a úložiště (cloud)

- **Tabulka:** `footer_links` (`party_id`, `column_key`, `label`, `url`, `sort_order`, `is_visible`).
- **Služby:** `fetchFooterLinks`, `createFooterLink`, `updateFooterLink`, `deleteFooterLink` (`footerLinkService`); `fetchContentPages` pro combobox URL.
- **Konstanty:** `SYSTEM_FOOTER_COLUMNS` z `shared/constants/footer.ts`.
- **Komponenty:** `CreatableCombobox`, `SettingsTabs`.
- Omezeno na `ctx.partyId`.

## Související stránky

- [Stránky](/docs/admin/cms-pages) - obsahové stránky, na které odkazuje combobox URL
- [Právní stránky](/docs/admin/cms-legal) - právní dokumenty, na které obvykle odkazujete z patičky
- [Vzhled značky](/docs/admin/settings-branding) - nastavení `footer_theme` (světle/tmavě)
- [Odznaky](/docs/admin/settings-badges) - odznaky pro platby/dopravu/sociální sítě zobrazené poblíž patičky
