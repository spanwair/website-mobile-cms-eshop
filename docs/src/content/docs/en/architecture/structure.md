---
title: Project Structure
description: How the monorepo is organized.
---

## Folder layout

```
website-mobile-template/
├── mobile/          React Native / Expo mobile app
├── website/         Astro 5 SSR admin + public website
├── shared/          Code shared by both (services, types, i18n)
├── supabase/        DB migrations and Edge Functions
├── docs/            This documentation (Starlight)
├── scripts/         Build, deploy, and utility scripts
└── _project_specs/  Project planning and session notes
```

## The shared/ folder

This is the most important folder to understand. **Any logic that could run on both mobile and website goes here.**

```
shared/
├── constants/
│   ├── permissions.ts   Role constants (ROLE.OWNER, PERMISSIONS.MANAGE_PRODUCTS…)
│   └── theme.ts         Colors and spacing
├── i18n/
│   ├── locales/cs.ts    Czech translations
│   ├── locales/en.ts    English translations
│   └── getT.ts          Translation helper
├── services/
│   ├── authService.ts         Login / logout
│   ├── categoryService.ts     Fetch / create / update / delete categories
│   ├── customerService.ts     Customer CRUD
│   ├── productService.ts      Product CRUD + category assignment
│   ├── productImageService.ts Image upload, delete, set-primary
│   ├── profileService.ts      User profiles + fetchUsersForAdmin
│   ├── auditService.ts        Audit log queries
│   ├── inventoryService.ts    Inventory items + adjustments
│   ├── orderService.ts        Order queries and updates
│   ├── permissionsService.ts  Role + permission checks
│   └── ...
├── supabase/
│   └── types.ts         Auto-generated DB types (never edit manually)
└── types/
    └── index.ts         Shared TypeScript interfaces
```

## The website/ folder

```
website/
├── src/
│   ├── components/
│   │   └── cms/         Admin UI components (CmsLayout, ProductImages, etc.)
│   ├── lib/
│   │   ├── admin.ts     requireAdminCtx() — auth guard for all admin pages
│   │   ├── i18n.ts      useT() — translation helper for Astro pages
│   │   └── supabase.ts  createSupabase() — Supabase client factory
│   └── pages/
│       ├── admin/       All admin pages (SSR, protected)
│       ├── dashboard.astro
│       ├── index.astro
│       └── login.astro
├── tests/
│   └── e2e/             Playwright E2E tests
└── playwright.config.ts
```

## The supabase/ folder

```
supabase/
├── migrations/          SQL migration files, applied in order
│   ├── 20260101000001_create_profiles.sql
│   ├── 20260102000005_eshop_catalog.sql
│   └── ...
└── functions/           Edge Functions (serverless, Deno)
```

## The 200-line rule

Every file in this project must stay under **200 lines**. If a file grows beyond that:
- Split components into smaller components
- Split services into separate service files
- Split admin pages into sub-pages

This keeps the codebase navigable and each file focused on one thing.
