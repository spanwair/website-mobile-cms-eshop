# MámToDoma — Landing Design System

Source of truth for the public landing + marketing pages (everything under the `.landing`
scope). Admin, onboarding, storefront and auth are **out of scope** and keep their own chrome.

## Concept

> **MámToDoma is about handing a real, grown-up online shop to the people the market
> ignores — the jam-maker, the student printmaker — and it feels like a warm hand-set
> editorial about their craft, because the seller's work is the hero, never the software.**

Test (remove all animation): the idea still reads — big warm serif, the maker's own photos,
copy that talks to a grandmother selling jams, not to a "lead". That is the site.

Register: **Editorial craft** (warm). **No 3D / no WebGL — anywhere.** The craft comes from
type, paper, air, photography-as-print and restrained CSS motion, not from a canvas.
One unexpected structural move: the hero "shop window" that composes itself from flat layers.

Narrative spine: **Reveal** — shop window composes (hero) → one honest promise → how it works →
real shops as proof → the kind deal (commission) → the work it saves → invitation.

## Signature moment — "Výkladní skříň" (the shop window), CSS only

The hero frame is a little storefront that assembles itself from flat layers on load — the
"your shop builds itself" promise, made literal without any 3D.

```
NAME:      Výkladní skříň — a storefront composing from flat editorial layers
TRIGGER:   load (compose, once) + subtle idle on the price chip only
TECH:      pure CSS/DOM transforms + opacity — NO canvas, NO WebGL, NO Three.js
PHASES:    framed photo settles → logo chip drops in → product/price chip slides up →
           "otevřeno" (open) tag fades in last
DURATION:  compose ~1.1s, staggered 0.08s, --ease-out; idle amplitude ≤2%, period 6s
INPUT:     none required; hover the frame lifts the chips a few px (pointer devices only)
FALLBACK:  none needed — it is DOM; if JS is off, everything is simply shown in place
MOBILE:    same compose, no hover lift
REDUCED:   prefers-reduced-motion → all layers shown in place, one soft 0.2s fade, no travel
FIRST 3s:  the storefront is assembled and readable; the compose is a welcome, not a gate
```

Only `transform`/`opacity` animate; above-the-fold, so it plays on load (never on scroll) and
never blocks LCP (the photo is the LCP element and is painted immediately).

## Type

Two self-hosted variable families (see `src/styles/fonts.css`), no third family:
- **Fraunces** (display serif) — warm, high-contrast, editorial. Roles: `display`, `h1`, `h2`.
  Italic used sparingly for an editorial accent word.
- **Inter** (text grotesk) — body, UI, labels. `font-variant-numeric: tabular-nums` on stats.

Scale — one ratio (~1.25 text, dramatic jump to display). Roles map 1:1, no ad-hoc sizes:

| Role | Token | Clamp |
|------|-------|-------|
| display | `--fs-display` | `clamp(3rem, 1.2rem + 8vw, 7rem)` |
| h1 | `--fs-h1` | `clamp(2.25rem, 1.4rem + 3.6vw, 4rem)` |
| h2 | `--fs-h2` | `clamp(1.75rem, 1.2rem + 2.2vw, 2.75rem)` |
| h3 | `--fs-h3` | `clamp(1.3rem, 1.05rem + 1vw, 1.6rem)` |
| body-lg | `--fs-body-lg` | `clamp(1.0625rem, 1rem + 0.4vw, 1.25rem)` |
| body | `--fs-body` | `1.0625rem` (≥16px mobile) |
| small | `--fs-sm` | `0.9375rem` |
| label | `--fs-label` | `0.75rem` (mono-feel: uppercase, +0.08em) |

Rules: body measure `65ch`; line-height body `1.65`, h2 `1.15`, display `0.95`; tracking
`-0.02em` h1 → `-0.035em` display; `text-wrap: balance` headings, `pretty` body;
`font-synthesis: none`. Labels = Inter uppercase +tracking (no mono webfont download).

## Color (warm cream/ink, one accent)

Neutrals are tinted warm (not pure). One accent = **evergreen mint**, its job: the single
interactive / "alive" mark (CTAs, links, active, the square's awnings). Values kept as hex
for compat with existing components; relationships authored OKLCH-style.

| Role | Value | Job |
|------|-------|-----|
| `--bg-page` | `#FBF7F0` warm cream | base paper |
| `--bg-surface` | `#FFFFFF` | raised cards |
| `--bg-subtle` | `#F0EDE4` | quiet bands |
| `--ink` / `--text-primary` | `#1A1714` warm near-black | headings, body |
| `--text-muted` | `#6B6358` warm grey | secondary |
| `--line` / `--border-default` | `#E7E0D3` | hairlines |
| `--accent` / `--accent-primary` | `#0E7C5A` evergreen | the one interactive mark |
| `--accent-soft` | `#E4F2EA` | accent wash / badges |
| `--ink-invert` | `#FBF7F0` | text on ink sections |
| `--section-ink` | `#171412` | the dark editorial band |

Dark editorial bands (`.landing--dark`) re-tune, never invert. Grain overlay 3% on flat
fills. Contrast: body ≥4.5:1, large ≥3:1 — verified, not eyeballed.

## Layout & spacing

- One 12-col grid, fluid gutter, max content `--page: min(100% - 2*gutter, 1200px)`,
  plus a wide editorial `--page-wide: 1320px` for bleed moments.
- Spacing scale only: `--space-3xs…3xl` (0.25→clamp(6rem,10vw,10rem)). Section rhythm
  `--space-3xl` desktop / `--space-xl` mobile.
- Composition: full-bleed ↔ contained alternation; one sticky-column feature list; one
  horizontal band (logo/marquee); deliberate 1–2 grid breaks (hero square bleeds right).
- Radii: two only — `--radius-s` 10px, `--radius-l` 22px. One shadow family.

## Motion

Tokens: `--dur-fast .18s / --dur-base .5s / --dur-slow .9s / --dur-scene 1.4s`;
easing family `--ease-out cubic-bezier(.22,1,.36,1)` default, `--ease-snap (.16,1,.3,1)`.
One reveal everywhere: `[data-reveal]` y:20px + fade, `once`, groups not nodes, never
above-fold. Idle motion ≤2% amplitude. `prefers-reduced-motion` = static but alive.
Only `transform`/`opacity` animate; `will-change` set on start, cleared on end.

## Performance budget (hard)

LCP < 1.5s · CLS < 0.05 · INP < 100ms · first-view JS < 120KB gz · total < 3MB ·
fonts self-hosted (done) · NO canvas/WebGL/Three.js on the landing · motion is CSS-only
(transform/opacity), reduced-motion safe · images AVIF/WebP with width/height · 60fps on mid Android.

## Page inventory (all `.landing`, keep CZ/EN i18n copy)

index · about · contact · features · pricing · eshopy · employment · commissionaire ·
templates · terms (restyle) · privacy (restyle). Every inner page shares the same system,
nav and footer — jurors click through. No dead inner pages.
