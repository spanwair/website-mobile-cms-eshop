---
title: Nastavení obchodu - Výhody
description: Spravujte odznaky důvěryhodnosti a položky výhod zobrazené v vašem obchodě
---

Výhody jsou krátké prvky důvěryhodnosti (doprava zdarma, ruční kvalita, bezpečné platby a podobně), které se objevují v bloku "Výhody / odznaky důvěryhodnosti" na vaší domovské stránce.
Vykreslují se pouze tehdy, když je sekce `benefits` povolena v [Nastavení rozložení](/docs/admin/settings-layout).

Stránka je dostupná na `/admin/settings/benefits`, k níž se dostanete z položky **Nastavení** v bočním panelu, poté se přepnete na záložku **Výhody**.

## Požadované oprávnění

| Bit oprávnění | Název | Kdo ho má výchozí |
|---|---|---|
| 1024 | MANAGE_SETTINGS | Vlastník, Administrátor, Administrátor e-shopu (s tímto bitem) |

Řetězec ochrany: žádná přihlašovací relace -> `/login`; žádný kontext administrátora -> `/dashboard`; žádná aktivní organizace -> `/admin/parties/new` (vlastník) nebo `/admin/setup`; chybějící MANAGE_SETTINGS -> `/admin`.

## Formulář pro přidání / úpravu

Jedna karta v horní části upravuje jednu položku výhody.

| Pole | Název formuláře | Uložená sloupec | Poznámky |
|---|---|---|---|
| Ikona | `icon` | `icon` | Emoji nebo krátký symbol. Výchozí je `✓`. Placeholder `🛡️`. |
| Název | `title` | `title` | Povinný, zkrácený. |
| Popis | `description` | `description` | Volitelný textový pole (2 řádky). |
| Pořadí | `sort_order` | `sort_order` | Číslo; nižší se zobrazí dříve. |
| Viditelné | `is_visible` | `is_visible` | Zaškrtávací pole, výchozí zaškrtnuté. |

### Jak postupovat

1. Vyplňte Ikonu a Název (Název je povinný), volitelně Popis, Pořadí a Viditelné.
2. Klikněte na **Přidat výhodu**, abyste ji vytvořili.
3. Pro úpravu existující položky klikněte na **Upravit** v řádku tabulky; stránka se načte znovu s `?edit=<id>` a formulář je předvyplněn, zobrazí se odkaz **Zrušit** a tlačítko **Uložit snímek** (sdílený název).
4. Po úspěšném uložení nebo smazání se stránka přesměruje zpět na `/admin/settings/benefits`.

## Tabulka položek

Pod formulářem je tabulka se všemi položkami výhod.

| Sloupec | Zobrazuje |
|---|---|
| Ikona | Ikona ve velké velikosti |
| Název | Název výhody (tučné písmo) |
| Pořadí | Číslo pořadí |
| Viditelné | "Viditelné" nebo "Skryto" |
| Akce | Odkaz Upravit a tlačítko Smazat |

**Smazat** vyžaduje potvrzení před odstraněním položky.
Když nejsou žádné položky, tabulka zobrazuje centrovaný prázdný stav "žádné výhody".

### Příklad Kytka z Beskyd

Obchod Kytka obsahuje 6 položek výhod, seřazených podle `sort_order`, každá s emoji ikonou a krátkým názvem/popisem odrážejícím jeho pozicování jako ručně vyrobené sušené květiny.

## Data a úložiště (cloud)

- Čte a zapisuje do tabulky `benefit_items`, která je omezena pomocí `party_id`, prostřednictvím `fetchBenefitItems`, `createBenefitItem`, `updateBenefitItem`, `deleteBenefitItem`.
- Žádný úložiště nebo jiná tabulka není dotčena.

## Související stránky

- [Nastavení obchodu - Rozložení](/docs/admin/settings-layout) - povolte sekci `benefits`, aby se tyto položky zobrazily
- [Nastavení obchodu - Odznaky](/docs/admin/settings-badges) - samostatná odznaky v patičce (doprava/platba/sociální/funkce obchodu), ne výhody na domovské stránce
- [Nastavení obchodu - Vzhled značky](/docs/admin/settings-branding) - barvy tématu aplikované na blok výhod
