# 08 — Templates Showcase & AI Capabilities

## `TemplatesShowcase.astro`

A lighter three.js scene (a slowly rotating "product card" plane with a subtle
depth-of-field feel, per `11_THREEJS_SCENES.md`'s `aiScene.ts` — reused here with a
different color accent via a constructor option) sits beside the copy instead of a
static screenshot, consistent with the "everything is 3D, nothing is a stock photo"
rule from `01_OVERVIEW_AND_GUARDRAILS.md`.

📁 `website/src/components/landing/sections/TemplatesShowcase.astro`

```astro
---
import { useT } from "../../../lib/i18n";
const t = useT(Astro);
const s = t.landing.templatesShowcase;
---

<section class="landing" id="templates" style="background:var(--bg-surface)">
  <div class="container-lg showcase-grid">
    <div>
      <p class="section-eyebrow">{s.eyebrow}</p>
      <h2 class="section-title">{s.title}</h2>
      <p class="section-sub" style="margin-bottom:32px">{s.sub}</p>
      <ul class="showcase-list">
        {s.items.map((item) => (
          <li>
            <strong>{item.title}</strong>
            <span>{item.desc}</span>
          </li>
        ))}
      </ul>
      <a href="/landingpage/templates" class="btn btn-primary" style="margin-top:24px">{s.cta}</a>
    </div>
    <div class="showcase-visual">
      <canvas id="templates-scene" class="showcase-canvas" aria-hidden="true"></canvas>
    </div>
  </div>
</section>

<script>
  import { mountAccentScene } from "../three/aiScene";
  const canvas = document.getElementById("templates-scene") as HTMLCanvasElement | null;
  if (canvas) mountAccentScene(canvas, { accent: 0x4f46e5 });
</script>

<style>
  .showcase-grid { display: grid; gap: 48px; grid-template-columns: 1.1fr 1fr; align-items: center; }
  .showcase-list { display: flex; flex-direction: column; gap: 16px; list-style: none; }
  .showcase-list li { display: flex; flex-direction: column; gap: 2px; }
  .showcase-list strong { font-size: 15px; }
  .showcase-list span { color: var(--text-muted); font-size: 14px; }
  .showcase-visual { position: relative; aspect-ratio: 1; border-radius: var(--radius-xl); overflow: hidden; background: var(--bg-subtle); }
  .showcase-canvas { width: 100%; height: 100%; display: block; }

  @media (max-width: 900px) {
    .showcase-grid { grid-template-columns: 1fr; }
  }
</style>
```

## `AICapabilities.astro`

Same visual pattern, mirrored (visual on the left), with a second `mountAccentScene`
instance using the success-green accent instead of indigo, plus the explicit
"roadmap" disclosure required by the guardrails file — items not yet live are labeled,
not silently implied as shipped.

📁 `website/src/components/landing/sections/AICapabilities.astro`

```astro
---
import { useT } from "../../../lib/i18n";
const t = useT(Astro);
const s = t.landing.aiCapabilities;
---

<section class="landing" id="ai-capabilities">
  <div class="container-lg showcase-grid showcase-grid--reverse">
    <div class="showcase-visual">
      <canvas id="ai-scene" class="showcase-canvas" aria-hidden="true"></canvas>
    </div>
    <div>
      <p class="section-eyebrow">{s.eyebrow}</p>
      <h2 class="section-title">{s.title}</h2>
      <p class="section-sub" style="margin-bottom:8px">{s.sub}</p>
      <p class="roadmap-note">{s.roadmapNote}</p>
      <ul class="showcase-list" style="margin-top:24px">
        {s.items.map((item) => (
          <li>
            <strong>{item.title}</strong>
            <span>{item.desc}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
</section>

<script>
  import { mountAccentScene } from "../three/aiScene";
  const canvas = document.getElementById("ai-scene") as HTMLCanvasElement | null;
  if (canvas) mountAccentScene(canvas, { accent: 0x10b981 });
</script>

<style>
  .showcase-grid--reverse { direction: rtl; }
  .showcase-grid--reverse > * { direction: ltr; }
  .roadmap-note { font-size: 13px; color: var(--text-placeholder); font-style: italic; }

  @media (max-width: 900px) {
    .showcase-grid--reverse { direction: ltr; }
  }
</style>
```

`showcase-grid` and `.showcase-visual`/`.showcase-canvas` classes are shared between
this file and `TemplatesShowcase.astro` — if both sections end up in the same page
(they do, on `/landingpage`), keep the CSS in each file's own scoped `<style>` (Astro
scopes styles per-component automatically, so there's no collision risk from the
duplication — this is preferable to extracting a shared partial for four rules).
