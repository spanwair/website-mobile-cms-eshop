---
title: Onboarding
description: Vítací kouzelník a tutoriál pro nastavení, který novému samo-registrovanému administrátorovi pomáhá přejít z prázdné organizace do živého obchodu
---

Onboarding je dvouúrovňový tok, který **samo-registrovaný administrátor** prožije při prvním použití panelu.
Je to cesta, kterou zvolí někdo, kdo se zaregistroval organicky a stal se administrátorem (role = 4), na rozdíl od personálu, který byl pozván do stávající organizace.
Tok obsahuje vítací centrum na `/admin/onboarding` a kontrolní seznam pro nastavení na `/admin/onboarding/tutorial`.

Vlastníci a administrátoři e-obchodu tyto stránky nikdy nevidí.
Vlastník je přímo přesměrován na [vytvoření organizace](/docs/admin/parties), a administrátor e-obchodu bez organizace čeká na [stránce nastavení](/docs/admin/setup).

## Požadované oprávnění

Žádná z onboardingových stránek nevyžaduje bit oprávnění.
Centrum se vykreslí s `userPermissions={0}` a tutoriál se vykreslí s plnými oprávněními (`0xffff`), takže se všechny jeho tlačítka pro akci vyřeší.
Přístup je kontrolován rolí a tím, zda existuje organizace a její první obsah, nikoli bity oprávnění.

## Vítací centrum (`/admin/onboarding`)

Toto je první obrazovka, kterou vidí zcela nový administrátor.

### Kdo se na ni dostane

| Podmínka | Přesměrování |
|---|---|
| Žádná přihlašovací relace | `/login` |
| `requireAdminCtx` vrátí `null` | `/dashboard` |
| `ctx.partyId` je již nastaven | `/admin` (nic k onboardingu) |
| Role není přesně ADMIN | `/admin/setup` (vlastníci a administrátoři e-obchodu mají vlastní cesty) |
| Samo-registrovaný administrátor, žádná organizace | Vykreslí vítací kartu |

### Co zobrazuje

- Ikona rakety, vítací název a úvod.
- Tři karty „kroků“ vysvětlující, co onboarding pokrývá (vytvořte svou organizaci, přidejte svůj katalog, zkomercializujte svůj obchod).
- Jednáctý primární tlačítko, **Vytvořit organizaci**, které odkazuje na `/admin/parties/new?onboarding=1`.

Označení `?onboarding=1` je zachyceno po celém toku.
Upozorňuje [formulář pro novou organizaci](/docs/admin/parties) a stránku detailu organizace, že je navštěvován během onboardingu, takže zobrazí odkaz zpět do tutoriálu namísto chování jako běžná samostatná návštěva.

## Tutoriál pro nastavení (`/admin/onboarding/tutorial`)

Jakmile administrátor vytvoří svou organizaci, přistane na tutoriálu, živém kontrolním seznamu, který sleduje skutečný pokrok v databázi.

### Kdo se na něj dostane

| Podmínka | Přesměrování |
|---|---|
| Žádná přihlašovací relace | `/login` |
| `requireAdminCtx` vrátí `null` | `/dashboard` |
| Žádné `ctx.partyId` | `/admin/parties/new` pokud je vlastník, jinak `/admin/setup` |
| Nebo jinak | Vykreslí kontrolní seznam |

Kromě toho [Nástěnka](/docs/admin/dashboard) administrátorům aktivně vynucuje návrat sem.
Jakmile uživatel s rolí = ADMIN a organizací navštíví `/admin`, zatímco jeho organizace má **nula kategorií nebo nula produktů**, je přesměrován na `/admin/onboarding/tutorial`.
To znamená, že administrátor nemůže vidět prázdnou nástěnku během nastavení, bez ohledu na to, kolikrát se znovu přihlásí.
Přesměrování přestane automaticky fungovat, jakmile existuje alespoň jedna kategorie a jeden produkt.

### Kontrolní seznam

Stránka načte aktuální organizaci a spočítá její kategorie a produkty, poté vykreslí tři kroky.

| Krok | Značka | Kontrola dokončení | Tlačítko |
|---|---|---|---|
| 1. Vytvořit kategorii | Přemění se na zelený zaškrtávací symbol po dokončení, řádek se ztmaví na 70 % opakosti | Alespoň jeden řádek v `categories` pro tuto organizaci | **Vytvořit kategorii** na [`/admin/categories/new`](/docs/admin/categories) |
| 2. Přidat produkt | Přemění se na zelený zaškrtávací symbol po dokončení | Alespoň jeden řádek v `products` pro tuto organizaci | **Přidat produkt** na [`/admin/products/new`](/docs/admin/products) |
| 3. Zkomercializovat svůj obchod | Vždy zobrazeno jako krok 3, nikdy automaticky dokončeno | Není sledováno | **Přejít na vzhled značky** na [`/admin/settings/branding`](/docs/admin/settings-branding) |

Dokončené kroky zobrazují štítek „hotovo“ namísto svého tlačítka.
Tlačítko **Dokončit** na dole odkazuje na `/admin`.

### Poznámka o čekání na schválení

Pokud je stav organizace stále `pending_approval`, nad kontrolním seznamem se objeví další poznámka.
Připomíná administrátorovi, že jeho obchod ještě není pro zákazníky živý a čeká na schválení od vlastníka.
Podívejte se na [Organizace](/docs/admin/parties) pro pracovní postup schvalování a kdo to může provést.

## Banner onboardingu na nástěnce

Neadministrátorské role nikdy nejsou přímě přesměrovány do onboardingu.
Místo toho administrátor e-obchodu, který má oprávnění [Produkty](/docs/admin/products), ale jeho organizace stále nemá žádné kategorie ani produkty, uvidí banner, který lze zavřít po dokončení, na [nástěnce](/docs/admin/dashboard).
Banner odkazuje na stejný kontrolní seznam `/admin/onboarding/tutorial` a zmizí, jakmile katalog přestane být prázdný.

## Data a úložiště (cloud)

- Čte `profiles.role` a tabulku `parties` pomocí `requireAdminCtx`.
- Tutoriál čte aktuální organizaci pomocí `fetchParty` a provádí dotazy `count` proti `categories` a `products` filtrovaným podle `party_id`.
- Tlačítko pro novou organizaci zapisuje do `parties` (viz [Organizace](/docs/admin/parties)).
- Samotné onboardingové stránky žádná data nezapisují.

## Související stránky

- [Nastavení](/docs/admin/setup) - ekvivalentní stránka pro administrátora e-obchodu čekající na pozvání
- [Organizace](/docs/admin/parties) - kde je organizace skutečně vytvořena a později schválena
- [Kategorie](/docs/admin/categories) - krok 1 kontrolního seznamu
- [Produkty](/docs/admin/products) - krok 2 kontrolního seznamu
- [Nastavení obchodu](/docs/admin/settings-branding) - krok 3 kontrolního seznamu (vzhled značky)
- [Nástěnka](/docs/admin/dashboard) - hostuje banner onboardingu a vynucuje administrátorům návrat do tutoriálu, dokud katalog není prázdný
