---
title: Objednávky
description: Zobrazujte, filtrovejte a splňujte objednávky zákazníků, aktualizujte stav, spravujte zásilky a tiskněte štítky dopravců
---

Sekce Objednávky je místo, kam se po dokončení objednávky dostává každý prodej.
Zde sledujete objednávku po celém jejím životním cyklu, zaznamenáváte platbu a sledování, rezervujete skutečnou zásilku u dopravce a tisknete přepravní štítek.
Objednávky odkazují na stejný katalog spravovaný v [Produkty](/docs/admin/products) a na záznam kupujícího v [Zákazníci](/docs/admin/customers), a zásobují pracovní postup pro vrácení v [Vrácení](/docs/admin/returns).

## Požadované oprávnění

| Bit oprávnění | Název | Kdo ho má výchozí |
|---|---|---|
| 32 | MANAGE_ORDERS | Vlastník, Administrátor, Administrátor e-shopu (s tímto bitem) |

Každá stránka objednávek nejprve volá `requireAdminCtx`.
Pokud nejste přihlášeni, přesměrujete na `/login`.
Pokud nemáte žádnou administrátorskou roli, budete přesměrováni na `/dashboard`.
Pokud váš účet nemá aktivní organizaci, přesměrujete na `/admin/parties/new` (vlastník) nebo `/admin/setup` (všichni ostatní).
Pokud vám chybí bit MANAGE_ORDERS, budete přesměrováni na `/admin`.
Tento stejný bit také omezuje přístup k [Vrácení](/docs/admin/returns) a k KPI příjmů na [Nástěnce](/docs/admin/dashboard).

## Seznam objednávek (`/admin/orders`)

Seznam zobrazuje 20 nejnovějších objednávek na stránku pro aktivní organizaci, nejnovější jako první.

### Lišty stavů

Řádek lišt filtrovuje seznam podle stavu objednávky.
Aktivní lišta je podtržena akcentní barvou.

| Lišta | Hodnota filtru |
|---|---|
| Všechny | (žádný filtr) |
| Očekává | `pending` |
| Potvrzeno | `confirmed` |
| V zpracování | `processing` |
| Odesláno | `shipped` |
| Dodáno | `delivered` |
| Zrušeno | `cancelled` |

Objednávky ve stavu `refunded` nejsou přiděleny lištu, ale stále se zobrazují se svým vlastním odznakem, pokud je přítomen.

### Sloupce

| Sloupec | Popis |
|---|---|
| Číslo | `order_number` (tučné), např. čitelné odkazní číslo objednávky |
| Stav | Stavový odznak s barevnou kódováním (viz tabulka odznaků níže) |
| Platba | Odznak: zelený (`badge-active`), když je `payment_status` `paid`, jinak neutrální odznak `badge-draft` ukazující `unpaid` |
| Zásilka | Dopravce + odznak stavu zásilky, např. `PPL · created`; přidává ` · TEST`, když je zásilka simulovaná; zobrazuje číslo sledování pod ním, když je přítomno; mezera, když neexistuje řádek zásilky |
| Celkem | `total_amount` formátovaný v měně objednávky |
| Datum | `created_at` jako krátké lokální datum |
| Akce | Odkaz na detail plus kontextové tlačítka pro zásilku (viz níže) |

### Barvy odznaků stavu

| Stav | Styl odznaku |
|---|---|
| pending | `badge-pending` (hnědá) |
| confirmed | `badge-active` (zelená) |
| processing | `badge-draft` (šedá/modrá) |
| shipped | `badge-active` (zelená) |
| delivered | `badge-active` (zelená) |
| cancelled | `badge-error` (červená) |
| refunded | `badge-inactive` (ztlumená) |

### Tlačítka akce řádku

Sloupec Akce zobrazuje odkaz na detail a až čtyři tlačítka pro zásilku v závislosti na aktuálním stavu zásilky.
Tato tlačítka odesílají POST na stejnou stránku seznamu.

| Tlačítko | Zobrazuje se, když | Hodnota akce | Efekt |
|---|---|---|---|
| Detail | Vždy | - | Otevře stránku detailu objednávky |
| Vytvořit zásilku | Stav zásilky je `pending` | `create_shipment` | Rezervuje zásilku u dopravce |
| Opakovat | Stav zásilky je `failed` | `create_shipment` | Opakuje rezervaci |
| Obnovit | Existuje `provider_shipment_id` | `refresh_shipment` | Dotazuje dopravce na nejnovější stav |
| Zrušit | Existuje `provider_shipment_id` a stav není `in_transit`, `delivered`, `returned` nebo `cancelled` | `cancel_shipment` | Zrušuje zásilku u dopravce |
| Předzoh štítku | Existuje `label_storage_path` | - | Otevře [předzoh štítku](/docs/admin/orders) v nové záložce |

