---
title: Tým
description: Spravujte členy týmu zobrazené na vaší stránce o nás - jméno, pozice, biografie, fotografie a pořadí
---

Stránka Tým spravuje osoby zobrazené na vašem obchodě (obvykle na stránce o nás).
Nachází se pod záložkou **Tým** v CMS vedle [Navigace](/docs/admin/cms-navigation), [Stránky](/docs/admin/cms-pages), [Blog](/docs/admin/cms-blog), [FAQ](/docs/admin/cms-faq) a [Právní stránky](/docs/admin/cms-legal).

## Požadovaná oprávnění

| Permission bit | Name | Kdo ho má výchozí |
|---|---|---|
| 2048 | MANAGE_CMS | Vlastník, Administrátor, Administrátor obchodu (s tímto bitem) |

Bez `MANAGE_CMS` vás systém přesměruje na `/admin`.

## Dispozice stránky (`/admin/cms/team`)

Stránka je jedním editačním formulářem nad tabulkou seznamu - neexistuje samostatná cesta pro vytvoření.
Kliknutí na **Upravit** v řádku znovu načte stejnou stránku s `?edit={id}` a vyplní formulář; odkaz **Zrušit** se vrátí do prázdného stavu „přidat“.

### Formulář pro přidání / úpravu

| Pole | Sloupec | Poznámky |
|---|---|---|
| Jméno | `team_members.name` | Požadováno. |
| Pozice | `team_members.position` | Název práce / role, např. "Zakladatelka a kytkářka". |
| Biografie | `team_members.bio` | Krátká biografie (textové pole 2 řádky). |
| Fotografie | `team_members.photo_url` | Vybráno pomocí `ImagePicker` z médiátéky obchodu [media library](/docs/admin/settings-content). |
| Pořadí | `team_members.sort_order` | Nižší čísla se zobrazí nejprve. |
| Aktivní | `team_members.is_active` | Odškrtnutí skryje člena bez jeho mazání. |

Odeslání s skrytým `id` aktualizuje; bez něj vytvoří. Po úspěchu se vrátíte na `/admin/cms/team`.

### Tabulka seznamu

Sloupce: Jméno, Pozice, Pořadí, Aktivní (zobrazeno jako Aktivní/Neaktivní), Akce (**Upravit** / **Smazat** s `confirm()`).
Prázdný seznam zobrazuje centrový řádek „žádní členové“.

Kytka z Beskyd zahrnuje jednoho člena: Natálie Ruszová, "Zakladatelka a kytkářka".

## Data a úložiště (cloud)

- **Tabulka:** `team_members` (`party_id`, `name`, `position`, `bio`, `photo_url`, `sort_order`, `is_active`).
- **Služby:** `fetchTeamMembers`, `createTeamMember`, `updateTeamMember`, `deleteTeamMember` (`teamMemberService`); `fetchStoreMedia` pro výběr fotografie.
- **Komponenty:** `ImagePicker`, `CmsTabs`.
- Omezeno na `ctx.partyId`.

## Související stránky

- [Stránky](/docs/admin/cms-pages) - stránka s obsahem „o nás“, kde je tým obvykle zobrazen
- [Obsah domovské stránky](/docs/admin/settings-content) - médiátéka, kterou používá výběr fotografie
