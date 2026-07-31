# Landing Page Implementation Plan — README

This folder (`landingpage/_plan/`) is a **plan**, not a route. Files here are prefixed
so Astro never turns them into pages. Everything you *build* from this plan lives as
normal siblings of this folder (`website/src/pages/landingpage/*.astro`) and in
`website/src/components/landing/`.

You are implementing a new marketing landing page for **mamtodoma.cz** — a platform
that lets anyone launch a free online store, taking a 10% commission per sale instead
of charging monthly fees. The reference for section structure is shoptet.cz (a real,
live Czech e-commerce SaaS), but **all copy, imagery, and exact visual design here are
original** — never copy Shoptet's actual text, logo, or photos. See
`01_OVERVIEW_AND_GUARDRAILS.md` for why this boundary matters and how to stay inside it.

## Non-negotiable constraints (apply to every step)

1. **No new frameworks.** This site has no React, no Tailwind, no GSAP, no Framer
   Motion. Stay in plain `.astro` files, vanilla CSS (custom properties), and vanilla
   TypeScript. The **only** new dependency you may add is `three` (for the 3D hero
   scene). If a step below seems to need a UI framework, it doesn't — re-read
   `02_TECH_STACK_AND_FOLDER_MAP.md`.
2. **Max 200 lines per file.** Split `.astro` components by section, not by dumping
   everything into one file. i18n locale files are the sole pre-existing exception
   (they're data, already 1300+ lines) — do not try to split those.
3. **No comments unless the WHY is non-obvious.** Never explain what the code does.
4. **No fallback mechanisms that hide failures.** If an API call fails, show the error,
   don't silently swallow it.
5. **i18n via the existing system.** Every user-facing string goes through
   `useT(Astro)` and a key in `shared/i18n/locales/{cs,en}.ts`. No hardcoded strings in
   `.astro` templates. See `05_I18N_SETUP.md`.
6. **Never touch `/admin/*`, `Sidebar.astro`, `admin.ts`, or
   `shared/constants/permissions.ts`.** This landing page is fully public, unauthenticated,
   and has nothing to do with the roles/permissions system. If any step ever seems to
   require touching those files, stop and flag it — that means the plan has gone off
   track.
7. **This does not replace `website/src/pages/index.astro`.** The existing homepage
   stays untouched. The landing page lives at `/landingpage` and its subroutes. Whether
   it ever becomes the real homepage is a separate decision for later — out of scope here.

## Execution order

Work through files in this exact order. Each one builds on assumptions made in the
previous ones (folder paths, design tokens, i18n keys, component names).

| # | File | Produces |
|---|------|----------|
| 1 | `01_OVERVIEW_AND_GUARDRAILS.md` | Nothing to code — read and internalize |
| 2 | `02_TECH_STACK_AND_FOLDER_MAP.md` | `package.json` dep, folder skeleton, `LandingLayout.astro` |
| 3 | `03_DESIGN_SYSTEM.md` | `website/src/styles/landing.css` |
| 4 | `04_CONTENT_ARCHITECTURE.md` | Nothing to code — sitemap + voice reference |
| 5 | `05_I18N_SETUP.md` | `landing` namespace in `cs.ts` + `en.ts` |
| 6 | `06_HERO_AND_STATS.md` | `Hero.astro`, `FoundingSellers.astro` |
| 7 | `07_FEATURES_AND_HOW_IT_WORKS.md` | `Features.astro`, `HowItWorks.astro` |
| 8 | `08_TEMPLATES_AND_AI_SHOWCASE.md` | `TemplatesShowcase.astro`, `AICapabilities.astro` |
| 9 | `09_PRICING_AND_SOCIAL_PROOF.md` | `CommissionCalculator.astro`, `ExampleScenarios.astro` |
| 10 | `10_CTA_AND_FOOTER.md` | `FinalCta.astro`, `LandingFooter.astro` |
| 11 | `11_THREEJS_SCENES.md` | `three/fulfillmentScene.ts`, `three/aiScene.ts` |
| 12 | `12_ANIMATIONS_VANILLA.md` | `scripts/reveal.ts`, `scripts/countUp.ts` |
| 13 | `13_SUBPAGES.md` | `pricing.astro`, `features.astro`, `templates.astro`, `about.astro`, `contact.astro`, `/api/landing/contact.ts` |
| 14 | `14_QA_SEO_DEPLOYMENT.md` | Final checklist — run before calling it done |

## Definition of done, per step

After implementing a file's content:

- `cd website && pnpm typecheck` passes.
- `cd website && pnpm dev` boots and the affected route renders with no console errors.
- Every new string is in `cs.ts`/`en.ts` and renders correctly with `?lang=` toggle
  (see `05_I18N_SETUP.md` for how language is read).
- No file you touched exceeds 200 lines.
- Nothing under `/admin` or the permissions system was touched.

If a step fails one of these, fix it before moving to the next numbered file. Do not
skip ahead — later files assume earlier component/class/key names exist exactly as
specified.

## What "done" looks like overall

A working `/landingpage` route plus five subroutes, built entirely from `.astro` +
vanilla CSS/TS + one `three` dependency, fully bilingual (cs/en), that a visitor with
zero context on the platform can read top to bottom and understand: what this is, why
it's free, what it costs when you sell (10%, no catch), what it looks like, and how to
start. Nothing in it claims a user count, revenue figure, or named customer that isn't
real — see the guardrails file for why.
