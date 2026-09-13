---
title: FAQ
description: Spravujte často k položená dotazy se seskupenými podle kontextu a zobrazenými v vašem obchodě
---

Stránka FAQ spravuje otázky a odpovědi zobrazené v vašem obchodě (na stránce obsahu FAQ a podle kontextu i na jiných stránkách).
Nachází se pod záložkou **FAQ** v CMS vedle [Navigace](/docs/admin/cms-navigation), [Stránky](/docs/admin/cms-pages), [Blog](/docs/admin/cms-blog), [Tým](/docs/admin/cms-team) a [Právní stránky](/docs/admin/cms-legal).

## Požadovaná oprávnění

| Permission bit | Name | Kdo ho má výchozí |
|---|---|---|
| 2048 | MANAGE_CMS | Vlastník, Administrátor, Administrátor e-shopu (s tímto bitem) |

Bez `MANAGE_CMS` budete přesměrováni na `/admin`.

## Dispozice stránky (`/admin/cms/faq`)

Jako [Tým](/docs/admin/cms-team) se jedná o jediný editovací formulář nad tabulkou seznamu, bez samostatné cesty pro vytvoření.
**Upravit** znovu načte stránku s `?edit={id}`; **Zrušit** se vrátí do prázdného formuláře pro přidání.

### Formulář pro přidání / úpravu

| Field | Column | Poznámky |
|---|---|---|
| Otázka | `faq_items.question` | Požadováno. |
| Odpověď | `faq_items.answer` | Požadováno (textové pole 3 řádků). |
| Kontext | `faq_items.context` | Klíč pro seskupení, výchozí `general`. Placeholder naznačuje hodnoty jako `general`, `about`, `buyback`. Umožňuje vám zobrazit správné FAQ na správné stránce. |
| Pořadí | `faq_items.sort_order` | Nižší čísla se zobrazí nejprve. |
| Viditelné | `faq_items.is_visible` | Odškrtnutí skryje položku bez jejího smazání. |

Odeslání s skrytým `id` aktualizuje; bez něj vytvoří. Po úspěchu se vrátíte na `/admin/cms/faq`.

### Tabulka seznamu

Sloupce: Otázka, Kontext, Pořadí, Akce (**Upravit** / **Smazat** s `confirm()`).
Prázdný seznam zobrazuje vycentrovaný řádek „žádné FAQ“.

Kytka z Beskyd zahrnuje pět obecných otázek (doba dopravy, vlastní barvy/velikost, pohřební věnce, platba, životnost sušených květin).

## Data a úložiště (cloud)

- **Tabulka:** `faq_items` (`party_id`, `question`, `answer`, `context`, `sort_order`, `is_visible`).
- **Služby:** `fetchFaqItems`, `createFaqItem`, `updateFaqItem`, `deleteFaqItem` (`faqService`).
- **Komponenta:** `CmsTabs`.
- Omezeno na `ctx.partyId`.

## Související stránky

- [Stránky](/docs/admin/cms-pages) - stránka obsahu FAQ (šablona `faq`), která tyto položky vykresluje
- [Tým](/docs/admin/cms-team) - sourodý editor CMS s jediným formulářem se stejným vzorem přidání/úpravy
