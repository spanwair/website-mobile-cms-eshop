---
title: Vrácení
description: Správa autorizací na vrácení zboží (RMA), záznam řešení, vrácení peněz a doplnění zásob
---

Sekce Vrácení spravuje autorizace na vrácení zboží (RMA) podaných vůči minulým [Objednávkám](/docs/admin/orders).
Každé vrácení je propojeno s jeho objednávkou a se [Zákazníkem](/docs/admin/customers), který ho podal, a určuje řešení: vrácení peněz, výměna nebo kredit do obchodu.
Vrácení sdílí stejná oprávnění jako objednávky, takže kdekoli, kdo může splňovat objednávky, může také zpracovávat vrácení.

## Požadované oprávnění

| Bit oprávnění | Název | Kdo ho má výchozí |
|---|---|---|
| 32 | MANAGE_ORDERS | Vlastník, Administrátor, Administrátor Eshopu (s tímto bitem) |

Obě stránky vrácení volají `requireAdminCtx`.
Neověřený uživatel je přesměrován na `/login`.
Uživatel bez role administrátor je přesměrován na `/dashboard`.
Uživatel bez aktivní organizace je přesměrován na `/admin/parties/new` (vlastník) nebo `/admin/setup`.
Chybějící bit MANAGE_ORDERS přesměruje na `/admin`.

## Seznam vrácení (`/admin/returns`)

Hlavička stránky zobrazuje název a počet odpovídajících vrácení.
Seznam zobrazuje 20 vrácení na stránku pro aktivní organizaci, nejnovější nejdříve.

### Záložky stavu

Zaoblené pilulkové záložky filtrují podle stavu.
Aktivní pilulka je vyplněna primární barvou.

| Záložka | Hodnota filtru |
|---|---|
| Všechny | (žádný filtr) |
| Očekává | `pending` |
| Schváleno | `approved` |
| Obdrženo | `received` |
| Zpracování | `processing` |
| Dokončeno | `completed` |
| Zamítnuto | `rejected` |
| Zrušeno | `cancelled` |

### Sloupce

| Sloupec | Popis |
|---|---|
| RMA | `return_number` zobrazený jako monospace kód |
| Objednávka | Odkaz na zdrojovou objednávku; zobrazuje číslo objednávky nebo prvních 8 znaků `order_id`, pokud číslo objednávky chybí |
| Zákazník | Odkaz na zákazníka; zobrazuje jméno a příjmení, nebo pomlčku |
| Důvod | Čitelné označení důvodu (viz důvody níže) |
| Stav | Odznak stavu s barevnou kódováním |
| Vrácení peněz | `refund_amount` formátované, nebo pomlčka, pokud není nastaveno |
| Vytvořeno | `created_at` krátký místní datum |
| Akce | Odkaz na podrobnosti RMA |

### Barvy odznaků stavu

| Stav | Styl odznaku |
|---|---|
| pending | `badge-pending` (hnědá) |
| approved | `badge-draft` |
| received | `badge-draft` |
| processing | `badge-draft` |
| completed | `badge-active` (zelená) |
| rejected | `badge-error` (červená) |
| cancelled | `badge-inactive` (ztlumený) |

### Důvody vrácení

Důvod zákazníka je uložen jako kód a zobrazen s přátelským označením.

| Kód důvodu | Označení |
|---|---|
| wrong_item | Nesprávný předmět |
| damaged | Poškozený |
| defective | Defektní |
| not_as_described | Neobsahuje popis |
| changed_mind | Změnil si názor |
| quality_issue | Problém s kvalitou |
| size_issue | Problém s velikostí |
| other | Jiné |

### Prázdný stav a paginace

Když se nic nenachází, karta zobrazuje zprávu "žádná vrácení".
Když existuje více než jedna stránka, objevují se odkazy Předchozí / Další a počítadlo "Stránka X / Y".

## Podrobnosti vrácení (`/admin/returns/{id}`)

Lišta nástrojů zobrazuje tlačítko zpět, číslo RMA a aktuální odznak stavu.
Tělo je dvoukolumnový rozvrh: čtenelné podrobnosti vlevo, editovatelné formulář řešení vpravo, s volitelnou tabulkou vrácených položek níže.

### Karta podrobností (pouze pro čtení)

