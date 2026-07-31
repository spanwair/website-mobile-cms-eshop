# 02 — Tech Stack & Folder Map

## Dependency change (the only one)

```bash
cd website
pnpm add three
pnpm add -D @types/three
```

Nothing else. No `@astrojs/react`, no `tailwindcss`, no `gsap`, no `framer-motion`, no
`lucide-react`. If you find yourself reaching for any of those, stop — the vanilla
equivalent is specified in a later file (icons: inline SVG; animation: IntersectionObserver
in `12_ANIMATIONS_VANILLA.md`).

## Why not React/Tailwind for this page

The rest of `website/` is plain Astro components + CSS custom properties + i18next
(confirmed: zero `.tsx`/`.jsx` files anywhere in `website/src`, zero Tailwind config).
Introducing a second UI paradigm for one route would mean two mental models, two
styling systems, and a bundle-size regression for a page whose entire job is to load
fast and convert. Astro's `.astro` files already do everything this page needs:
component composition, scoped `<style>`, `<script type="module">` for the three.js
canvases and vanilla interactivity.

## Folder map

```
website/
├── src/
│   ├── pages/
│   │   └── landingpage/
│   │       ├── _plan/                     ← this folder, never routed
│   │       ├── index.astro                → /landingpage
│   │       ├── pricing.astro              → /landingpage/pricing
│   │       ├── features.astro             → /landingpage/features
│   │       ├── templates.astro            → /landingpage/templates
│   │       ├── about.astro                → /landingpage/about
│   │       └── contact.astro              → /landingpage/contact
│   ├── pages/api/landing/
│   │   └── contact.ts                     → POST /api/landing/contact
│   ├── components/
│   │   └── landing/
│   │       ├── LandingLayout.astro        (this file, below)
│   │       ├── LandingNav.astro
│   │       ├── sections/
│   │       │   ├── Hero.astro
│   │       │   ├── FoundingSellers.astro
│   │       │   ├── Features.astro
│   │       │   ├── HowItWorks.astro
│   │       │   ├── TemplatesShowcase.astro
│   │       │   ├── AICapabilities.astro
│   │       │   ├── CommissionCalculator.astro
│   │       │   ├── ExampleScenarios.astro
│   │       │   └── FinalCta.astro
│   │       ├── LandingFooter.astro
│   │       ├── three/
│   │       │   ├── fulfillmentScene.ts
│   │       │   ├── aiScene.ts
│   │       │   └── sceneUtils.ts
│   │       └── scripts/
│   │           ├── reveal.ts
│   │           └── countUp.ts
│   └── styles/
│       └── landing.css                    (extends global.css tokens)
```

Every `.astro` file above must independently respect the 200-line cap. Section files
that grow past it split further (e.g. `Hero.astro` + a `HeroForm.astro` partial) rather
than being allowed to balloon.

## Routing table

| Route | Purpose | Plan file |
|-------|---------|-----------|
| `/landingpage` | Main landing page, all sections | `06`–`10` |
| `/landingpage/pricing` | Commission deep-dive, FAQ | `13` |
| `/landingpage/features` | Full feature list | `13` |
| `/landingpage/templates` | Template gallery teaser (full gallery is a future CMS feature, not built here) | `13` |
| `/landingpage/about` | Mission/story | `13` |
| `/landingpage/contact` | Contact form → `/api/landing/contact` | `13` |

## `LandingLayout.astro`

Do **not** reuse `website/src/components/layout/Layout.astro` — that layout is built
around a resolved `storeParty` (multi-tenant eshop context), admin-panel awareness,
cart counts, and the logged-in nav. None of that applies to an anonymous marketing
page. Build a small, dedicated layout instead:

📁 `website/src/components/landing/LandingLayout.astro`

```astro
---
import "../../styles/global.css";
import "../../styles/landing.css";
import { useT } from "../../lib/i18n";
import LandingNav from "./LandingNav.astro";
import LandingFooter from "./LandingFooter.astro";

interface Props {
  title: string;
  description: string;
}
const { title, description } = Astro.props;
const t = useT(Astro);
const canonical = new URL(Astro.url.pathname, Astro.site ?? "https://mamtodoma.cz");
---

<!doctype html>
<html lang={t.meta?.lang ?? "cs"}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" href="/favicon.png" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical.toString()} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={canonical.toString()} />
    <meta name="twitter:card" content="summary_large_image" />
  </head>
  <body class="landing">
    <LandingNav />
    <main>
      <slot />
    </main>
    <LandingFooter />
  </body>
</html>
```

Every page in `landingpage/` wraps its content in this layout, passing a page-specific
`title`/`description` (see `14_QA_SEO_DEPLOYMENT.md` for the exact copy per route).

## `astro.config.ts` — no changes needed

Confirmed current config (`website/astro.config.ts`) already runs `output: "server"`
with the Node adapter — `/landingpage/*` are ordinary SSR routes, no config change
required. Do not switch this to `output: "static"`; that would affect the whole site,
not just this folder.
