---
title: Newsletter
description: Přepínání registrace newsletteru v patičce, správa předplatitelů a export seznamu předplatitelů do CSV
---

Stránka Newsletter kontroluje, kde se registrace newsletteru zobrazuje v vašem obchodě, a spravuje osoby, které se předplatily.
Je to jedna záložka v sadě [Nastavení obchodu](/docs/admin/settings-branding).

## Požadované oprávnění

| Bit oprávnění | Název | Kdo ho má výchozí |
|---|---|---|
| 1024 | MANAGE_SETTINGS | Vlastník, Administrátor, Administrátor obchodu (s tímto bitem) |

Bez `MANAGE_SETTINGS` vás systém přesměruje na `/admin`.

## Viditelnost (`/admin/settings/newsletter`)

Horní karta přepíná **zapnutý newsletter v patičce** (`store_configs.footer_newsletter_enabled`), který zobrazuje nebo skryje box pro registraci v patičce obchodu.
Karta také odkazuje na [Rozložení domovské stránky](/docs/admin/settings-layout), kde se samostatná sekce `newsletter` na domovské stránce zapíná nebo vypíná - tyto dva umístění jsou nezávislá.
Uložení zapisuje přes `updateStoreConfig`.

## Předplatitelé

Pod přepínačem se zobrazuje řádek se statistikami:

- **Aktivní předplatitelé** - `countNewsletterSubscribers` (aktuálně předplatitelé).
- **Celkový počet registrací** - každý záznam kdy, včetně odhlášených.
- Tlačítko **Exportovat do CSV**.

### Tabulka předplatitelů

| Sloupec | Popis |
|---|---|
| E-mail | E-mail předplatitele, v tučném písmu. |
| Předplatil dne | Datum registrace. |
| Stav | Zelené "Předplatil" nebo žluté "Odhlášen" (odvozeno z `unsubscribed_at`). |
| Akce | Přepínač **Odhlásit** / **Přehlášit** a **Smazat** (s `confirm()`). |

Odhlášení/přehlášení přepíná `newsletter_subscribers.unsubscribed_at`; smazání odstraní řádek zcela.
Prázdný seznam zobrazuje centrový řádek "žádní předplatitelé".

### Export do CSV (`/admin/settings/newsletter/export.csv`)

Vrací `newsletter-subscribers.csv` se sloupci `email`, `subscribed_at`, `status` (`subscribed` / `unsubscribed`), jeden řádek na předplatitele.
Hodnoty jsou CSV-escapované.
Chráněno stejným bitem `MANAGE_SETTINGS` (jinak 403), omezeno na aktivní organizaci.

## Data a úložiště (cloud)

- **Tabulky:** `newsletter_subscribers` (`party_id`, `email`, `subscribed_at`, `unsubscribed_at`), `store_configs` (`footer_newsletter_enabled`).
- **Služby:** `fetchNewsletterSubscribers`, `countNewsletterSubscribers`, `setNewsletterSubscriberStatus`, `deleteNewsletterSubscriber` (`newsletterService`); `fetchStoreConfig`, `updateStoreConfig` (`storeConfigService`).
- **Komponenta:** `SettingsTabs`.
- Omezeno na `ctx.partyId`.

## Související stránky

- [Rozložení domovské stránky](/docs/admin/settings-layout) - přepíná sekci `newsletter` na domovské stránce (oddělenou od boxu v patičce)
- [Patička](/docs/admin/settings-footer) - oblast patičky, kde se vykresluje box pro registraci
