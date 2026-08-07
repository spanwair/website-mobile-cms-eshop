# Current State

## Status
Stage 1 scaffold complete. Multi-tenant storefront platform built out (Repasado demo org +
CMS/theme engine). 2026-08-06: added a second storefront org "Kytka z Beskyd" (modeled on
kytkazbeskyd.cz) plus a new 11-agent storefront-onboarding team to repeat this on request.

## What's built
- shared/ — supabase client, services (auth, profile, items), types, utils, i18n (en/cs), theme tokens
- mobile/ — Expo 55 app: Login, Home, Items (list+detail), Profile, Admin (dashboard+items)
- website/ — Astro 5 SSR: /, /login, /dashboard, /items, /items/[id], /profile, /admin, multi-tenant /eshop-[partySlug]/ storefronts
- supabase/ — migrations (profiles, items, multi-tenant storefront schema), Edge Function (hello-template), RLS policies
- supabase/seed/ — demo org "Repasado" (repasado, repasado-dark) + "Kytka z Beskyd" (kytka-z-beskyd), each: org/catalog/legal seed files
- scripts/ — db-push.sh, functions-deploy.sh, gen-demo-media.mjs, gen-kytka-media.mjs
- .claude/ — CLAUDE.md, 9 core agents (project-leader, architect, copier, mobile-specialist, website-specialist, supabase-specialist, tester, code-reviewer, disclaimer) + 11-agent storefront onboarding team (product-agent + storefront-*)

## Next steps (after user review)
1. Copy .env.development.example → .env.development and fill in Supabase keys
2. cd mobile && pnpm install && pnpm start  (test Expo)
3. cd website && pnpm install && pnpm dev  (test Astro at localhost:4321)
4. Run supabase gen types to populate typed DB schema
5. Build first APK: cd mobile && pnpm build:android:dev
6. Kytka z Beskyd: confirm real-owner authorization before any production/public deployment,
   replace placeholder product images with real photography, confirm IČO — see
   `_project_specs/session/disclaimer_review_kytka_z_beskyd.md`
