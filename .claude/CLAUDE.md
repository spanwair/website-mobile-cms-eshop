# CLAUDE.md — website-mobile-template

## Project

Full-stack template: React Native mobile app (Android APK) + Astro website + Supabase backend.

## Folder structure

| Folder       | Purpose |
|-------------|---------|
| `shared/`   | Code that runs on both mobile and website. Zero duplication. |
| `mobile/`   | React Native / Expo app — Android APK + iOS |
| `website/`  | Astro SSR website |
| `supabase/` | DB migrations + Edge Functions |
| `scripts/`  | DB push, function deploy, build scripts |

## Rules (non-negotiable)

1. **Never duplicate logic** — if it works in both, it belongs in `shared/`.
2. **Max 200 lines per file** — split by component, route, service, or util.
3. **No comments** unless the WHY is non-obvious.
4. **No fallback mechanisms** — they hide failures.
5. **Credentials only in** `.env.development`, `.env.production`, `.envrc` — never hardcode.
6. **All DB changes** go through `supabase/migrations/`, never the Supabase dashboard.

## Tech stack

- Mobile: **React Native 0.83 / Expo 55** — package manager **pnpm**
- Website: **Astro 5** (SSR mode) — pnpm
- Database: **Supabase (PostgreSQL)** — two projects: dev + prod
- Auth: magic link + Google OAuth (via Supabase Auth)
- Types: TypeScript strict mode
- Tests: Jest (mobile), Playwright (website E2E)

## Key commands

```bash
# Mobile
cd mobile && pnpm start          # Start Expo dev server
cd mobile && pnpm android        # Run on Android emulator/device
cd mobile && pnpm build:android:dev   # Build dev APK (local)
cd mobile && pnpm test           # Run Jest tests
cd mobile && pnpm typecheck      # TypeScript check
cd mobile && pnpm lint           # ESLint

# Website
cd website && pnpm dev           # Start Astro dev server (port 4321)
cd website && pnpm build         # Production build
cd website && pnpm typecheck     # TypeScript check

# Supabase
./scripts/db-push.sh development        # Push migrations to dev
./scripts/db-push.sh production         # Push migrations to prod (main branch only)
./scripts/functions-deploy.sh development  # Deploy Edge Functions to dev
supabase gen types > shared/supabase/types.ts  # Regenerate DB types after schema changes
```

## Environment files

Copy examples and fill in your keys:
```bash
cp .env.development.example .env.development
cp .env.production.example .env.production
cp .envrc.example .envrc && direnv allow
```

## Supabase

Two Supabase projects — **never mix them**:

| Environment | Project ref |
|------------|-------------|
| development | `YOUR_DEV_PROJECT_REF` |
| production  | `YOUR_PROD_PROJECT_REF` |

After any schema change: `supabase gen types > shared/supabase/types.ts`

## Agent team

| Agent | File | Purpose |
|-------|------|---------|
| Project Leader | `agents/project-leader.md` | Scope tasks, coordinate agents, run first |
| Architect | `agents/architect.md` | Cross-cutting decisions, shared/ placement |
| Copier | `agents/copier.md` | Migrate/copy code from source projects |
| Mobile Specialist | `agents/mobile-specialist.md` | `mobile/` changes |
| Website Specialist | `agents/website-specialist.md` | `website/` changes |
| Supabase Specialist | `agents/supabase-specialist.md` | DB migrations, RLS, Edge Functions |
| Tester | `agents/tester.md` | Jest unit tests + E2E verification |
| Code Reviewer | `agents/code-reviewer.md` | Final review gate |
| Disclaimer | `agents/disclaimer.md` | Legal/copyright/license checks |

## Session state

Maintain state in `_project_specs/session/`:
- `current-state.md` — live session state
- `decisions.md` — append-only architectural decisions

## Todos

Track work in `_project_specs/todos/`:
- `active.md` — current sprint
- `backlog.md` — future
- `completed.md` — done