Každý POST zásilky nejprve znovu ověří, že objednávka patří do vaší aktivní organizace (`orders.party_id = partyId`), než se spustí, protože tyto akce používají admin klienta service-role a obcházejí bezpečnost na úrovni řádků.

### Prázdný stav a paginace

Když žádné objednávky neodpovídají filtru, centrováná zpráva "žádné objednávky" pokrývá tabulku.
Když existuje více než jedna stránka, pod tabulkou se objeví odkazy Předchozí / Další a počítadlo "Stránka X z Y (Celkem N)".

## Detail objednávky (`/admin/orders/{id}`)

Stránka detailu je dvoukolumnový rozložení: položky a sledování na levé straně, karty stavu/zákazníka/dopravy/zásilky/vrácení na pravé straně.
Odkaz zpět vrací na seznam.
Jakýkoli chybový stav akce je zobrazen v červeném upozornění na horní straně.

### Položky a celky

Tabulka Položky uvádí každý řádek `order_items`.

| Sloupec | Zdrojový sloupec |
|---|---|
| Produkt | `title` |
| SKU | `sku` (mezera, když je null) |
| Množství | `quantity` |
| Jednotka | `unit_price`, formátované |
| Celkem | `total_price`, formátované |

Pod tabulkou blok celků zobrazuje Podcelkem (`subtotal`), Slevu (zobrazenou jako záporné číslo `discount_amount`), Daň (`tax_amount`), Dopravu (`shipping_amount`) a tučný Celkový součet (`total_amount`).

### Číslo sledování

Jednofázový formulář vám umožňuje nastavit nebo nahradit ruční `tracking_number` na objednávce.
Toto je nezávislé na čísle sledování zásilky dopravce a je to volný textový pole.
Odeslání odesílá `action=tracking`.

### Karta stavu a pracovní postup

Karta stavu zobrazuje aktuální odznak stavu, stav a způsob platby (`Card`/`Stripe` nebo `COD`) a poplatek za COD (`payment_fee`), když je větší než nula.
Když objednávka může stále postupovat, objeví se rozbalovací menu "Přesunout na" a volitelné pole pro poznámku.
Rozbalovací menu nabízí pouze stavy povolené postupem pouze dopředu:

| Aktuální stav | Povolené následující stavy |
|---|---|
| pending | confirmed, cancelled |
| confirmed | processing, cancelled |
| processing | shipped, cancelled |
| shipped | delivered |
| delivered | (žádné) |
| cancelled | (žádné) |
| refunded | (žádné) |

Odeslání odesílá `action=status` a volá `updateOrderStatus`, který aktualizuje `orders.status` a přidá řádek do `order_status_history` s zaznamenanými `from_status`, `to_status`, `changed_by` (vaše uživatelské ID) a volitelnou poznámkou.

### Karta zákazníka

Když objednávka má propojeného zákazníka, tato karta zobrazuje jméno, e-mail a telefon, plus tlačítko "Zobrazit zákazníka" odkazující na [`/admin/customers/{id}`](/docs/admin/customers).

### Karta doručovací adresy

Zobrazuje doručovací adresu (`line1`, volitelná `line2`, `city`, `postal_code`, `country_code`) z propojeného řádku `addresses`.

### Karta zásilky

Přítomna pouze tehdy, když existuje řádek `order_shipments`.
Odznak "Testový režim" se objeví v záhlaví, když je zásilka `is_mock`.

| Pole | Zdrojový sloupec |
|---|---|
| Poskytovatel | `provider` (v velkých písmech, např. PPL / PACKETA) |
| Stav | `status` |
| Sledování | `tracking_number` |
| Kód zásilky | `consignment_code` (s řádkem tipu) |
| Místo vyzvednutí | `pickup_point_name` a `pickup_point_address` |
| Chyba | `error_message` zobrazená červeně, když je nastavená |

Karta obsahuje stejná tlačítka akce jako řádek v seznamu: Předzoh štítku, Vytvořit/Opakovat, Obnovit a Zrušit.
Poznámka "zásilka zrušena" se objeví, když je stav `cancelled`.

