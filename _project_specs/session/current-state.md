# Current State

## Status
Stage 1 scaffold complete — awaiting user review.

## What's built
- shared/ — supabase client, services (auth, profile, items), types, utils, i18n (en/cs), theme tokens
- mobile/ — Expo 55 app: Login, Home, Items (list+detail), Profile, Admin (dashboard+items)
- website/ — Astro 5 SSR: /, /login, /dashboard, /items, /items/[id], /profile, /admin
- supabase/ — migrations (profiles, items), Edge Function (hello-template), RLS policies
- scripts/ — db-push.sh, functions-deploy.sh
- .claude/ — CLAUDE.md, 7 agents (project-leader, architect, copier, mobile-specialist, website-specialist, supabase-specialist, tester, code-reviewer, disclaimer)

## Next steps (after user review)
1. Copy .env.development.example → .env.development and fill in Supabase keys
2. cd mobile && pnpm install && pnpm start  (test Expo)
3. cd website && pnpm install && pnpm dev  (test Astro at localhost:4321)
4. Run supabase gen types to populate typed DB schema
5. Build first APK: cd mobile && pnpm build:android:dev
