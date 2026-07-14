# Active Todos

## Stage 1 — Template scaffold [DONE — pending user review]
- [x] shared/ — supabase client, services, types, utils, i18n, theme
- [x] mobile/ — Expo app with Login, Home, Items, Profile, Admin screens
- [x] website/ — Astro SSR with all routes
- [x] supabase/ — migrations, RLS, Edge Function skeleton
- [x] .claude/ — CLAUDE.md + 8 agent definitions

## Stage 2 — After user review
- [ ] Fill .env.development with real Supabase keys
- [ ] pnpm install in mobile/ and website/
- [ ] Run supabase gen types — update shared/supabase/types.ts
- [ ] Test mobile app on Android emulator
- [ ] Test website at localhost:4321
- [ ] Build dev APK with eas build
- [ ] Write Jest unit tests for shared/services/
- [ ] Add Playwright E2E tests for website
