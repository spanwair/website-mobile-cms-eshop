---
title: Odznaky
description: Spravujte odznaky důvěryhodnosti - platby, dopravy, sociální sítě a funkce obchodu - zobrazené poblíž zápatí obchodu
---

Stránka Odznaky spravuje malé odznaky důvěryhodnosti/užitečnosti zobrazené poblíž zápatí vašeho obchodu: přijímané platební metody, dopravci, odkazy na sociální sítě a ikony funkcí obchodu.
Je to jedna záložka v sadě [Nastavení obchodu](/docs/admin/settings-branding), vedle [Zápatí](/docs/admin/settings-footer) a [Domén](/docs/admin/settings-domains).

## Požadované oprávnění

| Permission bit | Name | Kdo ho má výchozí |
|---|---|---|
| 1024 | MANAGE_SETTINGS | Vlastník, Administrátor, Administrátor e-shopu (s tímto bitem) |

Bez `MANAGE_SETTINGS` vás systém přesměruje na `/admin`.

## Dispozice stránky (`/admin/settings/badges`)

Na horní straně je jedno formulář pro přidání/upravu, poté jedna tabulka pro každý typ odznaku (upravit znovu načte s `?edit={id}`; Zrušit se vrátí na prázdné formuláře).

### Formulář pro přidání / úpravu odznaku

| Pole | Sloupec | Poznámky |
|---|---|---|
| Kind | `footer_badges.kind` | Jeden z `shipping`, `payment` (výchozí), `social`, `store_feature`. |
| Icon | `footer_badges.icon` | Emoji nebo krátký glyf, např. `💳`. |
| Label | `footer_badges.label` | Požadované, např. "Visa". |
| URL | `footer_badges.url` | Volitelný odkaz (např. sociální profil). |
| Sort order | `footer_badges.sort_order` | Nižší čísla nejprve v rámci typu. |
| Visible | `footer_badges.is_visible` | Odškrtnutí skrývá bez mazání. |

### Čtyři skupiny typů

Odznaky jsou seskupeny do čtyř samostatných tabulek, po jedné pro každý typ, každá s sloupci Ikona, Název, Pořadí, Viditelné, Akce (**Upravit** / **Smazat** s `confirm()`):

| Kind | Typické použití |
|---|---|
| Shipping | Loga dopravců (PPL, Packeta). |
| Payment | Přijímané platební metody (Visa, Mastercard, Apple Pay). |
| Social | Odkazy na sociální profily. |
| Store feature | Ikony zajištění (bezpečné pokladny, vyrobeno v ČR). |

Každá prázdná skupina zobrazuje svůj vlastní řádek „žádné odznaky“.

## Data a úložiště (cloud)

- **Tabulka:** `footer_badges` (`party_id`, `kind`, `icon`, `label`, `url`, `sort_order`, `is_visible`).
- **Služby:** `fetchFooterBadges`, `createFooterBadge`, `updateFooterBadge`, `deleteFooterBadge` (`footerBadgeService`).
- **Typy:** `FooterBadgeKind`.
- **Komponenta:** `SettingsTabs`.
- Omezeno na `ctx.partyId`.

## Související stránky

- [Zápatí](/docs/admin/settings-footer) - zápatí, kde se tyto odznaky nacházejí vedle
- [Doprava](/docs/admin/settings-shipping) - dopravci, které by odznak dopravy propagoval