| Pole | Zdrojová sloupec |
|---|---|
| Objednávka | Odkaz na `/admin/orders/{order_id}` (prvních 8 znaků ID zobrazeno jako popis) |
| Důvod | `reason` (přátelské označení) |
| Poznámky zákazníka | `customer_notes`, nebo pomlčka |
| Vytvořeno | `created_at`, kompletní místní datum a čas |
| Obdrženo | `received_at`, zobrazeno pouze pokud je nastaveno |
| Dokončeno | `completed_at`, zobrazeno pouze pokud je nastaveno |

### Formulář řešení (workflow RMA)

Tento formulář slouží k průchodu vrácením jeho životním cyklem a k záznamu vrácení peněz.
Odeslání uloží všechna pole najednou pomocí `updateReturnStatus`.

| Pole | Ovládací prvek | Možnosti / poznámky |
|---|---|---|
| Stav | Výběr | pending, approved, rejected, received, processing, completed, cancelled |
| Řešení | Výběr | (nenastaveno), vrácení peněz, výměna, kredit do obchodu |
| Částka vrácení peněz | Číslo (krok 0.01) | Uloženo v `refund_amount` |
| Metoda vrácení peněz | Výběr | (nenastaveno), original_payment, store_credit, bank_transfer |
| Poznámky | Textové pole | Interní poznámky zaměstnanců, uloženo v `notes` |

Při uložení se automaticky aplikují dva vedlejší účinky na základě zvoleného stavu:

- Nastavení stavu na `received` časově razítko `received_at` aktuálním časem.
- Nastavení stavu na `completed` časově razítko `completed_at` aktuálním časem.
- Jakákoli změna stavu také zaznamená `processed_by` jako váš uživatelský ID.

### Správa vrácení peněz

Z této stránky neprobíhá automatický pohyb peněz.
Vrácení peněz je zaznamenáno na vrácení (`refund_amount` + `refund_method`) jako rozhodnutí a účetní záznam pro prodejce.
Volba `original_payment` znamená, že vrácíte peníze přes původní kartu/účtování Stripe, `store_credit` zúčtuje zákazníkovi účet a `bank_transfer` je manuální mimořádný převod.
Skutečné výplaty musí být provedeny u vašeho poskytovatele plateb nebo banky; tato stránka sleduje, co bylo dohodnuto, a označuje RMA jako dokončené.

Fyzický štítek pro vrácení balíku je vytvořen z samotné objednávky, ne zde: použijte kartu pro vrácení dopravy na [stránce podrobností objednávky](/docs/admin/orders) k rezervaci zpětné dopravy.

### Tabulka vrácených položek

Zobrazeno, když RMA má řádky `return_items`.

| Sloupec | Zdroj |
|---|---|
| Položka | `order_item.title` |
| SKU | `order_item.sku` |
| Počet objednaný | `order_item.quantity` |
| Počet vrácený | `return_items.quantity` |
| Stav | `return_items.condition` |
| Doplnění zásob | zaškrtnutí, když je `return_items.restock` pravdivé, jinak pomlčka |

Označení `restock` zaznamenává, zda by vrácená jednotka měla být opět přidána do prodejného skladu.
Vyrovnejte skutečné úrovně zásob v [Skladové zásoby](/docs/admin/inventory) po zpracování.

## Data a úložiště (cloud)

- `return_requests` - hlavička RMA: `return_number`, `status`, `reason`, `resolution`, `refund_amount`, `refund_method`, `notes`, `customer_notes`, `processed_by`, `received_at`, `completed_at`, `order_id`, `customer_id`, `party_id`, `created_at`.
- `return_items` - jeden řádek na vrácenou položku: `quantity`, `condition`, `restock`, `order_item_id`, `return_request_id`.
- Pro zobrazení spojeno: `orders` (`order_number`), `customers` (`first_name`, `last_name`, `email`) a `order_items` (`title`, `sku`, `quantity`, `unit_price`).
- Data zpětné dopravy (sledování vrácení, heslo pro předání, štítek pro vrácení) jsou uložena v řádku `order_shipments` objednávky v sloupcích `return_*`, rezervovaná ze stránky podrobností objednávky.

## Související stránky

- [Objednávky](/docs/admin/orders) - zdrojová objednávka a místo, kde rezervujete fyzickou vrácenou dopravu/štítek
- [Zákazníci](/docs/admin/customers) - zákazník, který vrácení podal, a jeho historie
- [Skladové zásoby](/docs/admin/inventory) - doplnění zásob vrácených jednotek označených kontrolou doplnění zásob
- [Produkty](/docs/admin/products) - katalogové položky, které jsou vráceny
