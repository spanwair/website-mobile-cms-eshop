---
title: Přehled
description: Co tato platforma je a jak se vše dohromady skládá.
---

## Co dostanete "z krabice"

Tato platforma je **hotový backend pro e-commerce**, navržený pro malé a střední podniky. Obsahuje:

- **Webový panel administrátora** pro správu vašeho celého obchodu přímo z prohlížeče
- **Mobilní aplikace React Native**, kterou si mohou vaši zákazníci nainstalovat na Androidu nebo iOS
- **Databáze PostgreSQL** (hostovaná na Supabase) pro všechna vaše data
- **Kontrolu přístupu založenou na rolech**, takže váš tým vidí pouze to, co potřebuje
- **Automatizované E2E testy**, které ověřují, že vše funguje před nasazením

## Tři části

### 1. Webová stránka administrátora (`/website`)
Postavená pomocí [Astro 5](https://astro.build/) v režimu SSR. Zde spravujete vše:
- Přidávání a úprava produktů
- Zpracování objednávek
- Správa zákazníků
- Nastavení pravidel pro slevy a kupóny
- Kontrola, kdo má přístup k čem

Panel administrátora se nachází na `/admin` a je chráněný - přístup mají pouze uživatelé s pravou *role*.

### 2. Mobilní aplikace (`/mobile`)
Postavená pomocí React Native 0.83 + Expo 55. Vaši zákazníci ji používají k procházení vašeho obchodu, vytváření objednávek a správě svého účtu. Kompiluje se do Android APK a iOS aplikace.

### 3. Sdílený kód (`/shared`)
Logika, která běží jak na webové stránce, tak na mobilní aplikaci, se nachází zde - například:
- Funkce služeb databáze (získávání produktů, aktualizace objednávek…)
- Typy TypeScriptu
- Překladové řetězce (česky + anglicky)
- Užitečné funkce pro kontrolu oprávnění

To znamená, že to napíšete jednou a funguje všude.

## Technologieový stack

| Vrstva | Technologie | Proč |
|-------|-----------|-----|
| Webová stránka | Astro 5 SSR | Rychlý, serverově vykreslený, minimální JS |
| Mobilní | React Native + Expo | Jeden kód pro Android + iOS |
| Databáze | Supabase (PostgreSQL) | Správně hostovaný, vestavěná autentizace, RLS |
| Autentizace | Magic link + Google OAuth | Dostupné bez hesla |
| Správce paketů | pnpm | Rychlý, efektivní pro disk |
| Typy | TypeScript strict mode | Zachytí chyby před nasazením do produkce |
| Testy | Playwright (E2E) + Jest | Plné pokrytí od prohlížeče po jednotkové testy |
