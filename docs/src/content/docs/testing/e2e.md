---
title: Sada E2E testů
description: Jak fungují 132 automatizované end-to-end testy a jak je spustit.
---

## Co testy dělají

E2E (end-to-end) testy používají **Playwright** k otevření skutečného prohlížeče, kliknutí na každou administrátorskou stránku, vyplnění formulářů a ověření výsledků. Testují celý systém - od databáze po uživatelské rozhraní (UI) - v jednom průchodu.

Testy se spouštějí s **viditelným prohlížečem** (headed mode) lokálně, abyste mohli sledovat jejich fungování. V CI se spouštějí bez hlavy (headless).

## Spouštění testů

```bash
cd website
node_modules/.bin/playwright test --timeout=60000
```

Nebo pomocí úplné cesty z kořenového adresáře projektu:
```bash
cd /path/to/website-mobile-template/website
node_modules/.bin/playwright test
```

## Předpoklady

Před spuštěním testů:
1. **Lokální Supabase musí běžet**: `supabase start`
2. **Dev server musí běžet**: `cd website && pnpm dev` (v samostatném terminálu)
3. **Testovací uživatelé musí existovat** v lokální autorizaci Supabase

## Globální nastavení

Než se spustí jakýkoli test, automaticky se spustí `tests/e2e/global-setup.ts`. Tento soubor:
1. Resetuje hesla pro tři testovací účty
2. Vyčistí všechna testovací data z předchozích běhů
3. Zaseje čerstvá testovací data (organizace, produkt, objednávka, kupón, oznámení atd.)

Tím se zajišťuje, že každý běh testu začíná známým stavem.

## Testovací účty

| Email | Heslo | Role |
|-------|----------|------|
| `admin@test.com` | `Admin1234!` | Vlastník (8) |
| `eshop@test.com` | `Eshop1234!` | Administrátor e-shopu (2) |
| `user@test.com` | `User1234!` | Uživatel (1) |

## 12 testovacích souborů

| Soubor | Testy | Co pokrývá |
|------|-------|---------------|
| `01-auth.spec.ts` | 9 | Přihlášení, odhlášení, špatné heslo, přesměrování na základě role |
| `02-parties.spec.ts` | 12 | Vytváření/editace/smazání organizací, správa členů |
| `03-categories.spec.ts` | 10 | CRUD stromu kategorií, rodič-dítě, smazání |
| `04-products.spec.ts` | 16 | CRUD produktů, vyhledávání, filtrování, změny stavu |
| `05-orders.spec.ts` | 12 | Přechody stavu objednávky, odkaz na zákazníka, sledování |
| `06-customers.spec.ts` | 8 | CRUD zákazníků, vyhledávání, historie objednávek |
| `07-pricing.spec.ts` | 12 | Pravidla slev, vytváření kupónů, duplicitní kód |
| `08-inventory.spec.ts` | 10 | Úpravy zásob, filtr nízkých zásob, odznak |
| `09-users-roles.spec.ts` | 14 | Přiřazování rolí, vytváření/smazání vlastních rolí |
| `10-audit-notifications.spec.ts` | 10 | Filtr protokolu auditu, zobrazení oznámení |
| `11-dashboard.spec.ts` | 8 | Karty KPI, navigace v bočním panelu |
| `12-access-control.spec.ts` | 9 | Ochranné mechanismy pro přihlašování, přístup k stránkám na základě role |
| `13-new-features.spec.ts` | 17 | Kategorie na produktech, nahrávání obrázků, viditelnost hierarchie uživatelů |

**Celkem: 149 testů - všechny úspěšné.**

## Snímky obrazovky

Každý krok testu zachytí snímek obrazovky uložený do adresáře `tests/screenshots/`. Po běhu testu můžete tyto snímky prohledat, abyste viděli přesně, co se stalo v každém kroku.

## Seriální režim

Testy v rámci každého souboru specifikace se spouštějí **seriálně** (jeden po druhém, sdílejí stránku prohlížeče). To umožňuje testům stavět na sobě - například test 3 vytvoří kategorii, test 4 ji ověří v seznamu.

Samotné testovací soubory se také spouštějí seriálně (jeden soubor najednou), aby se předešlo závodním stavům.

## Oprava selhajícího testu

1. Spusťte pouze selhající soubor: `node_modules/.bin/playwright test tests/e2e/03-categories.spec.ts`
2. Podívejte se na snímek obrazovky pro tento test v adresáři `tests/screenshots/`
3. Zkontrolujte zprávu o chybě - obvykle nesoulad lokátoru nebo problém s časováním
4. Opravte buď test, nebo základní chybu v aplikaci
5. Opětovně spusťte celou sadu, abyste potvrdili, že se nic jiného nezlomilo

## Běžné problémy s testy

| Problém | Oprava |
|---------|-----|
| "strict mode violation: X resolved to 2 elements" | Použijte specifičtější selektor - `getByRole("cell", { name: "X", exact: true })` |
| `selectOption({ label: /regex/ })` selhává | Playwright vyžaduje pro label řetězec - použijte `{ label: "Přesný label" }` nebo `{ index: 1 }` |
| Český text neodpovídá `/english/i` | Přidejte českou alternativu: `/english\|česky/i` nebo navigujte pomocí URL místo klikání na záložky |
| "Target page... has been closed" | Předchozí test se přesunul - přidejte `page.goto(URL)` na začátek ovlivněného testu |
