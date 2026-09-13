---
title: Skladové zásoby
description: Sledujte zásoby pro každou variantu produktu, nastavte limity nízkých a maximálních zásob a zaznamenávejte pohyby zásob
---

Skladové zásoby sledují úrovně zásob pro každý prodejný předmět.
Protože je [produkt](/docs/admin/products) vždy skupinou variant, pro každou variantu existuje přesně jeden řádek skladových zásob (`inventory_items`), a štítek zásob v obchodě, který zákazník vidí, je odvozen z těchto čísel, nikdy není ručně zadán.
Můžete upravit stejná čísla uvnitř editoru produktu, ale tato stránka vám poskytuje celý katalog najednou.

## Vyžadováno oprávnění

| Permission bit | Name | Kdo ho má výchozí |
|---|---|---|
| 64 | MANAGE_INVENTORY | Vlastník, Administrátor, Eshop Administrátor (s tímto bitem) |

Bez `MANAGE_INVENTORY` vás systém přesměruje na `/admin`.
Eshop administrátor bez organizace je poslán na `/admin/setup` (vlastník: `/admin/parties/new`).

## Seznam skladových zásob (`/admin/inventory`)

Řádky jsou paginované po 30 a lze je zúžit pomocí tří filtrovacích záložek, každá zobrazuje aktuální počet:

| Tab | Zobrazuje |
|---|---|
| Všechny | Každý sledovaný předmět (`inventoryResult.total`). |
| Nízké zásoby | Předměty, kde `qty_on_hand <= low_stock_threshold` a stále nad nulou. |
| Vyprodáno | Předměty, kde `qty_on_hand <= 0`. |

### Sloupce

| Sloupec | Popis |
|---|---|
| Produkt | Název, odkazující na `/admin/products/{id}`. Pokud chybí název, použije se zkrácený ID. |
| Varianta | Název varianty, nebo pomlčka pro produkty s jednou variantou. |
| Na skladě | `qty_on_hand`. Změní se na červenou, když je předmět na nebo pod jeho limitem nízkých zásob. |
| Rezervováno | `qty_reserved` - jednotky držené otevřenými objednávkami/košíky. |
| Dostupné | `qty_available` - prodejná hodnota (na skladě minus rezervováno). |
| Limity | Skládané limity Min (nízké zásoby) a Max; červený odznak "Nízké zásoby" se objeví při překročení. |
| Aktualizovat limity | Inline formulář (viz níže). |
| Upravit | Inline formulář pro pohyb zásob (viz níže). |

### Formulář pro aktualizaci limitů

Dva numerické vstupy (Min / Max) plus **Použít**.
Odesílá `action=update_thresholds` a volá `updateThresholds`.
Hodnota `0` nebo prázdná hodnota je uložena jako `null` (což znamená "žádný limit"), takže sloupec Min zobrazuje pomlčku namísto nuly.

- **Min (`low_stock_threshold`)** - bod, kdy se předmět počítá jako nízké zásoby a objeví se červený odznak.
- **Max (`max_threshold`)** - cílová horní hranice, užitečná pro plánování doplňování zásob.

### Formulář pro úpravu zásob

Znakovaná kvantita, typ pohybu, volitelný poznámka, poté **Použít**.
Odesílá na `updateStock`, který zapisuje jak novou `qty_on_hand`, tak řádek v `stock_movements` s časovým razítkem `created_by`.

| Typ pohybu | Znamená |
|---|---|
| adjustment | Korekce |
| purchase | Nákup |
| return | Vrácení |
| damage | Poškození |

Zadejte kladné číslo k přidání jednotek, záporné číslo k jejich odebrání.

### Na objednávku (vždy skladem)

Některé produkty jsou vyráběny na objednávku a nikdy by neměly zobrazovat "vyprodáno" - příkladem jsou kytky z Beskyd's "Na zakázku".
Pro tyto produkty otevřete položku v [editoru produktu](/docs/admin/products) a zaškrtněte **Na objednávku**, což nastaví `inventory_items.track_inventory = false`.
Neposledované položky zobrazí v obchodě odznak "na objednávku" namísto počtu zásob a nejsou filtrovány pro anonymní zákazníky.

## Prázdný stav a paginace

Když žádný řádek neodpovídá aktuální záložce, zobrazí se centrovaný řádek "Žádné zásoby".
Odkazy Předchozí / Další a indikátor "Strana X z Y" se objeví, když je více než jedna stránka; aktivní filtr je zachován napříč stránkami.

## Data a úložiště (cloud)

- **Tabulky:** `inventory_items` (`product_id`, `variant_id`, `variant_name`, `qty_on_hand`, `qty_reserved`, `qty_available`, `low_stock_threshold`, `max_threshold`, `track_inventory`), `stock_movements` (`inventory_item_id`, `party_id`, `quantity`, `type`, `note`, `created_by`).
- **Služby:** `fetchInventory`, `updateStock`, `updateThresholds` (`inventoryService`).
- **Spouštěče:** Řádky skladových zásob jsou automaticky vytvářeny pro každý produkt/variantu (`create_default_inventory_item` / `ensure_variant_inventory_item`).
- Všechny dotazy jsou omezeny na `ctx.partyId`.

## Související stránky

- [Produkty](/docs/admin/products) - stejné ovládací prvky pro úpravu/limity/na objednávku se nacházejí v editoru produktu pro každou variantu
- [Objednávky](/docs/admin/orders) - otevřené objednávky řídí množství Rezervováno; vrácení mohou zde generovat pohyb "vrácení"
- [Vrácení](/docs/admin/returns) - doplňování zásob vráceného předmětu je místo, kde typicky vzniká pohyb "vrácení"
