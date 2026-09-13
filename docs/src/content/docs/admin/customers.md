---
title: Zákazníci
description: Prohlížejte a upravujte záznamy zákazníků, spravujte jejich adresy a prohlížejte historii jejich objednávek
---

Sekce Zákazníci je vaše CRM: každý kupující, který má účet nebo který u vaší organizace umístil objednávku.
Zde upravujete kontaktní údaje, spravujete uložené adresy a vidíte kompletní [historii objednávek](/docs/admin/orders) zákazníka. Zákazníci jsou omezeni na aktivní organizaci, takže vidíte pouze kupující vašeho vlastního obchodu.

## Požadovaná oprávnění

| Bit oprávnění | Název | Kdo ho má výchozíně |
|---|---|---|
| 256 | MANAGE_CUSTOMERS | Vlastník, Administrátor, Administrátor obchodu (s tímto bitem) |

Obě stránky volají `requireAdminCtx`.
Neověřený uživatel je přesměrován na `/login`.
Uživatel bez role administrátora je přesměrován na `/dashboard`.
Uživatel bez aktivní organizace je přesměrován na `/admin/parties/new` (vlastník) nebo `/admin/setup`.
Chybějící bit MANAGE_CUSTOMERS přesměruje na `/admin`.

## Zákazníci vs prodejci (role)

Kupující, který se zaregistruje v obchodě, se stává **zákazníkem**, ne prodejcem.
V vrstvě autentizace mají `profiles.role = 1` (USER) a jejich `profiles.signup_party_id` zaznamenává organizaci, přes kterou se zaregistroval.
Uživatel nemá žádný přístup do administrace a je poslán na `/dashboard`; prodejci jsou `eshop_admin`, `admin` nebo `owner` (role 2/4/8).

Záznam, který upravujete na této stránce, je řádek `customers`, což jsou obchodní údaje pro danou organizaci (jméno, adresy, statistiky objednávek, souhlas GDPR).
Jeho volitelný `user_id` propojuje záznam zákazníka s ověřeným účtem.
Takže zákazník může existovat jako čistý záznam kupujícího (hostitelská pokladna, bez přihlášení) nebo být spojen s zaregistrovaným účtem USER - v obou případech se zde objevuje, omezený pomocí `customers.party_id`.

## Seznam zákazníků (`/admin/customers`)

Na liště je vyhledávací formulář a celkový počet.
Seznam zobrazuje 20 zákazníků na stránku pro aktivní organizaci, nejnovější nejdříve.

### Vyhledávání

Vyhledávací pole (GET formulář) se shoduje podle jména, příjmení nebo e-mailu pomocí necitlivého na velká písmena `ilike` NEBO napříč `first_name`, `last_name` a `email`.
Odeslání pomocí tlačítka vyhledávání; dotaz zůstává v URL.

### Sloupce

| Sloupec | Zdrojový sloupec |
|---|---|
| Jméno | `first_name` + `last_name` (tučné) |
| E-mail | `email` |
| Telefon | `phone` nebo pomlčka |
| Stav | Odznak: zelený `Aktivní`, když je `is_active`, jinak `ztlumený` |
| Přihlášen | `created_at` krátký místní datum |
| Akce | Odkaz na detail zákazníka |

Když žádní zákazníci neodpovídají, v tabulce se zobrazí centrový řádek „žádní zákazníci“. Odkazy Předchozí / Další a počítadlo „Stránka X z Y (Celkem N)“ se zobrazí, když je více než jedna stránka.

## Detail zákazníka (`/admin/customers/{id}`)

Odkaz zpět vrací na seznam a jakákoli chyba při uložení se zobrazí v červeném upozornění.
Rozložení je ve dvou sloupcích: osobní údaje + adresy na levé straně, historie objednávek na pravé straně.

### Osobní údaje (upravitelné)

Tento formulář se odesílá s výchozím `_action` (aktualizace) a ukládá pomocí `updateCustomer`.

