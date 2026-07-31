# 07 — Features & How It Works

## Icons: inline SVG, no icon library dependency

No `lucide-react` (that's a React package anyway). Use small hand-written inline SVGs
— simple 24x24 stroke icons, one per feature, defined once as a lookup map inside
`Features.astro`. These are generic geometric shapes (shop bag, globe, people, box,
card, palette) — not reproductions of any specific icon set's copyrighted glyphs.

## `Features.astro`

📁 `website/src/components/landing/sections/Features.astro`

```astro
---
import { useT } from "../../../lib/i18n";
const t = useT(Astro);
const f = t.landing.features;

const icons = [
  `<path d="M4 8h16l-1.5 11a2 2 0 0 1-2 1.8H7.5a2 2 0 0 1-2-1.8L4 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>`,
  `<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>`,
  `<circle cx="9" cy="8" r="3"/><path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6"/><circle cx="18" cy="9" r="2.4"/><path d="M22 20c0-2.5-1.8-4.6-4.3-5.4"/>`,
  `<path d="M3 8 12 4l9 4-9 4-9-4Z"/><path d="M3 8v8l9 4 9-4V8"/><path d="M12 12v8"/>`,
  `<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/>`,
  `<path d="M12 3a9 9 0 1 0 9 9c0-1-1-1.5-2-1.5h-2a2 2 0 0 1-2-2v-.5a2 2 0 0 1 2-2H18"/><circle cx="7.5" cy="10.5" r="1"/><circle cx="10.5" cy="7" r="1"/>`,
];
---

<section class="landing" id="features">
  <div class="container-lg">
    <p class="section-eyebrow section-eyebrow--center">{f.eyebrow}</p>
    <h2 class="section-title section-title--center">{f.title}</h2>
    <p class="section-sub section-sub--center" style="margin-bottom:56px">{f.sub}</p>

    <div class="grid-auto" data-reveal-group>
      {f.items.map((item, i) => (
        <div class="card feature-card" data-reveal>
          <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" set:html={icons[i % icons.length]} />
          <h3 class="feature-title">{item.title}</h3>
          <p class="feature-desc">{item.desc}</p>
        </div>
      ))}
    </div>
  </div>
</section>

<style>
  .feature-icon { width: 32px; height: 32px; color: var(--accent-primary); margin-bottom: 16px; }
  .feature-title { font-size: 17px; font-weight: 700; margin-bottom: 8px; }
  .feature-desc { color: var(--text-muted); font-size: 14px; line-height: 1.6; }
</style>
```

Note `section-eyebrow--center` / `section-title--center` / `section-sub--center` reuse
the `--center` modifier defined in `03_DESIGN_SYSTEM.md`'s `landing.css` — add that
modifier there if you haven't already (it's `text-align:center; margin-inline:auto`
applied to those three classes).

## `HowItWorks.astro`

📁 `website/src/components/landing/sections/HowItWorks.astro`

```astro
---
import { useT } from "../../../lib/i18n";
const t = useT(Astro);
const h = t.landing.howItWorks;
---

<section class="landing" id="how-it-works" style="background:var(--bg-surface)">
  <div class="container-lg">
    <p class="section-eyebrow section-eyebrow--center">{h.eyebrow}</p>
    <h2 class="section-title section-title--center">{h.title}</h2>
    <p class="section-sub section-sub--center" style="margin-bottom:56px">{h.sub}</p>

    <div class="steps-row" data-reveal-group>
      {h.steps.map((step) => (
        <div class="step-card" data-reveal>
          <span class="step-number">{step.step}</span>
          <h3 class="step-title">{step.title}</h3>
          <p class="step-desc">{step.desc}</p>
        </div>
      ))}
    </div>
  </div>
</section>

<style>
  .steps-row { display: grid; gap: 32px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
  .step-card { text-align: center; padding: 8px; }
  .step-number {
    display: inline-flex; align-items: center; justify-content: center;
    width: 48px; height: 48px; border-radius: 50%;
    background: var(--accent-primary); color: #fff;
    font-weight: 800; font-size: 18px; margin-bottom: 16px;
  }
  .step-title { font-size: 17px; font-weight: 700; margin-bottom: 8px; }
  .step-desc { color: var(--text-muted); font-size: 14px; line-height: 1.6; max-width: 280px; margin-inline: auto; }
</style>
```
