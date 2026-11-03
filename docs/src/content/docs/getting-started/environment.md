---
title: Nastavení prostředí
description: Jak nakonfigurovat proměnné prostředí pro vývoj a produkci.
---

## Soubory prostředí

Projekt používá tři soubory prostředí:

| Soubor | Používá | Účel |
|------|---------|---------|
| `.env.development` | Webové stránky + skripty | Lokální klíče Supabase |
| `.env.production` | Nasazení CI/CD | Klíče Supabase pro produkci |
| `.envrc` | Shell (direnv) | Exporty shellu pro skripty |

**Nikdy tyto soubory necommitujte.** Jsou v `.gitignore`.

## Požadované proměnné

### `.env.development`

```env
PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
PUBLIC_SUPABASE_ANON_KEY=<your local anon key>
SUPABASE_SERVICE_ROLE_KEY=<your local service role key>
```

Získejte je z výstupu `supabase start` nebo z panelu Supabase → Nastavení → API.

### `.envrc`

```bash
export SUPABASE_PROJECT_REF_DEV=<your dev project ref>
export SUPABASE_PROJECT_REF_PROD=<your prod project ref>
export SUPABASE_ACCESS_TOKEN=<your personal access token>
```

Spusťte `direnv allow` po vytvoření tohoto souboru.

## Dvě prostředí

Projekt používá dva oddělené Supabase backendy:

| Prostředí | Účel | Hvětvík |
|------------|---------|--------|
| Vývoj | Lokální testování, práce na funkcích | libovolný |
| Produkce | Skuteční zákazníci, skutečná data | pouze `main` |

**Nikdy nevykonávejte `db-push.sh production` z větve s funkcí.** Skript to vynucuje.

## Supabase lokální vs produkce

Během vývoje spustí `supabase start` vše lokálně - žádný cloud, žádné náklady. Vaše databáze je na `localhost:54322`, API na `localhost:54321`.

V produkci běží stejný Supabase stack **self-hostovaný na VM v Oracle Cloud** (`https://api-oci.mamtodoma.cz`) - nikoli na Supabase Cloud. Váš `.env.production` (a `PUBLIC_SUPABASE_URL` Cloudflare Workeru) ukazuje tam. Samotný web stále běží jako Astro SSR Cloudflare Worker; na Oracle je jen backend.
