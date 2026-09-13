---
title: Instalace
description: Jak nastavit projekt na vašem zařízení.
---

## Předpoklady

Než začnete, nainstalujte na své zařízení následující:

- **Node.js** 22+ - [nodejs.org](https://nodejs.org)
- **pnpm** 11+ - spusťte `npm install -g pnpm`
- **Supabase CLI** - spusťte `brew install supabase/tap/supabase` (Mac) nebo podívejte se na [supabase.com/docs/guides/cli](https://supabase.com/docs/guides/cli)
- **Expo CLI** (pro mobilní) - spusťte `pnpm install -g expo-cli`

## Klonujte a nainstalujte

```bash
git clone <your-repo-url>
cd website-mobile-template
pnpm install:all
```

## Nastavení souborů prostředí

```bash
cp .env.development.example .env.development
cp .env.production.example .env.production
cp .envrc.example .envrc
```

Otevřete každý soubor a vyplňte své údaje projektu Supabase.

## Spuštění lokálního Supabase

```bash
supabase start
```

Toto spustí lokální databázi PostgreSQL na portu 54322 a API Supabase na portu 54321. V terminálu uvidíte své lokální URL a klíče.

## Spuštění migrací databáze

```bash
./scripts/db-push.sh development
```

Toto aplikuje všechny SQL migrační soubory v `supabase/migrations/` do vaší lokální databáze.

## Spuštění administrátorského webu

```bash
cd website && pnpm dev
```

Otevřete [http://localhost:4321/admin](http://localhost:4321/admin) v prohlížeči.

## Spuštění mobilní aplikace (volitelné)

```bash
cd mobile && pnpm start
```

Poté stiskněte `a` pro otevření na Android emulatoru nebo naskenujte QR kód pomocí Expo Go.

## Výchozí testovací účty

Po spuštění migrací můžete vytvořit testovací účty prostřednictvím Supabase Auth nebo Supabase Dashboard. První uživatel, který se zaregistruje, může být povýšen na Vlastníka spuštěním:

```sql
UPDATE public.profiles SET role = 8 WHERE email = 'your@email.com';
```

v editoru SQL Supabase.
