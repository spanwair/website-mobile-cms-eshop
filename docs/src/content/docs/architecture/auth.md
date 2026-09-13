---
title: Autentizace a tok ověřování
description: Jak funguje přihlašování, správa relací a kontrola přístupu.
---

## Jak funguje autentizace

Platforma používá pro autentizaci **Supabase Auth**. Supabase Auth zajišťuje:
- Uživatelské účty a hesla
- Tokeny relací (JWT)
- OAuth (Google Sign-In)
- Magické odkazy (přihlašování e-mailem bez hesla)

## Tok přihlašování

1. Uživatel se dostane na `/login`
2. Zadává e-mail a heslo (nebo použije Google/magický odkaz)
3. Supabase ověří údaje a vrátí JWT relaci
4. Relace je uložena v cookie (SSR) nebo v lokálním úložišti (mobilní aplikace)
5. Při další žádosti server přečte cookie, ověří JWT u Supabase a načte profil uživatele
6. Pokud je `role` profilu `>= ESHOP_ADMIN (2)`, uživatel může přistupovat k `/admin`
7. Pokud je role `USER (1)` nebo nižší, je přesměrován na `/dashboard`

## Ochranná vrstva autentizace na serveru

Každá administrátorská stránka začíná tímto kódem:

```typescript
const { data: { session } } = await supabase.auth.getSession();
if (!session) return Astro.redirect("/login");

const ctx = await requireAdminCtx(supabase, session.user.id);
if (!ctx) return Astro.redirect("/dashboard");
```

`requireAdminCtx()` kontroluje:
1. `role` uživatele v tabulce `profiles`
2. K jaké organizaci (party) uživatel patří
3. Jeho oprávnění pro danou organizaci

## Klient Supabase v SSR

Webová stránka používá **klient s service-role** pro operace SSR, který obchází bezpečnostní omezení na úrovni řádků (Row Level Security). Kontrola přístupu je vynucována na aplikační vrstvě (ochranná vrstva administrátora a omezené dotazy).

Mobilní aplikace používá **klient s anon-key** s JWT uživatele - RLS zde platí.

## Udržování relace

Na webové stránce jsou relace uloženy v cookie, které platí 7 dní. Na mobilní aplikaci jsou relace uloženy pomocí MMKV (šifrované lokální úložiště) a trvají, dokud uživatel neodhlásí.

## Odhlášení

Volání `supabase.auth.signOut()`. Toto vymaže cookie relace a přesměruje na `/login`.

## Magické odkazy

Supabase podporuje přihlašování pomocí **magických odkazů** - uživatel zadá svůj e-mail a obdrží odkaz, který ho přihlásí bez hesla. Aktivujte toto v nastavení Supabase Auth.

## Google OAuth

Google Sign-In je předkonfigurován. Nastavte své ověřovací údaje OAuth v nastavení Supabase Auth a přidejte své URL pro přesměrování. Funguje jak na webu, tak na mobilu.
