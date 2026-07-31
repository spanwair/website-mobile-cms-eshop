# 03 — Design System

## Source of truth

`shared/constants/theme.ts` (`colors`, `spacing`, `radius`, `shadow`, `typography`,
`duration`) and `website/src/styles/global.css` (the same values as CSS custom
properties) are the canonical brand tokens for the whole product. The landing page
must read as the same brand as the admin panel and storefronts — do not introduce a
competing palette.

Confirmed current tokens (already in `website/src/styles/global.css`):

```css
--bg-page: #FFFFFF;
--bg-surface: #F8F9FA;
--bg-subtle: #F1F3F5;
--border-default: #E9ECEF;
--border-strong: #DEE2E6;
--text-primary: #212529;
--text-muted: #6C757D;
--text-placeholder: #ADB5BD;
--accent-primary: #4F46E5;
--accent-secondary: #7C3AED;
--accent-primary-hover: #4338CA;
--success: #10B981;
--warning: #F59E0B;
--error: #EF4444;
--shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
--shadow-md: 0 4px 16px rgba(0,0,0,0.06);
--radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px; --radius-xl: 24px;
```

Reuse these directly — do not redefine `--accent-primary` or similar inside
`landing.css`. `landing.css` only **adds** marketing-specific tokens that don't exist
in the admin/storefront context (a dark hero surface, gradients, display type sizes),
scoped under a `.landing` class so they never leak into other pages.

## `website/src/styles/landing.css`

```css
.landing {
  --landing-dark: #111827;
  --landing-dark-elevated: #1A2033;
  --landing-dark-text: #F3F4F6;
  --landing-dark-text-muted: #9CA3AF;
  --landing-glow-accent: rgba(79, 70, 229, 0.35);
  --landing-glow-success: rgba(16, 185, 129, 0.25);
  --landing-gradient-hero: linear-gradient(180deg, var(--landing-dark) 0%, #0B0F1A 100%);

  --display-2xl: clamp(2.75rem, 5vw + 1rem, 4.5rem);
  --display-xl: clamp(2.25rem, 3.5vw + 1rem, 3.5rem);
  --display-lg: clamp(1.75rem, 2.5vw + 1rem, 2.5rem);
  --display-md: clamp(1.375rem, 1.5vw + 1rem, 1.75rem);

  --landing-section-y: clamp(56px, 8vw, 120px);
  --landing-max-width: 1200px;
}

.landing section { padding-block: var(--landing-section-y); }
.landing .container-lg {
  max-width: var(--landing-max-width);
  margin-inline: auto;
  padding-inline: 24px;
}

.landing .section-eyebrow {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--accent-primary); margin-bottom: 12px;
}
.landing .section-title {
  font-size: var(--display-lg); font-weight: 800; letter-spacing: -0.02em;
  color: var(--text-primary); margin-bottom: 16px;
}
.landing .section-sub {
  font-size: 17px; color: var(--text-muted); max-width: 640px; line-height: 1.6;
}
.landing .section-title--center, .landing .section-sub--center { margin-inline: auto; text-align: center; }

.landing--dark {
  background: var(--landing-gradient-hero);
  color: var(--landing-dark-text);
}
.landing--dark .section-title { color: var(--landing-dark-text); }
.landing--dark .section-sub { color: var(--landing-dark-text-muted); }

.landing .btn-lg { padding: 14px 28px; font-size: 16px; border-radius: var(--radius-md); }
.landing .btn-white { background: #fff; color: var(--accent-primary); }
.landing .btn-white:hover { background: #F3F4F6; }
.landing .btn-outline-light {
  background: transparent; color: var(--landing-dark-text);
  border: 1.5px solid rgba(255,255,255,0.25);
}
.landing .btn-outline-light:hover { background: rgba(255,255,255,0.08); }

.landing .grid-auto {
  display: grid; gap: 24px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

@media (max-width: 640px) {
  .landing .container-lg { padding-inline: 16px; }
}
```

## Component conventions (CSS-class based, not new .astro "UI kit")

Do **not** build a parallel `Button.astro` / `Card.astro` / `Badge.astro` component
library — the existing site already expresses these as CSS classes (`.btn`,
`.btn-primary`, `.card`, `.badge`) applied directly to plain elements (see
`website/src/styles/global.css`). Follow the same pattern on the landing page: plain
`<a class="btn btn-primary btn-lg">` / `<div class="card">`, extended only with the
`.landing`-scoped modifier classes above (`.btn-white`, `.btn-outline-light`). This
keeps the page consistent with the rest of the codebase and avoids a duplicate
component layer for something CSS already solves.

## Typography

Reuse the system font stack already declared on `html` (`"Inter", system-ui,
sans-serif` — no new font loading, no extra network request). Marketing headlines use
the `--display-*` scale defined above; body copy stays at the existing 15–17px scale
used elsewhere in the product.

## Motion tokens

Reuse `duration` from `shared/constants/theme.ts` (`fast: 150ms`, `normal: 250ms`,
`slow: 400ms`) for all CSS transitions and the vanilla JS animation utilities in
`12_ANIMATIONS_VANILLA.md`. Scroll-reveal animations use `slow` (400ms); hover/focus
micro-interactions use `fast` (150ms).

## Breakpoints

Match what's implied by the existing responsive CSS in the codebase — mobile-first,
single breakpoint at `640px` for stacking, a second at `1024px` where the 3-up grids
above collapse to 2-up (handled automatically by `grid-auto`'s `auto-fit` — no extra
media query needed for that specific case).
