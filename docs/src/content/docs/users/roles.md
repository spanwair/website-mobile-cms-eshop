---
title: Hierarchie rolí
description: Kdo může vidět co a kdo může dělat co v CMS.
---

## Čtyři role

CMS používá **numerický systém rolí**, kde vyšší čísla znamenají větší moc. Každý uživatel má přesně jednu roli.

| Role | Číslo | Kdo to je |
|------|--------|-------------|
| **Vlastník** | 8 | Vlastník CMS - vy. Plný přístup ke všemu. |
| **Administrátor** | 4 | Administrátor e-shopu - spravuje produkty, objednávky, tým v rámci své organizace. |
| **Administrátor e-shopu** | 2 | Omezený administrátor - pomáhá s každodenními úkoly, může spravovat běžné uživatele. |
| **Uživatel** | 1 | Účet zákazníka - nemůže vůbec přistupovat k panelu administrátora. |

## Co každá role může vidět

### Vlastník (role = 8)
- Vidí **všechny uživatele** ve všech organizacích
- Může přiřadit jakoukoli roli jakémukoli uživateli
- Může přistupovat ke všemu v panelu administrátora
- Může vidět a spravovat všechny strany (organizace)

### Administrátor (role = 4)
- Vidí **všechny v rámci své vlastní organizace**, ale ne Vlastníky (role 8)
- Může přiřazovat role až **a včetně Administrátora (4)** ostatním - Administrátor může povýšit kolegu na Administrátora
- Plný přístup k produktům, objednávkám, zákazníkům, skladovým zásobám v rámci své organizace
- **Může vytvářet nové organizace** - ale může číst, zapisovat nebo mazat data pouze v organizacích, k kterým je přidělen
- Nemůže vytvářet ani modifikovat Vlastníky

### Administrátor e-shopu (role = 2)
- Vidí **pouze Administrátory e-shopu a Uživatele** (role 1-2) v rámci své organizace
- Může přiřazovat roli Uživatel (1) pouze ostatním
- Přístup k produktům, objednávkám, zákazníkům, skladovým zásobám
- Nemůže přistupovat k správě uživatelů pro uživatele vyšší úrovně

### Uživatel (role = 1)
- **Nemůže vůbec přistupovat k panelu administrátora**
- Je přesměrován na `/dashboard`, pokud se pokusí
- Může používat mobilní aplikaci a veřejně dostupnou webovou stránku

## Jak jsou role vynucovány

Role jsou vynucovány na dvou místech:

1. **Vrstva aplikace** - každá stránka administrátora volá `requireAdminCtx()`, která čte roli uživatele. Pokud je role příliš nízká, uživatel je přesměrován.

2. **Vrstva databáze** - politiky Supabase Row Level Security (RLS) omezují, jaká data každá role může číst, i když někdo zkusí volat API přímo.

## Změna role uživatele

Pouze **Vlastníci** a **Administrátorové** mohou měnit role, a to pouze pro uživatele s nižší rolí než oni sami.

1. Přejděte na **Administrátor → Uživatelé**
2. Najděte uživatele v tabulce
3. Vyberte novou roli z rozbalovacího seznamu
4. Klikněte na **Použít**

> **Důležité**: Nikdy nemůžete přiřadit roli vyšší než vaše vlastní. Administrátor (4) **může** přiřadit jiného Administrátora (kolegu), ale nemůže vytvořit Vlastníka. Administrátor e-shopu (2) může přiřadit roli Uživatel (1) pouze.

## Indikátor "Vy"

V tabulce uživatelů vaše vlastní řádek zobrazuje **"Vy"** namísto rozbalovacího seznamu rolí - nemůžete změnit svou vlastní roli.

## Související

- [Systém oprávnění](/docs/users/permissions) - které bity oprávnění každá role uděluje a jak fungují bitmasky
- [Role (stránka administrátora)](/docs/admin/roles) - vytvářejte a spravujte vlastní role pro Administrátorů e-shopu
- [Uživatelé (stránka administrátora)](/docs/admin/users) - přiřazujte role uživatelům
- [Organizace (stránka administrátora)](/docs/admin/parties) - zveřejňujte členy se specifickými rolemi do své organizace
