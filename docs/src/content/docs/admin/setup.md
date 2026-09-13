---
title: Nastavení (čekání na organizaci)
description: Stránka čekání, kterou vidí administrátor e-obchodu, než mu bude přidělena organizace.
---

`/admin/setup` je stránka čekání.
Je to místo, kam přistoupí [Administrátor e-obchodu](/docs/admin/users), když má jeho účet administrátorský přístup, ale ještě mu nebyla přidělena žádná organizace.
Každá jiná administrátorská role je přesměrována jinde, než se tato stránka vůbec vykreslí, takže v praxi ji vidí pouze pozvaný administrátor e-obchodu, který stále čeká na přidání do skupiny.

## Požadované oprávnění

Žádný bit oprávnění není vyžadován.
Stránka se vykreslí s `userPermissions={0}`, takže boční panel zobrazuje pouze vždy viditelné položky.
Přístup je zcela určen níže uvedenou řetězovou reakcí přesměrování založenou na roli, nikoli bitem oprávnění.

## Kdo se dostane na tuto stránku

Stránka spustí [`requireAdminCtx`](/docs/admin/parties) a poté aplikuje přísnou řetězovou reakci přesměrování.
Pořadí je důležité a pouze poslední případ dosáhne viditelné karty.

| Podmínka | Přesměrování | Proč |
|---|---|---|
| Žádná přihlašovací relace | `/login` | Musí být přihlášen |
| `requireAdminCtx` vrátí `null` (role pod Administrátorem e-obchodu) | `/dashboard` | Čistí zákazníci nemají administrátorský panel |
| `ctx.partyId` je nastaven (jakákoliv dostupná organizace) | `/admin` | Už je nakonfigurováno, přejděte přímo na nástěnku |
| Vlastník bez skupiny | `/admin/parties/new` | Vlastník musí vytvořit první organizaci |
| Samozapsaný administrátor (role = ADMIN) bez skupiny | `/admin/onboarding` | Administrátoři пройdou [úvodní průvodce](/docs/admin/onboarding) namísto toho, aby zde skončili |
| Administrátor e-obchodu bez skupiny | Vykreslí kartu níže | Toto je jediná role, která skutečně musí čekat na pozvání |

## Karty čekání

Když se karta vykreslí, zobrazuje:

- Velký ikona budovy.
- Nadpis a vysvětlující text, který uživateli sděluje, že jeho účet ještě není propojen s organizací.
- Jednáct tlačítko **Přejít domů**, které se vrací k kořenu webu `/`.

Zde není žádný formulář ani žádná akce.
Uživatel nemůže udělat nic jiného než odejít, protože přidělení do organizace provádí vlastník nebo administrátor z [stránky detailů organizace](/docs/admin/parties).
Jakmile někdo tohoto uživatele pozve do skupiny, jeho další návštěva `/admin` najde `ctx.partyId` nastavené a je poslán do panelu normálně.

## Data a úložiště (cloud)

- Čte `profiles.role` pro přihlášeného uživatele prostřednictvím `requireAdminCtx`.
- Čte tabulku `parties`, aby zjistil, zda uživatel má jakoukoliv dostupnou organizaci (to vyplňuje `ctx.partyId` a `ctx.parties`).
- Nic nezapisuje.

## Související stránky

- [Úvodní průvodce](/docs/admin/onboarding) - kam jsou posláni samozapsaní administrátoři namísto této stránky
- [Organizace](/docs/admin/parties) - kam vlastník nebo administrátor přidělí uživatele do skupiny, aby opustil tuto stránku
- [Uživatelé](/docs/admin/users) - kde se mění systémové role
- [Nástěnka](/docs/admin/dashboard) - cílová destinace, jakmile existuje organizace
