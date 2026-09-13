---
title: Oznámení
description: Vždy viditelná schránka oznámení pro uživatele v panelu administrátora
---

Oznámení na `/admin/notifications` je vaše osobní schránka v panelu administrátora.
Seznamuje systémové zprávy určené vašemu účtu, jako jsou pozvánky a změny stavu.
Je to jediná stránka administrátora, která je vždy dostupná, proto [nástěnka](/docs/admin/dashboard) přesměrovává sem, když uživatel nemá oprávnění k nástěnce.

## Požadované oprávnění

Žádné.
Stránka má bit oprávnění `0`, takže její položka v bočním panelu je vždy vykreslena pro jakéhokoli administrátora a žádná kontrola oprávnění neblokuje tělo stránky.
Jediné požadavky na přístup jsou platná přihlašovací relace a kontext administrátora.

| Podmínka | Přesměrování |
|---|---|
| Žádná přihlašovací relace | `/login` |
| `requireAdminCtx` vrátí `null` | `/dashboard` |
| Jinak | Vykreslí schránku |

## Tabulka oznámení

Oznámení jsou uvedena od nejnovějších informací.

| Sloupec | Popis |
|---|---|
| Časové razítko | Kdy bylo oznámení vytvořeno, zobrazeno jako plné lokální datum a čas v malém ztlumeném textu |
| Typ | Typ oznámení systému, zobrazený v monospaced písmu (např. typ pozvánky nebo schválení) |
| Název | Název oznámení, nebo pomlčka, pokud není žádný |
| Zpráva | Text těla oznámení v ztlumeném typu, nebo pomlčka, pokud není žádný |
| Stav | Odznak s textem **Nepřečtené** (zelená) nebo **Přečtené** (šedá) |

Nepřečtené řádky jsou vykresleny v tučném písmu, aby přitáhly pozornost.
Na této stránce neexistuje filtr, vyhledávání, paginace ani ovládání pro označení jako přečtené; je to přímý seznam pouze pro čtení.
Pokud nemáte žádná oznámení, tabulku vyplní centrován zprávový prázdný stav.

## Rozsah

Tato schránka je **pro uživatele, ne pro organizaci**.
Seznam pochází z volání `fetchUserNotifications` s vaším vlastním uživatelským ID, takže změna aktivní organizace neovlivní to, co zde vidíte.
Oznámení vás sledují napříč každou organizací, příslušné k ní.

## Data a úložiště (cloud)

- Čte tabulku `notifications` filtrovanou pro přihlášeného uživatele, pomocí `fetchUserNotifications`.
  Zobrazené sloupce: `created_at`, `type`, `title`, `body` a `read_at` (který řídí odznak přečtené/nepřečtené a tučné stylizace).
- Čte `profiles` a `parties` pouze prostřednictvím `requireAdminCtx` pro okolní rozložení.
- Stránka nic nepisuje.

## Související stránky

- [Nástěnka](/docs/admin/dashboard) - přesměrovává sem pro administrátory, kteří nemají bit VIEW_DASHBOARD
- [Organizace](/docs/admin/parties) - pozvánky, které generují oznámení, pocházejí odtud
- [Protokol auditu](/docs/admin/audit) - záznam o aktivitě celé organizace, odlišný od této schránky pro uživatele
