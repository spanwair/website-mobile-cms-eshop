# Landing sections redesign: Features + ExampleScenarios

## Context

The marketing landing page (`website/src/pages/index.astro`) composes ten section components.
Two of them — `Features.astro` (icon-card grid, "Skutečná e-commerce platforma, ne hračka na tvorbu stránek") and `ExampleScenarios.astro` (example cards, "Jak vypadá matematika v praxi") — render with plain white cards, bare thin-line SVG icons, and modest number sizing.
They already have hover interactions (shadow lift, border color shift) defined in scoped `<style>` blocks, but the static/resting state looks flat compared to the rest of the landing page's editorial mint/cream/serif identity.

This is a visual-only redesign of these two components.
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

## Explicitly out of scope

- No changes to `LandingLayout.astro`, `landing.css` shared tokens (beyond how the two components consume them), `global.css`, admin templates, or eshop templates.
- No new icons, no icon replacement — same 6 SVG paths in `Features.astro`.
- No copy/i18n changes — `shared/i18n/locales/{cs,en}.ts` untouched.
- No changes to the other 8 landing sections (`Hero`, `LogoMarquee`, `FoundingSellers`, `HowItWorks`, `TemplatesShowcase`, `AICapabilities`, `CommissionCalculator`, `NoCompanySelling`, `FinalCta`).

## Success criteria

- Both sections render with cream card backgrounds and the mint icon badges / hero number, verified visually in a browser (dev server + screenshot), not just by reading the diff.
- Existing hover behavior (shadow lift on `.feature-card:hover` / `.scenario-card:hover`) still works.
- `npm run typecheck` and `npm run lint` (as already gated by `scripts/agent-loop.js`) pass with no new errors.
- No other landing sections, admin pages, or eshop templates show any diff.
