---
title: Systém oprávnění
description: Jak fungují bity oprávnění a které oprávnění ovládají které administrátorské stránky.
---

CMS používá **systém oprávnění pomocí bitmasky**. Každé oprávnění je celé číslo mocniny 2. Efektivní oprávnění uživatele jsou uložena jako jedno číslo - součet (bitwise OR) všech oprávnění, která drží.

## Jak fungují bitmasky

Každé oprávnění je unikátní bit:

```
MANAGE_PRODUCTS   = 8    (binary: 0000 0000 0000 1000)
MANAGE_CATEGORIES = 16   (binary: 0000 0000 0001 0000)
```

Aby byly uděleny obě, uložíte `8 | 16 = 24`. Pro ověření, zda uživatel má `MANAGE_PRODUCTS`, systém vyhodnotí `userBitmask & 8 !== 0`. To znamená, že oprávnění lze volně kombinovat - můžete udělit jakoukoli kombinaci bez konfliktů.

## Všechna oprávnění

| Oprávnění | Bit | Co ovládá | Administrátorské stránky |
|---|---|---|---|
| `VIEW_DASHBOARD` | 1 | Přístup k administrátorskému panelu všude | `/admin` |
| `MANAGE_USERS` | 2 | Zobrazení a změna rolí uživatelů; správa členů organizace | `/admin/users`, `/admin/parties` |
| `MANAGE_ROLES` | 4 | Vytváření a mazání vlastních rolí; přidělování oprávnění | `/admin/roles` |
| `MANAGE_PRODUCTS` | 8 | Vytváření, úprava, mazání produktů; nahrávání obrázků/videí; moderování recenzí | `/admin/products`, `/admin/reviews` |
| `MANAGE_CATEGORIES` | 16 | Vytváření, úprava, mazání kategorií produktů (včetně hierarchie) | `/admin/categories` |
| `MANAGE_ORDERS` | 32 | Zobrazení objednávek, aktualizace stavu objednávky, správa vrácení a RMA | `/admin/orders`, `/admin/returns` |
| `MANAGE_INVENTORY` | 64 | Nastavení úrovně zásob, záznam pohybu zásob | `/admin/inventory` |
| `MANAGE_PRICING` | 128 | Správa ceníků, pravidel slev a kupónů | `/admin/pricing` |
| `MANAGE_CUSTOMERS` | 256 | Zobrazení a úprava záznamů a adres zákazníků | `/admin/customers` |
| `MANAGE_REPORTS` | 512 | Zobrazení obchodních zpráv (tržby, objednávky, produkty) | `/admin/reports` |
| `MANAGE_AUDIT` | 4096 | Zobrazení protokolu auditu; úprava detailů organizace | `/admin/audit`, `/admin/parties/{id}` |

`ALL_PERMISSIONS = 65535` (`0xffff`) uděluje všechny aktuální i budoucí bity oprávnění.

## Kontrola oprávnění v kódu

```typescript
import { hasPermission, PERMISSIONS } from "@shared/constants/permissions";

if (hasPermission(userPermissions, PERMISSIONS.MANAGE_PRODUCTS)) {
  // show product management UI
}
```

## Výchozí oprávnění podle role

| Role | Hodnota | Výchozí oprávnění |
|---|---|---|
| **Vlastník** | 8 | `ALL_PERMISSIONS` (65535) + obchází všechny omezení organizace |
| **Administrátor** | 4 | `ALL_PERMISSIONS` (65535), omezeno na organizaci pro změny katalogu |
| **Administrátor obchodu** | 2 | Určeno jejich **vlastní rolí** v konkrétní organizaci - žádné globální výchozí nastavení |
| **Uživatel** | 1 | Pouze `VIEW_DASHBOARD` (1) - přesměrován, pokud se dostane na administrátorskou stránku |

> **Poznámka pro administrátory obchodu:** Jejich oprávnění nejsou globální. Získávají bitmasku vlastní role, která jim byla přidělena při pozvání do organizace. Administrátor obchodu v organizaci A může mít zcela odlišná oprávnění než stejný uživatel v organizaci B.

## Role Super administrátora systému

Každá organizace automaticky získá systémovou **role Super administrátora** s `ALL_PERMISSIONS` (65535). Nemůže být upravena ani smazána. Přiřaďte ji důvěryhodnému členovi organizace, abyste mu dali plnou kontrolu v rámci této organizace.

## Viditelnost bočního panelu

Administrátorský boční panel automaticky zobrazuje nebo skrývá sekce na základě aktuálních oprávnění uživatele. Pokud není `MANAGE_PRODUCTS` v vaší bitmaske, odkaz na Produkty je skrytý - není jen šedý, ale zcela chybí.

## Vytváření vlastních sad oprávnění

Vlastní role vám umožňují přesně definovat, jaká oprávnění obdrží administrátor obchodu:

1. Přejděte na **[Administrátor → Role](/docs/admin/roles)**
2. Klikněte na **Novou roli**
3. Dejte jí jméno (např. "Manažer objednávek") a volitelný popis
4. Zaškrtněte oprávnění, která tato role by měla mít
5. Uložte - role je nyní vybránelná při přidávání členů na **[Administrátor → Organizace](/docs/admin/parties)**

**Příklad:** Role "Vyplňovač objednávek" s pouze `MANAGE_ORDERS` (32) + `MANAGE_INVENTORY` (64) ukládá bitmasku `96`. Ten uživatel může zpracovávat objednávky a upravovat zásoby, ale nemůže dotýkat produktů, cen ani zákazníků.

## Související

- [Hierarchie rolí](/docs/users/roles) - jak se Vlastník, Administrátor, Administrátor obchodu a Uživatel vzájemně vztahují
- [Role (administrátorská stránka)](/docs/admin/roles) - vytváření a správa vlastních rolí
- [Uživatelé (administrátorská stránka)](/docs/admin/users) - přidělování rolí uživatelům v vaší organizaci
