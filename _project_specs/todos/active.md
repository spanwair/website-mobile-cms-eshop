# Active Todos

## ✅ Completed (2026-08-07 — Self-serve organization onboarding)
- [x] Organic (non-invited) signups now become ADMIN(4) and can create exactly one org through a legal-status-aware onboarding wizard
- [x] `/admin/parties/new.astro` extended with an IČO branch: with IČO → live immediately (own_company); without IČO → Smalljobs commission mode + `pending_approval` until owner approval
- [x] New `parties.status = 'pending_approval'` — automatically invisible on the public storefront (no RLS changes needed, everything already gates on `status='active'`)
- [x] Owner-only approval gate for `pending_approval → active`, enforced at both DB trigger and app layer (an admin has ALL_PERMISSIONS on their own party, so permission-bit checks alone weren't enough)
- [x] Fixed pre-existing gap: `commissionaire_agreements`/`order_commission_ledger` RLS had no `is_owner()` bypass, unlike every other party-scoped policy
- [x] Guided (non-blocking) setup checklist: category → product → branding, at `/admin/onboarding/tutorial` and as a dashboard banner
- [x] Real Czech/English Privacy Policy + Terms and Conditions copy for platform sellers
- [x] `website/tests/e2e/30-onboarding.spec.ts` — full E2E coverage of both branches + the self-approval security boundary
- [x] Built in isolated worktree (`worktree-user-onboarding`), merged to master after full regression pass

## ✅ Completed (Nightly Evolution Test Run)
- [x] All 299 E2E tests passing
- [x] Website typecheck passing
- [x] Mobile typecheck passing
- [x] Fixed inventory test selector ambiguity (4 test cases)
- [x] Progress logging system validated
- [x] Morning report generation validated

## ✅ Completed (2026-08-06 — Storefront onboarding)
- [x] Built org "Kytka z Beskyd" (florist/dried-flowers storefront modeled on kytkazbeskyd.cz) — party `kytka-z-beskyd`, 6 categories, 12 products, 20 size variants, CMS content, legal pages
- [x] Added 11-agent storefront onboarding team (`product-agent` + `storefront-*`) — invoke "Product Agent" to repeat for a new business
- [x] Real product/logo photos uploaded to Supabase Storage (`product-images`/`store-media` buckets), not hotlinked/placeholder
- [x] Fixed platform-wide bug: false "Vyprodáno" badge on products stocked only at variant level (`shared/services/searchService.ts`) — confirmed also affected Repasado
- [x] Fixed platform-wide bug: storefront profile dropdown never opened (`StorefrontNav.astro` missing click handler) + search input native-appearance border
- [x] Made-to-order Kytka variants no longer stock-gated (`track_inventory=false`); hero slides + blog posts given real photos

## 🚧 Kytka z Beskyd — before production
- [ ] Confirm real-owner (Natálie Ruszová) authorization before any public deployment
- [ ] Confirm real IČO / OSVČ trade-license status (currently left blank)
- [ ] Lawyer review of seeded terms/privacy/cookie pages (currently a template draft)
- [ ] Decide on `smalljobs_commission` seller_mode (owner must accept the agreement themselves)

## 🚧 Partially Done (from AGENTS.md)
- [ ] Order cancellation button — backend supports, no UI
- [ ] Mobile app — screens exist but not connected to real data
- [ ] Reports page — placeholder, no charts
- [ ] Stripe checkout — scaffold ready, needs keys + endpoint
- [ ] Resend emails — scaffold ready, needs keys + trigger wiring
- [ ] Customer self-service portal (`/account` pages)
- [ ] Abandoned cart job — field exists, needs cron/Edge Function

## ❌ Not Started
- [ ] Payment integration (Stripe, GoPay)
- [ ] Email notifications to customers
- [ ] Customer-group pricing
- [ ] Multi-language product content
- [ ] Product variants (size/color)
- [ ] Barcode scanning (mobile)
- [ ] CSV exports
- [ ] Production deployment pipeline
- [ ] Install treehouse for workspace isolation
- [ ] Configure EAS for mobile builds