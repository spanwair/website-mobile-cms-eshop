---
title: Environment Setup
description: How to configure environment variables for development and production.
---

## Environment files

The project uses three environment files:

| File | Used by | Purpose |
|------|---------|---------|
| `.env.development` | Website + scripts | Local Supabase keys |
| `.env.production` | CI/CD deploy | Production Supabase keys |
| `.envrc` | Shell (direnv) | Shell exports for scripts |

**Never commit these files.** They are in `.gitignore`.

## Required variables

### `.env.development`

```env
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_ANON_KEY=<your local anon key>
SUPABASE_SERVICE_ROLE_KEY=<your local service role key>
```

Get these from `supabase start` output or from the Supabase Dashboard → Settings → API.

### `.envrc`

```bash
export SUPABASE_PROJECT_REF_DEV=<your dev project ref>
export SUPABASE_PROJECT_REF_PROD=<your prod project ref>
export SUPABASE_ACCESS_TOKEN=<your personal access token>
```

Run `direnv allow` after creating this file.

## Two environments

The project runs two separate Supabase backends:

| Environment | Purpose | Branch |
|------------|---------|--------|
| Development | Local testing, feature work | any |
| Production | Real customers, real data | `main` only |

**Never run `db-push.sh production` from a feature branch.** The script enforces this.

## Supabase local vs production

During development, `supabase start` runs everything locally — no cloud, no cost. Your database is on `localhost:54322`, the API on `localhost:54321`.

In production, the same Supabase stack runs **self-hosted on an Oracle Cloud VM** (`https://api-oci.mamtodoma.cz`) — not Supabase Cloud. Your `.env.production` (and the Cloudflare Worker's `PUBLIC_SUPABASE_URL`) point there. The website itself still runs as an Astro SSR Cloudflare Worker; only the backend lives on Oracle.
