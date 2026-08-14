# Landing sections redesign: Features + ExampleScenarios + FoundingSellers

## Context

The marketing landing page (`website/src/pages/index.astro`) composes ten section components.
Three of them render with plain white/near-white cards and modest hierarchy, flat compared to the rest of the landing page's editorial mint/cream/serif identity:

- `Features.astro` (icon-card grid, "Skutečná e-commerce platforma, ne hračka na tvorbu stránek") — **already redesigned and implemented** (cream cards, mint icon badges). Documented here for reference only.
- `ExampleScenarios.astro` (example cards, "Jak vypadá matematika v praxi") — plain white cards, bare thin-line SVG icons, modest number sizing. Spec below, not yet implemented.
- `FoundingSellers.astro` (benefit cards, "Jsme úplně noví. Přesně proto je teď ten nejlepší čas začít.") — cards use the unmodified `.card` default (`--bg-page` background), which barely contrasts against the page background and has no icon treatment, reading as unstyled next to the rest of the page. Spec below, not yet implemented. Added to scope 2026-08-15 after user feedback that both this section and ExampleScenarios look unstyled.

All three already have hover interactions (shadow lift, border color shift) defined in scoped `<style>` blocks; only the static/resting state needs work.

This is a visual-only redesign of these components.
No copy changes, no new components, no changes to `LandingLayout.astro`, `admin/`, or `eshop-*` templates.

## Existing design tokens (from `website/src/styles/landing.css`, scoped under `.landing`)

- `--accent-primary: #0E8F65` — dark, WCAG-AA mint used for text/icons/links.
- `--landing-mint: #5BD4A8` — bright decorative mint, backgrounds/badges only (fails text contrast).
- `--landing-mint-soft: #E8F5EE` — pale mint tint, for badge/icon backgrounds.
- `--landing-cream: #FDF8EF` — warm off-white, alternate surface color.
- `--landing-ink: #0B1220` — near-black, used for primary CTAs.
- `--font-display: "Instrument Serif", Georgia, serif` — headings and display numbers.
- `--font-mono-landing: "JetBrains Mono", ui-monospace, monospace` — eyebrows/labels.
- `--radius-md: 14px` (from `global.css`) — used for the new icon badge.
- `--success: #10B981` (from `global.css`, NOT overridden in `.landing` scope) — currently used for the "keep" number in `ExampleScenarios.astro`; this spec replaces it with `--accent-primary` for palette consistency (see below).

## Design direction: restrained editorial

Lean into the existing serif/mono/mint identity rather than introducing new colors, gradients, or patterns.
The change is chrome and hierarchy, not a new visual language.

## Section 1: `Features.astro`

- **Card background**: `var(--landing-cream)` instead of the inherited white `.card` default. Border, `box-shadow: var(--shadow-sm)` at rest, and the existing hover lift (`box-shadow: var(--shadow-md)`, `translateY(-3px)`, `border-color: var(--border-strong)`) are unchanged.
- **Icon badge**: each of the 6 existing inline SVG icons (basket, globe, people, box, card, gear — unchanged paths) moves inside a new wrapper: a `56px` square, `border-radius: var(--radius-md)`, `background: var(--landing-mint-soft)`, icon centered inside at its current `32px` size and `var(--accent-primary)` stroke color. This replaces the icon floating bare above the title.
- **Typography**: `.feature-title` and `.feature-desc` unchanged.
- **Grid/layout**: unchanged (`grid-auto`, same responsive breakpoints).

## Section 2: `ExampleScenarios.astro`

- **Card background**: same `var(--landing-cream)` fill, for consistency with Features cards on the same page.
- **Number hierarchy inversion**: the "keep" amount (currently `<strong>{scenario.keep}</strong>` at 22px) becomes the dominant element of the card — large `var(--font-display)` serif number, roughly double current size (target ~40-44px, confirm against card width during implementation so it doesn't wrap awkwardly on narrow viewports). The monthly-revenue line (currently `<span>{scenario.monthly}</span>` at 13px) and the "zůstane" label shrink to small supporting text positioned above/below the hero number.
- **Color**: the hero number switches from `var(--success)` (`#10B981`, an unrelated global-scope green) to `var(--accent-primary)` (`#0E8F65`, the landing page's own dark mint) so it matches the page's palette instead of introducing a second, unrelated green.
- **Badge and persona title**: unchanged in position and style.
- **Layout**: unchanged (`grid-auto`, same card structure otherwise).

## Section 3: `FoundingSellers.astro`

- **Card background**: `var(--landing-cream)` fill, same treatment as Features/ExampleScenarios cards, replacing the inherited `.card` default (`var(--bg-page)`, which is too close to the page background to read as a card).
- **Icon badge**: each of the 3 cards gets the same wrapper Features uses — `56px` square, `border-radius: var(--radius-md)`, `background: var(--landing-mint-soft)`, icon centered inside at `32px`, `var(--accent-primary)` stroke, `stroke-width: 1.6`, `viewBox="0 0 24 24"`. Placed above the title, same position/spacing as Features.
- **New icons** (3, matching Features' simple single-color line style — no new visual language):
  - Card 1 ("0 % za založení, žádné SaaS předplatné"): a price tag.
  - Card 2 ("90 % z každého prodeje zůstává vám"): a coin/percent glyph.
  - Card 3 ("Spuštěno za pár minut, ne měsíců"): a lightning bolt.
- **Typography**: `.founding-card-title` and `.founding-card-desc` unchanged.
- **Layout**: unchanged (`grid-auto`, same card structure otherwise).
- **CTA button**: unchanged. `.landing .btn-primary` + `.btn-lg` already render it correctly (dark pill CTA, `--landing-ink` background, `--radius-md` corners) — this is not part of the "looks unstyled" problem and needs no change.

## Explicitly out of scope

- No changes to `LandingLayout.astro`, `landing.css` shared tokens (beyond how the three components consume them), `global.css`, admin templates, or eshop templates.
- No new icons beyond the 3 listed for `FoundingSellers.astro` above; `Features.astro`'s existing 6 SVG paths are unchanged.
- No copy/i18n changes — `shared/i18n/locales/{cs,en}.ts` untouched.
- No changes to `FoundingSellers.astro`'s CTA button, or to the other 7 landing sections (`Hero`, `LogoMarquee`, `HowItWorks`, `TemplatesShowcase`, `AICapabilities`, `CommissionCalculator`, `NoCompanySelling`, `FinalCta`).

## Success criteria

- All three sections render with cream card backgrounds and their respective mint icon badges / hero number, verified visually in a browser (dev server + screenshot), not just by reading the diff.
- Existing hover behavior (shadow lift on `.feature-card:hover` / `.scenario-card:hover` / `.founding-card:hover`) still works.
- `npm run typecheck` and `npm run lint` (as already gated by `scripts/agent-loop.js`) pass with no new errors.
- No other landing sections, admin pages, or eshop templates show any diff.
