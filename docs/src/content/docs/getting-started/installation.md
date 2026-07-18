---
title: Installation
description: How to set up the project on your machine.
---

## Prerequisites

Before you begin, install these on your machine:

- **Node.js** 22+ — [nodejs.org](https://nodejs.org)
- **pnpm** 11+ — run `npm install -g pnpm`
- **Supabase CLI** — run `brew install supabase/tap/supabase` (Mac) or see [supabase.com/docs/guides/cli](https://supabase.com/docs/guides/cli)
- **Expo CLI** (for mobile) — run `pnpm install -g expo-cli`

## Clone and install

```bash
git clone <your-repo-url>
cd website-mobile-template
pnpm install:all
```

## Set up environment files

```bash
cp .env.development.example .env.development
cp .env.production.example .env.production
cp .envrc.example .envrc
```

Open each file and fill in your Supabase project credentials.

## Start local Supabase

```bash
supabase start
```

This starts a local PostgreSQL database on port 54322 and the Supabase API on port 54321. You will see your local URLs and keys printed in the terminal.

## Run database migrations

```bash
./scripts/db-push.sh development
```

This applies all SQL migration files in `supabase/migrations/` to your local database.

## Start the admin website

```bash
cd website && pnpm dev
```

Open [http://localhost:4321/admin](http://localhost:4321/admin) in your browser.

## Start the mobile app (optional)

```bash
cd mobile && pnpm start
```

Then press `a` to open on Android emulator or scan the QR code with Expo Go.

## Default test accounts

After running migrations, you can create test accounts via Supabase Auth or the Supabase Dashboard. The first user to sign up can be promoted to Owner by running:

```sql
UPDATE public.profiles SET role = 8 WHERE email = 'your@email.com';
```

in the Supabase SQL editor.