| Pole | Požadované | Zdrojový sloupec |
|---|---|---|
| Jméno | Ano | `first_name` |
| Příjmení | Ano | `last_name` |
| E-mail | Ano | `email` |
| Telefon | Ne | `phone` (null, když je prázdné) |
| Poznámky | Ne | `notes` (interní poznámky zaměstnanců) |
| Aktivní | Zaškrtnutí | `is_active` |

Klikněte na Uložit pro uložení.

### Adresy

Hlavička karty adresy zobrazuje počet a když je formulář pro přidání zavřený, zobrazí se tlačítko „Přidat adresu“.
Každá uložená adresa se vykreslí jako karta:

- Odznak ukazující typ adresy: `Shipping` nebo `Billing`.
- Odznak „Výchozí“, když je `is_default` pravdivé.
- Tlačítko Smazat (odesílá `_action=delete_address`, nejprve potvrzuje), které smaže adresu pomocí `deleteAddress`.
- Formátovaný blok adresy: jméno, `line1` (+ `line2`), poté `postal_code city, country_code`.

Když nejsou žádné adresy a formulář je zavřený, zobrazí se zpráva „žádné adresy“.

#### Formulář pro přidání adresy

Otevřený pomocí dotazového parametru `?addAddress=1`.
Odesílá `_action=add_address` a ukládá pomocí `addAddress`.

| Pole | Požadované | Poznámky / sloupec |
|---|---|---|
| Ulice | Ano | mapováno na `line1` |
| Číslo popisné | Ano | mapováno na `line2` |
| PSČ | Ano | `postal_code` |
| Město | Ano | `city` |
| Země | Ne | `country_code`, výchozí CZ, 2 písmena velká |
| Typ adresy | Výběr | `shipping` (výchozí) nebo `billing` |
| Jméno | Ano | předvyplněno jménem zákazníka |
| Příjmení | Ano | předvyplněno příjmením zákazníka |
| Nastavit jako výchozí | Zaškrtnutí | `is_default` |

Uložte pomocí „Uložit adresu“ nebo Stihnout, abyste se vrátili na stránku zákazníka.

### Historie objednávek

Pravý sloupec zobrazuje objednávky zákazníka (až 10 nejnovějších) s celkovým počtem z `order_count`.
Každý řádek odkazuje na detail objednávky.

| Sloupec | Zdroj |
|---|---|
| Číslo objednávky | `order_number`, odkazuje na `/admin/orders/{id}` |
| Stav | Odznak stavu objednávky s barevnou kódováním |
| Celkem | `total_amount`, formátováno v měně objednávky |
| Datum | `created_at` krátký místní datum |

Když zákazník nemá žádné objednávky, místo tabulky se zobrazí zpráva „žádné objednávky“.

## Data a úložiště (cloud)

- `customers` - záznam CRM: `first_name`, `last_name`, `email`, `phone`, `notes`, `is_active`, `customer_group`, `lifetime_value`, `loyalty_points`, `marketing_opt_in`, `gdpr_consent` (+ `gdpr_consent_at`, `gdpr_consent_ip`), `tags`, `preferred_language`, `user_id`, `party_id`, `created_at`. Seznamové/detailní dotazy filtrují podle `party_id`.
- `addresses` - uložené adresy: `type`, `first_name`, `last_name`, `line1`, `line2`, `city`, `postal_code`, `country_code`, `state`, `company`, `is_default`, `customer_id`.
- `orders` - spojeno pro historii objednávek a počítáno pomocí `customer_id`.
- `profiles` - záznam role na straně autentizace (`role`, `signup_party_id`), který rozlišuje USERA (zákazníka) od prodejce; zde není upravován.

## Související stránky

- [Objednávky](/docs/admin/orders) - každá objednávka odkazuje zpět na svého zákazníka a detail zákazníka zobrazuje jeho objednávky
- [Vrácení](/docs/admin/returns) - vrácení jsou přiřazena zákazníkovi
- [Nástěnka](/docs/admin/dashboard) - KPI nových zákazníků jsou odvozeny z této tabulky
- [Produkty](/docs/admin/products) - katalog produktů, které zákazníci kupují
