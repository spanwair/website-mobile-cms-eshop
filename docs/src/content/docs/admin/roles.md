---
title: Role
description: Vytvářejte a spravujte vlastní sadu oprávnění, které jsou přiděleny administrátorům e-shopu pro každou organizaci
---

Role jsou opakovaně použitelné, pojmenované balíčky bitů oprávnění.
Existují proto, aby administrátor e-shopu mohl získat přesně tu část panelu administrátora, kterou potřebuje - například „Sklad“ (pouze skladové zásoby) nebo „Editor obsahu“ (pouze CMS) - aniž by se dotýkal pevně daných systémových rolí.
Vlastní role jsou přiděleny osobám pro každou organizaci na stránce [Uživatelé](/docs/admin/users) a uvnitř [Organizace](/docs/admin/parties).

## Požadované oprávnění

| Bit oprávnění | Název | Kdo ho má výchozí |
|---|---|---|
| 4 | MANAGE_ROLES | Vlastník, Administrátor, Administrátor e-shopu (s tímto bitem) |

Bez `MANAGE_ROLES` budete přesměrováni na `/admin`.
Administrátor e-shopu bez organizace je poslán na `/admin/setup`; vlastník bez organizace je poslán na `/admin/parties/new`.

## Seznam rolí (`/admin/roles`)

Role jsou globální (`roles.party_id = null`), takže stejnou roli lze použít ve všech organizacích na platformě.
Seznam je načítán pomocí `fetchRoles` a zobrazuje počet v levém horním rohu plus tlačítko **Nové** v pravém horním rohu.

### Filtr (na straně klienta)

- **Hledat** - vyhledávání podřetězce v názvu role a popisu.
- **Pouze mé role** - zaškrtávací políčko, které skrývá každou roli, kterou jste nevytvořili (`roles.created_by === your id`).

### Sloupce

| Sloupec | Popis |
|---|---|
| Název | Název role, v tučném písmu, s odznákem: „Systém“ (`is_system = true`, vestavěný a neodstraňovatelný) nebo „Vlastní“. |
| Popis | Volný text, nebo pomlčka, když je prázdný. |
| Oprávnění | Jedna značka na aktivní bit oprávnění, označená z sdílených konstant; „žádná oprávnění“ když je maska `0`. |
| Akce | Tlačítko **Odstranit**, zobrazené pouze tehdy, když jste vlastník nebo tvůrce role. |

### Odstraňování role

Odstranění odesílá zpět na stejnou stránku a volá `deleteRole`.
Je chráněno v rozhraní: tlačítko se vykreslí pouze tehdy, když je `isOwner || r.created_by === userId`.
JavaScriptový dialog `confirm()` chrání před náhodnými kliknutími.

## Vytváření role (`/admin/roles/new`)

### Jak na to

1. Klikněte na **Nové** v seznamu rolí.
2. Zadejte **Název** (povinné) a volitelný **Popis**.
3. Zaškrtněte políčka oprávnění, která chcete, aby role poskytovala.
4. Klikněte na **Vytvořit**.
   Vrátíte se do seznamu rolí, kde je nová role okamžitě přidělitelná.

### Pole

| Pole | Sloupec | Poznámky |
|---|---|---|
| Název | `roles.name` | Povinné, zobrazeno v rozbalovacích menu při přidělování. |
| Popis | `roles.description` | Volitelný pomocný text. |
| Oprávnění | `roles.permissions` (bitmaska) | Dvoukolumnová mřížka zaškrtávacích políček; hodnota každého zaškrtávacího políčka je bit z `PERMISSIONS`. |

Nabízené zaškrtávací políčka oprávnění jsou:
VIEW_DASHBOARD, MANAGE_USERS, MANAGE_ROLES, MANAGE_PRODUCTS, MANAGE_CATEGORIES, MANAGE_ORDERS, MANAGE_INVENTORY, MANAGE_PRICING, MANAGE_CUSTOMERS, MANAGE_REPORTS, MANAGE_AUDIT.
Při odeslání server logicky spojí každou zaškrtnutou hodnotu do jednoho celého čísla uloženého v `roles.permissions`; samotné čísla pocházejí pouze z `shared/constants/permissions.ts`, nikdy nejsou hardkodována.

## Jak vlastní role se stávají účinnými oprávněními

Uživatel může mít v jedné organizaci několik vlastních rolí.
Jejich účinná oprávnění v dané organizaci je bitové OR všech rolí, které tam drží, vyřešené v době běhu pomocí databázové funkce `get_user_permissions(userId, partyId)`.
To se používá pouze pro administrátory e-shopu; administrátoři a vlastníci vždy obdrží `ALL_PERMISSIONS` bez vyhledávání.

## Data a úložiště (cloud)

- **Tabulky:** `roles` (`id`, `name`, `description`, `permissions`, `party_id` (vždy null pro vlastní role), `is_system`, `created_by`), `user_party_roles` (přiděluje roli uživateli v organizaci).
- **Služby:** `fetchRoles`, `createRole`, `deleteRole` (`permissionsService`); RPC `get_user_permissions` pro vyřešení v době běhu.
- **Konstanty:** `PERMISSIONS`, `hasPermission` z `shared/constants/permissions.ts`.

## Související stránky

- [Uživatelé](/docs/admin/users) - přidělit vlastní roli osobě pro jednu organizaci
- [Organizace](/docs/admin/parties) - formulář pro pozvání na úrovni organizace také vybírá systémovou roli plus vlastní roli
- [Systém oprávnění](/docs/users/permissions) - kompletní bitová reference
