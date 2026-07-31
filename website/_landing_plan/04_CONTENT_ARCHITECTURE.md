# 04 — Content Architecture

## Shoptet.cz structure (fetched live from shoptet.cz, cs, as of 2026-07-29)

Recorded here so downstream files can reference "the Shoptet slot" without re-fetching.
This is a factual structural record, not copy to reuse verbatim.

**Header nav:** Funkce · Ceník · Šablony · Reference · Podpora (submenu) — Kontakt ·
Nápověda · Přihlásit — CTA "Vyzkoušet" — phone number.

**Homepage, top to bottom:**
1. Hero — headline + subheadline + email-capture CTA ("30 days free trial")
2. Stats strip — 3 big numbers (store count, GMV, order count)
3. "Why choose us" — 4 feature blocks
4. Design/customization showcase — template designer, payments, shipping, marketing
   add-ons, presented visually
5. AI section — smart store management, content generation, AI search readiness
6. 3-step onboarding — email → 30-day trial → pick a plan
7. Support/community — community group, partner network, 24/7 support, education
8. Growth/premium upsell — enterprise tier teaser
9. Ecosystem links — grid of related sub-products
10. Testimonials — 5 named customers with quotes + store URLs
11. Media mentions — press logo strip
12. Growth chart — user count over time, line graph
13. Final CTA — headline + email capture again
14. Mega footer — Information / Group products / Contact / Newsletter / Social / Legal

**Pricing page:** 6 subscription tiers (Free/Basic/Business/Profi/Enterprise/Premium),
per-tier product/feature/support limits, plus separate transaction-based fees
(marketplace %, payment processing %, ad spend %), an expandable full comparison
table across 5 categories, then a 10-question FAQ.

**Templates page:** featured "new template" banner, in-house template grid (name +
preview link), partner template cards (name + one-line tagline + badge), link to full
catalog.

## The mamtodoma.cz equivalent map

| Shoptet slot | mamtodoma equivalent | Key difference |
|---|---|---|
| Hero + email capture | Hero + email capture | Same mechanic, headline is about **0 Kč to start**, not "30-day trial" |
| Stats strip (real, big) | **Founding Sellers** framing | No user-count claim — see `01_OVERVIEW_AND_GUARDRAILS.md` |
| "Why choose us" 4 blocks | `Features.astro` — 4–6 blocks | Same slot, mamtodoma-specific features (see below) |
| Design/customization showcase | `TemplatesShowcase.astro` | 3D-rendered, not static screenshots |
| AI section | `AICapabilities.astro` | Same slot — AI product descriptions, smart pricing suggestions |
| 3-step onboarding | `HowItWorks.astro` | "Sign up → Add products → Start selling", no plan-picking step (there's only one plan) |
| Support/community | Folded into `Features.astro` as one block | Too early-stage for a dedicated community section |
| Pricing tiers table | `CommissionCalculator.astro` | **One number (10%) replaces six subscription tiers** — this is the headline simplification vs. Shoptet |
| Testimonials | **Example Scenarios** | Illustrative personas, not named real customers — see guardrails |
| Media mentions | Omitted for now | No real press coverage yet; do not fabricate |
| Growth chart | Omitted | No real history yet |
| Final CTA | `FinalCta.astro` | Same slot |
| Mega footer | `LandingFooter.astro` | Slimmer — mamtodoma doesn't yet have the sub-product ecosystem Shoptet has (Pay, Univerzita, etc.); don't invent columns for products that don't exist |

## Full sitemap being built

```
/landingpage                 — full one-page narrative (all sections in order below)
/landingpage/pricing         — commission deep-dive + FAQ
/landingpage/features        — full feature list, one section per feature
/landingpage/templates       — template gallery teaser (3D showcase + "more coming")
/landingpage/about           — mission/story, why 10% instead of monthly fees
/landingpage/contact         — contact form
```

## Section order for `/landingpage` (index)

1. Hero (`06`)
2. Founding Sellers (`06`)
3. Features (`07`)
4. How It Works (`07`)
5. Templates Showcase (`08`)
6. AI Capabilities (`08`)
7. Commission Calculator (`09`)
8. Example Scenarios (`09`)
9. Final CTA (`10`)
10. Footer (`10`, present on every landing route via `LandingLayout`)

## Feature list to cover (mamtodoma-specific, be creative but grounded)

Pull these from what the platform (this repo) actually does — don't invent
capabilities the product doesn't have. Cross-reference `CLAUDE.md` and
`shared/constants/permissions.ts` for what's real:

- **Zero monthly cost** — 10% per sale, nothing upfront, nothing recurring.
- **Full storefront + CMS** — custom pages, blog, team, FAQ, navigation, hero
  sliders, footer builder (this is real — see `MANAGE_CMS` permission and
  `project_storefront_cms_extension` memory).
- **Multi-tenant store engine** — custom domain or subdomain per seller
  (`store_domains`, real feature).
- **Role-based team access** — invite staff with scoped permissions, not just a
  single admin login (real — the whole roles/permissions system).
- **Order, inventory, and returns management** — built-in, not a bolt-on
  (`MANAGE_ORDERS`, `MANAGE_INVENTORY` — real).
- **Stripe-powered checkout** — real, `stripe` is already a dependency.
- **Design themes** — product-card variants, layout presets (real — `variants/`,
  theme engine).

Do not claim AI features, a mobile app for sellers, or template marketplace scale
beyond what's plausible for a new platform — frame AI and template-gallery-scale as
**roadmap/early capability**, not a mature ecosystem, in copy tone (see Voice below).

## Voice & tone guidelines

- Direct, confident, plain language — short sentences, no jargon. Czech copy should
  read like a founder talking to another small-business owner, not corporate SaaS
  boilerplate.
- Every section that makes a claim should be checkable against something real in this
  repo (a permission bit, a feature that exists) or explicitly framed as illustrative.
- Never use urgency/scarcity dark patterns ("Only 3 spots left!") — there's no factual
  basis for it at launch.
- Humor is fine in small doses (the "fulfillment factory" 3D concept is already a bit
  playful) but the pricing/commission copy must be unambiguous and taken seriously —
  money math is not the place to be cute.
