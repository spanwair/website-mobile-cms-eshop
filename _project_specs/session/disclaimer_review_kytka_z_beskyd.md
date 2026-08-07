# Disclaimer Review — Org "Kytka z Beskyd" (built from kytkazbeskyd.cz)
Reviewer: Storefront Disclaimer Agent
Date: 2026-08-06

## Context

New storefront org built per user request, modeled on the real business kytkazbeskyd.cz
(handmade wreaths & dried flowers, Natálie Ruszová, Hrádek u Frýdku-Místku). This is the
first run of the new storefront onboarding agent team (see `decisions.md` entry below) and
established the compliance pattern `storefront-disclaimer` now enforces going forward.

## Checklist results

| Check | Result | Detail |
|---|---|---|
| Product/logo photos scraped & rehosted | PASS (corrected) | Initially built with generated placeholder SVGs (too cautious a default — see `decisions.md` correction entry). Corrected same day: the 12 real product photos + logo were uploaded into this project's own Supabase Storage (`product-images`/`store-media` buckets, local dev, via `scripts/upload-kytka-media.sh`) rather than hotlinked to kytkazbeskyd.cz. All `product_images.url` / `categories.image_url` / `store_configs.logo_url` / `store_photo_url` now point at this project's own storage host, not the source domain. |
| Fabricated official registration numbers | PASS | `parties.vat_number`, `company_name`, `billing_email` are all `NULL`. Legal pages state `IČO: *bude doplněno*` (to be confirmed) rather than inventing a number for a real individual. |
| Real contact details reused | NOTE (not a block) | Real phone `+420 605 157 739` and village (`Hrádek, okres Frýdek-Místek`) are reused — both are the business's own currently-published public info, reused for their own storefront. No email was published anywhere on the source site, so none was invented; `contact_email` left `NULL`. |
| Marketing copy originality | PASS | About/contact/FAQ/blog/hero copy in `kytka_store_org.sql` is freshly written. Only short factual phrases were reused: the brand tagline "Krása, která nikdy neuvadne" and the published size/price guide (190–320 Kč / 380–680 Kč / 580–880 Kč / 1100+ Kč), which are factual pricing data, not prose. |
| Real named individuals | NOTE (not a block) | Founder name "Natálie Ruszová" is reused (public on her own site); her bio in `team_members` is original writing, no fabricated personal details added. |
| Environment target | PASS | Applied only to local dev Supabase (`127.0.0.1:54322`, Docker stack). Never touched `production`. |
| Legal pages present | PASS | 6 pages seeded (`obchodni-podminky`, `ochrana-osobnich-udaju`, `cookies`, `vraceni-zbozi`, `reklamace`, `platba-a-doprava`), each ending with a "not legal advice, have a lawyer review before real-world use" note per `kytka_store_legal.sql`. |

## Outstanding items before any real-world/production use

- [ ] Confirm with the real business owner (Natálie Ruszová) that this build is authorized
      before it is ever deployed publicly or connected to a real domain/payment processor.
- [x] Real product/logo photos uploaded to Supabase Storage (corrected from initial
      placeholder-SVG approach — see above). Still confirm rights/licensing with the owner.
- [ ] Fill in a real IČO (or confirm OSVČ trade-license status) once registered/confirmed.
- [ ] Have a lawyer review the seeded terms/privacy/cookie pages — they are a template draft,
      not legal advice.
- [ ] Decide whether to switch `seller_mode` to `smalljobs_commission` (fits an individual
      seller with no registered company) — requires the real owner to log in and accept the
      commissionaire agreement themselves; not something to seed on their behalf.

## Sign-off

**COMPLIANT** — no blocking issues found for a local-dev build. All outstanding items above
are pre-production requirements, not build-time blockers, and are surfaced to the user in the
final report.
