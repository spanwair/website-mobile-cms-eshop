---
title: Protokol auditu
description: Pouze čitelná historie akcí vytváření, aktualizace a mazání v datech vaší organizace
---

Protokol auditu je pouze čitelný, chronologický záznam změn dat v vaší organizaci.
Každé smysluplné vložení, aktualizace a mazání je zapisováno do `audit_logs`, což vám poskytuje sledovatelnost toho, kdo, co a kdy změnil.
Bit `MANAGE_AUDIT`, který otevírá tuto stránku, umožňuje také administrátorovi upravovat nastavení stran v [Organizacích](/docs/admin/parties) a přepočítávat fakturační období v [Zprávách](/docs/admin/reports).

## Požadované oprávnění

| Bit oprávnění | Název | Kdo ho má výchozí |
|---|---|---|
| 4096 | MANAGE_AUDIT | Vlastník, Administrátor, Eshop Administrátor (s tímto bitem) |

Bez `MANAGE_AUDIT` vás systém přesměruje na `/admin`.
Eshop administrátor bez organizace je poslán na `/admin/setup` (vlastník: `/admin/parties/new`).

## Zobrazení logů (`/admin/audit`)

Záznamy se načítají po 50 na stránku pomocí `fetchAuditLogs`, nejnovější jako první, omezeno na aktivní stranu, s celkovým počtem zobrazeným v pravém horním rohu.

### Filtrování tabulky

Rozbalovací nabídka zobrazuje všechny tabulky, které skutečně obsahují záznamy pro tuto organizaci (vygenerováno z unikátního dotazu přes `audit_logs.table_name`).
Vyberte jednu a stiskněte **Filtrovat**, abyste se zúžili na jednu tabulku; odkaz **Vyčistit** odstraní filtr.

### Sloupce

| Sloupec | Zdroj | Poznámky |
|---|---|---|
| Časové razítko | `created_at` | Celý datum a čas v aktuální lokalitě. |
| Akce | `action` | Odznak s barevnou kódováním: vytvoření/INSERT zelená, aktualizace/UPDATE hnědá, mazání/DELETE červená, vše ostatní šedá. Označení je lokalizované (Vytvořit / Aktualizovat / Mazat). |
| Tabulka | `table_name` | Tabulka s monospaced písmy, nebo pomlčka. |
| ID záznamu | `record_id` | Monospaced, zkráceno na 12 znaků. |
| ID uživatele | `user_id` | Monospaced, zkráceno na 12 znaků - subjekty, který změnu provedl. |

Klasifikátor akcí je tolerantní: odpovídá jak surovým SQL slovesům (`INSERT`/`UPDATE`/`DELETE`), tak slovesům na úrovni aplikace (`create`/`update`/`delete`).

## Prázdný stav a paginace

Když se nic nenachází, zobrazí se centrový řádek „Žádné logy“.
Odkazy Předchozí / Další a indikátor „Strana X z Y (Celkem N)“ se objeví, když je více než jedna stránka, a zachovají se filtry tabulky.

## Data a úložiště (cloud)

- **Tabulka:** `audit_logs` (`created_at`, `action`, `table_name`, `record_id`, `user_id`, `party_id`).
- **Služba:** `fetchAuditLogs` (`auditService`).
- Řádky jsou automaticky zapisovány aplikací/databází při změně záznamů; tato stránka nikdy nezapisuje, pouze čte.
- Omezeno na `ctx.partyId`.

## Související stránky

- [Organizacích](/docs/admin/parties) - úprava nastavení strany vyžaduje stejný bit `MANAGE_AUDIT`
- [Zprávách](/docs/admin/reports) - přepočítání fakturačního období je omezeno bitem `MANAGE_AUDIT`
- [Uživatelé](/docs/admin/users) a [Role](/docs/admin/roles) - změny role a členství jsou mezi akcemi zaznamenanými zde
