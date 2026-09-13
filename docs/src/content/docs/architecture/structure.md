---
title: Struktura projektu
description: Jak je monorepo uspořádáno.
---

## Rozložení složek

```
website-mobile-template/
├── mobile/          React Native / Expo mobilní aplikace
├── website/         Astro 5 SSR administrace + veřejný web
├── shared/          Kód sdílený oběma (služby, typy, i18n)
├── supabase/        Migrace DB a Edge Functions
├── docs/            Tato dokumentace (Starlight)
├── scripts/         Skripty pro sestavení, nasazení a utility
└── _project_specs/  Plánování projektu a poznámky ze schůzek
```

## Složka shared/

Toto je nejdůležitější složka k pochopení. **Všechna logika, která může běžet jak na mobilu, tak na webu, patří sem.**

```
shared/
├── constants/
│   ├── permissions.ts   Konstanty role (ROLE.OWNER, PERMISSIONS.MANAGE_PRODUCTS…)
│   └── theme.ts         Barvy a rozestupy
├── i18n/
│   ├── locales/cs.ts    České překlady
│   ├── locales/en.ts    Anglické překlady
│   └── getT.ts          Pomocník pro překlady
├── services/
│   ├── authService.ts         Přihlášení / odhlášení
│   ├── categoryService.ts     Získání / vytvoření / aktualizace / smazání kategorií
│   ├── customerService.ts     CRUD zákazníků
│   ├── productService.ts      CRUD produktů + přiřazení kategorie
│   ├── productImageService.ts Nahrávání obrázků, smazání, nastavení primárního
│   ├── profileService.ts      Profil uživatelů + získání uživatelů pro administrátora
│   ├── auditService.ts        Dotazy na protokol auditu
│   ├── inventoryService.ts    Skladové zásoby + úpravy
│   ├── orderService.ts        Dotazy a aktualizace objednávek
│   ├── permissionsService.ts  Kontroly role + oprávnění
│   └── ...
├── supabase/
│   └── types.ts         Automaticky vygenerované typy DB (nikdy ručně nedit)
└── types/
    └── index.ts         Sdílené TypeScript rozhraní
```

## Složka website/

```
website/
├── src/
│   ├── components/
│   │   └── cms/         Komponenty UI pro administraci (CmsLayout, ProductImages, atd.)
│   ├── lib/
│   │   ├── admin.ts     requireAdminCtx() - ochrana pro všechny administrátorské stránky
│   │   ├── i18n.ts      useT() - pomocník pro překlady pro stránky Astro
│   │   └── supabase.ts  createSupabase() - továrna klientů Supabase
│   └── pages/
│       ├── admin/       Všechny administrátorské stránky (SSR, chráněné)
│       ├── dashboard.astro
│       ├── index.astro
│       └── login.astro
├── tests/
│   └── e2e/             E2E testy Playwright
└── playwright.config.ts
```

## Složka supabase/

```
supabase/
├── migrations/          SQL migrační soubory, aplikované v pořadí
│   ├── 20260101000001_create_profiles.sql
│   ├── 20260102000005_eshop_catalog.sql
│   └── ...
└── functions/           Edge Functions (serverless, Deno)
```

## Pravidlo 200 řádků

Každý soubor v tomto projektu musí zůstat pod **200 řádky**. Pokud soubor překročí tuto hranici:
- Rozdělte komponenty na menší komponenty
- Rozdělte služby na samostatné soubory služeb
- Rozdělte administrátorské stránky na podstránky

Tím zůstane kód srozumitelný a každý soubor se zaměří na jednu věc.
