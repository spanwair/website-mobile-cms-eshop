# 14 — QA, SEO & Deployment Checklist

Run through this after all of `06`–`13` are implemented. This is the gate before
calling the landing page done.

## Build & type safety

```bash
cd website
pnpm add three && pnpm add -D @types/three   # if not already done in step 02
pnpm typecheck
pnpm dev
```

- [ ] `pnpm typecheck` passes with zero errors (this also catches any `cs.ts`/`en.ts`
      key mismatch from step 05).
- [ ] `pnpm dev` boots; visit `/landingpage` and all five subroutes — no console
      errors in the browser devtools.
- [ ] No file under `website/src/components/landing/` or
      `website/src/pages/landingpage/` exceeds 200 lines
      (`wc -l website/src/components/landing/**/*.astro website/src/pages/landingpage/*.astro`).

## Functional checks

- [ ] Hero email form → submits to `/api/landing/lead`, shows a response, doesn't
      throw if `RESEND_API_KEY` is unset in local dev (should show the "not
      configured" state gracefully, not a raw 500 with no UI feedback).
- [ ] Footer newsletter form → same endpoint, same behavior.
- [ ] Contact form (`/landingpage/contact`) → submits to `/api/landing/contact`,
      validates required fields client-side (`required` attributes) and server-side
      (400 on missing/invalid fields).
- [ ] Commission calculator slider updates the displayed Kč amounts instantly with no
      page reload, at both slider extremes (100 Kč and 10 000 Kč).
- [ ] FAQ `<details>` items on `/landingpage/pricing` expand/collapse without JS
      (native `<details>`/`<summary>` — confirm no script is required for this to
      work, which it shouldn't be).

## i18n

- [ ] Every string on every one of the 6 routes goes through `t.landing.*` — grep for
      any stray hardcoded English/Czech string left directly in a `.astro` template:
      `grep -rn '>[A-Za-z]' website/src/components/landing website/src/pages/landingpage --include="*.astro"`
      and manually check any hit that isn't inside a `{}` expression.
- [ ] Switching the `lang` cookie between `cs`/`en` (however the rest of the site
      exposes that toggle — check `getLang` in `website/src/lib/i18n.ts`) changes
      every section's copy, not just some.

## Three.js scenes

- [ ] Hero scene renders on desktop and mobile viewport widths without a frozen tab
      or dropped frames (watch the FPS counter in devtools' performance panel for ~5s).
- [ ] Toggling OS-level "reduce motion" (or `prefers-reduced-motion` via devtools
      rendering emulation) freezes all three canvases to a single static frame —
      confirm this for `fulfillmentScene.ts` and both `aiScene.ts` instances.
- [ ] Scrolling a canvas fully off-screen and checking the performance panel confirms
      its render loop actually pauses (no continued `requestAnimationFrame` calls).
- [ ] No console warnings about WebGL context loss or excessive draw calls.

## SEO & metadata

Per-route `<title>`/`<meta description>` (already wired via `LandingLayout` props in
`13_SUBPAGES.md` — confirm each page passes distinct, non-generic values):

| Route | Title uses | Description uses |
|---|---|---|
| `/landingpage` | `t.landing.meta.defaultTitle` | `t.landing.meta.defaultDescription` |
| `/landingpage/pricing` | `t.landing.pricingPage.title` | `t.landing.pricingPage.sub` |
| `/landingpage/features` | `t.landing.featuresPage.title` | `t.landing.featuresPage.sub` |
| `/landingpage/templates` | `t.landing.templatesPage.title` | `t.landing.templatesPage.sub` |
| `/landingpage/about` | `t.landing.about.title` | `t.landing.about.sub` |
| `/landingpage/contact` | `t.landing.contact.title` | `t.landing.contact.sub` |

- [ ] Every page has exactly one `<h1>` (check `.astro` templates — the page-header
      sections in `13_SUBPAGES.md` each render one; `index.astro`'s `Hero.astro` also
      renders one `<h1>` — confirm no page accidentally has two).
- [ ] `og:title`/`og:description`/`og:url` present on every route (from
      `LandingLayout.astro`, driven by the same title/description props — no extra
      work needed if step 02 was followed, just verify).

## Accessibility

- [ ] All interactive elements (nav links, buttons, form inputs) are reachable via
      keyboard `Tab` order and show a visible focus state (check this isn't
      accidentally suppressed by any `outline: none` left over from copied CSS).
- [ ] Canvas elements have `aria-hidden="true"` (already specified in every scene's
      markup in `06`, `08`, `11` — confirm it's present, since the canvases are purely
      decorative and contribute nothing to a screen reader).
- [ ] Form inputs all have associated `<label>` elements (contact form does via
      `for`/`id`; hero/footer email inputs use `placeholder` only — acceptable for a
      single-field form, but confirm each has at minimum an `aria-label` matching the
      placeholder copy if a strict accessibility pass flags it).
- [ ] Color contrast of body text against both light (`--bg-page`) and dark
      (`--landing-dark`) section backgrounds meets WCAG AA (the existing token values
      already satisfy this elsewhere in the product — just confirm nothing custom was
      introduced with an insufficient-contrast color).

## Content integrity (re-check against `01_OVERVIEW_AND_GUARDRAILS.md`)

- [ ] No numeric claim on the page (user count, revenue, order count) that isn't
      either the commission rate (10%, a real platform fact) or explicitly labeled
      "Example"/illustrative.
- [ ] No named-person testimonial anywhere — `ExampleScenarios.astro` uses generic
      personas ("Example: a candle maker"), never a fabricated named individual with a
      fabricated photo.
- [ ] No text, section headline, or visual lifted verbatim from shoptet.cz or any
      other live competitor site.

## Performance

- [ ] Run Lighthouse (Chrome DevTools → Lighthouse tab) against `/landingpage` in an
      incognito window. Target 90+ on Performance, Accessibility, Best Practices, SEO.
      If Performance is below target, the most likely cause is the three.js pixel
      ratio cap not being applied — recheck `sceneUtils.ts`.
- [ ] No layout shift from the hero canvas loading in after initial paint — confirm
      `.hero-canvas` has an explicit `position: absolute; inset: 0` (already specified
      in `06_HERO_AND_STATS.md`) so it never pushes content around as it initializes.

## What's explicitly out of scope here

- Promoting `/landingpage` to replace `website/src/pages/index.astro` as the real
  homepage — a separate decision once the founder is ready to launch publicly, not
  part of this implementation.
- A real testimonials/stats section — revisit `ExampleScenarios.astro` and
  `FoundingSellers.astro` once mamtodoma.cz has real sellers and real numbers to show.
- A full template gallery with live previews — `templates.astro` is a teaser page by
  design; the actual gallery is a future CMS feature.
- Analytics/tracking setup — not specified anywhere in this plan; add it as a
  follow-up once the founder decides on a provider.
