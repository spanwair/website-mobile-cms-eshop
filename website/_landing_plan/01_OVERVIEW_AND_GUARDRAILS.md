# 01 — Overview & Guardrails

## The business

mamtodoma.cz lets anyone open an online store for free. No signup fee, no monthly
subscription. The platform takes a 10% commission on every completed sale — the seller
keeps 90%. This is the single most important differentiator to communicate, and it
must be stated plainly and repeatedly: **free to start, 0 Kč/month, ever** — you only
pay when you actually sell something.

This is a genuinely different model from the platform we're using as a structural
reference (see below), which charges monthly subscription tiers. Do not blur this
distinction anywhere in the copy — it's the whole pitch.

## Why Shoptet.cz is the structural reference

Shoptet is the dominant Czech e-commerce SaaS platform. It has spent years refining
which sections convert a visitor into a trial signup, in this market, in this
language. Its actual page structure (fetched live and recorded in
`04_CONTENT_ARCHITECTURE.md`) is a proven pattern: hero with email capture → trust
stats → feature highlights → design/customization showcase → AI capabilities → 3-step
onboarding → community/support → testimonials → media mentions → growth chart → final
CTA → mega-footer.

## The line we don't cross

"Recreate Shoptet" means: **reuse which section types appear and in what order**,
because that order is battle-tested for this exact market and audience. It does
**not** mean:

- Copying Shoptet's actual headlines, body copy, or taglines verbatim or near-verbatim.
- Using Shoptet's logo, brand name, product screenshots, or photography.
- Copying their exact visual design (their specific color palette, their specific
  illustration style) pixel-for-pixel.

Every section below is original copy and original visual treatment for mamtodoma.cz,
built with `mamtodoma`'s own brand tokens (`03_DESIGN_SYSTEM.md`). Reusing a generic
page-structure pattern (hero → features → pricing → testimonials → footer) is normal,
unprotectable, industry-standard practice, common to virtually every SaaS landing
page. Reproducing a competitor's actual expression of that structure is not, and this
project already has a `Disclaimer` agent (`agents/disclaimer.md`) specifically for
catching that category of mistake — if you're ever unsure whether a piece of copy
you're about to write is "inspired by" vs "lifted from" Shoptet, err toward rewriting
it from scratch around the actual mamtodoma facts.

## Two things we will NOT fabricate

Shoptet's real homepage leans hard on two proof points mamtodoma does not have yet:
a big user-count stat block ("47,610 online stores...") and named customer
testimonials with quotes and store URLs.

**mamtodoma.cz is a brand-new startup with zero live sellers at time of writing.**
Inventing a stat ("Join 10,000 happy sellers!") or a named testimonial with a fake
photo and fake revenue number would be a false claim on a commercial site — a real
legal exposure (consumer-protection / unfair-commercial-practices law covers deceptive
testimonials and stats, not just registered trademarks), and also just erodes trust
the moment a sharp visitor notices the store count is fictional.

Instead:

- Replace the stats block with a **"Founding Sellers" framing** — an honest pitch to
  be one of the first, with real, unfalsifiable numbers (the commission rate, the 0 Kč
  starting cost, launch date) instead of an invented headcount. See
  `06_HERO_AND_STATS.md`.
- Replace the testimonials block with **"Example Scenarios"** — clearly labeled
  illustrative personas ("Imagine a candle maker...") showing how the commission math
  works for a plausible seller, not quotes attributed to named real people who don't
  exist. See `09_PRICING_AND_SOCIAL_PROOF.md`. Both sections are built so that real
  testimonials/stats can drop in later once they exist, without restructuring the page.

## Brand direction

Reuse the existing product palette (indigo `#4F46E5` accent, already the source of
truth in `shared/constants/theme.ts` and `website/src/styles/global.css`, used across
admin panel and storefronts) rather than inventing a new one. The landing page adds a
small set of marketing-only extensions on top of it (a dark hero surface, gradients)
— see `03_DESIGN_SYSTEM.md` — but the core accent/success/warning/error tokens and
type scale stay identical to the rest of the product. A visitor who signs up and lands
in the admin panel two minutes later should recognize the same brand, not feel like
they left one company's site and arrived at another's.

## Images: 3D via three.js, not static photography

Every hero/showcase visual is a real-time three.js scene, not a static illustration or
stock photo. The signature scene (main hero) is a stylized "fulfillment hub" — a
central glowing package-processing core with orbiting product icons, small vehicles
arriving with deliveries, radiating out to represent "every seller's store, one
platform." Full spec in `11_THREEJS_SCENES.md`. This is a deliberate, distinctive
visual identity choice — it's what makes the site feel different from a generic
template-based competitor page, and it's cheap to keep updating (no photoshoots, no
stock license fees) as the brand evolves.

## Success criteria for the whole page

- A visitor unfamiliar with the platform can explain, after reading just the hero and
  the pricing section, exactly what it costs to start (nothing) and what it costs to
  sell (10%).
- Every claim on the page is either a stated platform fact (commission %, feature
  list, template count once real) or clearly framed as illustrative/example, never
  presented as a verified real result.
- The page works end to end in both `cs` and `en`.
- Nothing on the page could plausibly be mistaken for Shoptet's own marketing if shown
  side by side — different words, different visuals, same proven skeleton.