### Karta vrácené zásilky

Přítomna, když směrná zásilka má `provider_shipment_id`.
Pokud byla vrácená zásilka již rezervována, zobrazuje číslo sledování vrácení (`return_tracking_number`), heslo pro odevzdání (`return_password`, pouze Packeta) a tlačítko Předzoh štítku odkazující na vrácený štítek (`/admin/orders/{id}/label?type=return`).
Pokud ještě neexistuje vrácená zásilka, tlačítko "Vytvořit vrácenou zásilku" odesílá `action=create_return_shipment` a rezervuje zásilku v opačném směru, směřující od zákazníka k prodávajícímu.

### Jaké dopravce

Zásilky jsou rezervovány prostřednictvím nakonfigurovaného dopravce uloženého v poli `provider` zásilky.
Podporované poskytovatelé jsou PPL a Packeta, každý podporuje doručení na adresu a doručení do pobočky/krabice.
Adresy odesílatele a údaje dopravce pocházejí z tabulky `shipping_provider_configs`, spravované v [Nastavení dopravy](/docs/admin/settings-shipping).
Oba dopravci fungují pouze na principu dotazování (poll-only), takže stav zásilky se posouvá pouze tehdy, když stisknete Obnovit (nebo se spustí pozadní cron dotazovač) - neexistují webhooks dopravců.

## Předzoh přepravního štítku (`/admin/orders/{id}/label`)

Tato stránka vkládá vygenerovaný štítek dopravce do iframeu plné výšky.
Znovu ověří, že objednávka patří do vaší organizace, poté načte PDF přes API trasu `/api/shipping-label/{orderId}` (pro vrácený štítek přidejte `?type=return`).
Záhlaví zobrazuje číslo objednávky a odkaz zpět na objednávku.

PDF štítku se nachází v soukromém úložišti `shipping-labels` na adrese `{party_id}/{orderId}/label.pdf` (nebo `return-label.pdf`).
To úložiště nemá veřejnou politiku čtení: API trasa generuje 60sekundový podepsaný URL pouze po ověření přístupu personálu prostřednictvím bezpečnostní kontroly na úrovni řádků MANAGE_ORDERS (nebo vlastního zákazníka).

## Data a úložiště (cloud)

- `orders` - hlavička objednávky: `order_number`, `status`, `payment_status`, `payment_method`, `payment_fee`, `subtotal`, `discount_amount`, `tax_amount`, `shipping_amount`, `total_amount`, `currency`, `tracking_number`, `customer_id`, `shipping_address_id`, `party_id`, `created_at`, `paid_at`, `shipped_at`, `delivered_at`.
- `order_items` - jeden řádek na položku: `title`, `sku`, `quantity`, `unit_price`, `total_price`, `discount_amount`, `tax_amount`, `product_id`, `variant_id`.
- `order_status_history` - pouze přidávací protokol změn stavu: `from_status`, `to_status`, `changed_by`, `note`.
- `order_shipments` - rezervace u dopravce: `provider`, `status`, `provider_shipment_id`, `tracking_number`, `consignment_code`, `label_storage_path`, `pickup_point_*`, `is_mock`, `weight_kg`, `error_message` a sloupce `return_*` pro zásilky v opačném směru.
- `customers`, `addresses` - spojeny pro karty zákazníka a doručovací adresy.
- `shipping_provider_configs` - údaje dopravce a adresa odesílatele, čtené při rezervaci zásilky.
- Soukromé úložiště `shipping-labels` - PDF štítků, poskytované prostřednictvím podepsaných URL tras `/api/shipping-label/{orderId}`.
- Akce zásilky se provádějí prostřednictvím admin klienta service-role (`createAdminClient`) v `website/src/lib/shipmentActions.ts`.

## Související stránky

- [Vrácení](/docs/admin/returns) - RMA a vrácení peněz pro dodané objednávky (stejný bit MANAGE_ORDERS)
- [Zákazníci](/docs/admin/customers) - záznam kupujícího a jeho kompletní historie objednávek
- [Produkty](/docs/admin/products) - katalog, na který se odkazují položky objednávky
- [Skladové zásoby](/docs/admin/inventory) - zásoby se snižují při objednání a obnovují se při zrušení
- [Nastavení dopravy](/docs/admin/settings-shipping) - údaje dopravce a adresa odesílatele používané k rezervaci štítků
- [Nástěnka](/docs/admin/dashboard) - KPI příjmů a nedávných objednávek odvozené z objednávek
