---
title: Uživatelé
description: Seznam všech uživatelů, změna jejich systémové role a přidělování do organizací
---

Stránka Uživatelé zobrazuje všechny, kdo se kdy přihlásili, a je to místo, kde měníte systémovou roli osoby a přidělujete ji k organizacím (organizacím).
Dílá to v souladu s [Rolemi](/docs/admin/roles) (vlastní sadami oprávnění) a [Organizacemi](/docs/admin/parties) (kde je členství na úrovni organizace skutečně spravováno pro jednu organizaci).

## Požadované oprávnění

| Bit oprávnění | Název | Kdo ho má výchozí |
|---|---|---|
| 2 | MANAGE_USERS | Vlastník, Administrátor, Administrátor obchodu (s tímto bitem) |

Bez `MANAGE_USERS` vás systém přesměruje na `/admin`.
Stejný bit také omezuje přístup k [Organizacím](/docs/admin/parties).

## Seznam uživatelů (`/admin/users`)

Stránka načítá uživatele pomocí `fetchUsersForAdmin(supabase, myRole, ctx.partyId)`, takže to, co vidíte, je již omezeno na základě vašeho úrovně oprávnění.
Vlastník vidí všechny uživatele v systému; administrátor nebo administrátor obchodu vidí uživatele relevantní pro své organizace.
Celkový počet je zobrazen v levém horním rohu, např. `24 uživatelů`.

### Lišta filtrů na straně klienta

Filtry běží zcela v prohlížeči (bez obnovení stránky) proti atributům `data-*` na každém řádku.

| Filtěr | Shoda |
|---|---|
| Název | Shoda podřetězce s zobrazeným názvem. |
| E-mail | Shoda podřetězce s e-mailem. |
| Role | Přesná shoda s systémovou rolí; rozbalovací nabídka zobrazuje pouze role, které máte oprávnění přidělit. |
| Organizace | Přesná shoda s názvem organizace; rozbalovací nabídka je automaticky vyplněna z organizací skutečně přítomných v tabulce. |

### Sloupce

| Sloupec | Popis |
|---|---|
| Název | Zobrazený název, v tučném písmu. Pokud profil ještě nemá název, použije se lokalizovaný název „bez jména“. |
| E-mail | E-mail účtu, ztlumený. |
| Role | Odznak s barevným kódováním: vlastník `badge-error` (červená), administrátor `badge-pending` (hnědá), eshop_admin `badge-draft`, uživatel `badge-inactive`. |
| Organizace | Organizace oddělené čárkami, ke kterým uživatel patří, nebo lokalizovaný název „žádné organizace“. |
| Přidán | `profiles.created_at`, formátovaný v aktuálním jazyce. |
| Změnit roli | Inline formulář pro přidělování role (viz níže) nebo text „Vy“ v vašem vlastním řádku. |

## Změna role uživatele

Každý editovatelný řádek obsahuje malý POST formulář. To, zda se vůbec objeví, a jaké cílové role nabízí, je určeno dvěma ochrannými funkcemi na stránce.

### Koho můžete upravit (`canChangeUser`)

- Nikdy nemůžete upravit svůj vlastní řádek (změna vlastní role je zablokována; řádek zobrazuje „Vy“).
- Nikdo nemůže upravit vlastníka (`role >= OWNER` je pro všechny zakázáno přes tuto stránku).
- Aby bylo možné upravit stávajícího administrátora: musíte být vlastníkem, nebo být administrátor, který ho původně přidělil (`profiles.admin_assigned_by === vaše ID`).
  Tím se zabrání, aby jeden administrátor přepsal práci jiného administrátora.
- Jinak můžete upravit, pokud máte alespoň jednu přidělitelnou roli.

### Jaké cílové role jsou nabízeny (`rolesForUser` + `assignableRoles`)

Rozbalovací nabídka je sestavena z `assignableRoles(myRole)`, která vynucuje `canAssignRole` - nikdy nemůžete udělit roli na úrovni nebo vyšší než vaše vlastní.
Peřový administrátor (ne vlastník) upravující jiného administrátora je dále omezen na role pod úrovní administrátora, takže může pouze пониžit, nikdy neposílit.
Vlastník je z tohoto omezení osvobozen a může jakoukoli roli, včetně administrátora a vlastníka, přidělit komukoli.

### Výběr organizace, který se objeví s rolí

Malý klientový skript zobrazuje nebo skrývá dodatkové vstupy na základě zvolené role:

- **Administrátor obchodu (2)** odhalí jednu rozbalovací nabídku **organizace** plus jednu rozbalovací nabídku **vlastní role** (globální role z [Rolemi](/docs/admin/roles)).
  Zvolená vlastní role je uložena do `user_party_roles` pro tuto jednu organizaci.
- **Administrátor (4)** odhalí vícevýběr organizací (vlastní rozbalovací nabídka ve stylu čipů).
  Každá vybraná organizace obdrží nejvyšší globální roli oprávnění uloženou do `user_party_roles`.
- **Uživatel (1)** nezobrazuje žádné vstupy organizace.

### Co uložení zapisuje (POST handler)

1. Ověří, že role je skutečná hodnota `ROLE` (`errorInvalidRole` jinak) a ověří `canAssignRole` (`errorRoleTooHigh` jinak).
2. Vyčistí stávající řádky `user_party_roles` pro vlastní ID organizací aktéra, aby se staré členství nedrželo.
3. Aktualizuje `profiles.role` na novou systémovou roli.
4. Opětovně vloží `user_party_roles` pro vybrané, ověřené ID organizací (jedna organizace pro eshop_admin, více pro administrátora).
5. Přesměruje zpět na `/admin/users`.

Zapisuje se pouze ID organizací, které aktér skutečně ovládá (`ctx.parties`), takže administrátor nemůže uživatele vorganizaci, kterou neřídí, vložit.

## Data a úložiště (cloud)

- **Tabulky:** `profiles` (`role`, `display_name`, `email`, `admin_assigned_by`, `created_at`), `user_party_roles` (`user_id`, `party_id`, `role_id`), `roles` (globální vlastní role, `party_id = null`).
- **Služby:** `fetchUsersForAdmin`, `fetchUserParties` (`profileService`); `fetchRoles` (`permissionsService`).
- **Konstanty:** `ROLE`, `ROLE_LABEL`, `assignableRoles`, `canAssignRole` z `shared/constants/permissions.ts` - jediný zdroj pravdy pro čísla a názvy rolí.

## Související stránky

- [Rolemi](/docs/admin/roles) - definují vlastní sady oprávnění, které jsou přiděleny administrátorům obchodu
- [Organizacemi](/docs/admin/parties) - spravují členství a pozvánky pro jednu organizaci, včetně procesu pozvání e-mailem pro zcela nové uživatele
- [Nastavení](/docs/admin/setup) - kam je poslán administrátor obchodu, který ještě nemá organizaci
