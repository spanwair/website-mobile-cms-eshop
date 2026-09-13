---
title: Doprava
description: Konfigurace dopravců pro celou platformu, dostupná pouze pro vlastníka, včetně adresy odesílatele a cenotvorby.
---

Stránka Doprava konfiguruje dopravce (PPL a Packeta) používané napříč platformou.
Na rozdíl od ostatních stránek nastavení je tato **pro celou platformu, nikoli pro jednotlivou organizaci**, a její výstup řídí generování dopravních štítků na [Objednávkách](/docs/admin/orders).

## Požadovaná oprávnění

Tato stránka je **dostupná pouze pro vlastníka**.
Je ohraničena přímo pomocí `ctx.isOwner` (stejný předpoklad jako vytváření nebo uzavírání organizace), **ne** pomocí bitu `MANAGE_SETTINGS` pro jednotlivou stranu - protože údaje o dopravci a identita odesílatele jsou na úrovni platformy, nikoli něco, co by měl měnit administrátor jedné organizace.
Jakýkoli uživatel, který není vlastník, je přesměrován na `/admin`.

## Karty dopravců (`/admin/settings/shipping`)

Stránka vykreslí jednu kartu pro každého dopravce vráceného funkcí `fetchAllShippingConfigs` (PPL a Packeta), každá je samostatný formulář.

### Oznámení o režimu simulace

Pokud chybí API údaje dopravce v prostředí, karta zobrazí **oznámení o simulaci**.
PPL je v režimu simulace, pokud nejsou nastaveny obě proměnné `PPL_CLIENT_ID` a `PPL_CLIENT_SECRET`; Packeta je v režimu simulace, pokud není nastaveno `PACKETA_API_PASSWORD`.
V režimu simulace je vytváření štítků simulováno namísto rezervace u skutečného dopravce.

### Pole pro dopravce

| Pole | Sloupec | Poznámky |
|---|---|---|
| Aktivováno | `shipping_configs.enabled` | Čeť uživatelé tento dopravce v pokladně. |
| Základní cena | `shipping_configs.base_price` | Výchozí poplatek za dopravu. |
| Zdarma nad částkou | `shipping_configs.free_above_amount` | Celková hodnota objednávky, nad kterou je doprava zdarma; prázdné znamená nikdy zdarma. |
| Jméno odesílatele | `shipping_configs.sender_name` | Požadováno - jméno pro vyzvednutí/vrácení na štítku. |
| Ulice odesílatele | `shipping_configs.sender_street` | Požadováno. |
| Město odesílatele | `shipping_configs.sender_city` | Požadováno. |
| PSČ odesílatele | `shipping_configs.sender_postal_code` | Požadováno. |
| Kód země odesílatele | `shipping_configs.sender_country_code` | Dvě písmena, výchozí je `CZ`. |
| Telefon odesílatele | `shipping_configs.sender_phone` | Volitelné. |
| E-mail odesílatele | `shipping_configs.sender_email` | Volitelné. |

Každá karta se ukládá nezávisle pomocí `updateShippingConfig`, klíčovaná kódem dopravce.

## Data a úložiště (cloud)

- **Tabulka:** `shipping_configs` (jedna řádek pro každého dopravce: `code`, `display_name`, `enabled`, `base_price`, `free_above_amount`, `sender_*`).
- **Služby:** `fetchAllShippingConfigs`, `updateShippingConfig` (`shippingConfigService`).
- **Prostředí:** `PPL_CLIENT_ID`, `PPL_CLIENT_SECRET`, `PACKETA_API_PASSWORD` určují skutečnou nebo simulovanou rezervaci.
- **Komponenta:** `CmsLayout` s předaným `isOwner`.

## Související stránky

- [Objednávky](/docs/admin/orders) - dopravní štítek na objednávce je vygenerován pomocí této konfigurace dopravce a odesílatele
- [Odznaky](/docs/admin/settings-badges) - dopravní odznaky, které tyto dopravce reklamují v obchodě
- [Organizace](/docs/admin/parties) - dostupná pouze pro vlastníka, ostatní ovládací prvky na úrovni platformy, které existují mimo oprávnění jednotlivých stran
