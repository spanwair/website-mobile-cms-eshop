# 09 — Commission Calculator & Example Scenarios

## `CommissionCalculator.astro`

An interactive slider (vanilla `<input type="range">` + a tiny inline script, no
framework state needed) that computes the 90/10 split live. This is the entire
pricing story — deliberately simple, one input, no tier selector.

📁 `website/src/components/landing/sections/CommissionCalculator.astro`

```astro
---
import { useT } from "../../../lib/i18n";
const t = useT(Astro);
const c = t.landing.commissionCalculator;
---

<section class="landing landing--dark" id="pricing">
  <div class="container-lg">
    <p class="section-eyebrow section-eyebrow--center">{c.eyebrow}</p>
    <h2 class="section-title section-title--center">{c.title}</h2>
    <p class="section-sub section-sub--center" style="margin-bottom:48px">{c.sub}</p>

    <div class="calc-card">
      <label class="calc-label" for="calc-input">{c.sliderLabel}</label>
      <input id="calc-input" type="range" min="100" max="10000" step="50" value="1000" class="calc-slider" />
      <div class="calc-price" id="calc-price-display">1 000 Kč</div>

      <div class="calc-split">
        <div class="calc-split-item calc-split-item--keep">
          <span class="calc-split-label">{c.youKeepLabel}</span>
          <span class="calc-split-value" id="calc-keep">900 Kč</span>
        </div>
        <div class="calc-split-item">
          <span class="calc-split-label">{c.weTakeLabel}</span>
          <span class="calc-split-value" id="calc-fee">100 Kč</span>
        </div>
        <div class="calc-split-item">
          <span class="calc-split-label">{c.monthlyLabel}</span>
          <span class="calc-split-value">0 Kč</span>
        </div>
      </div>
      <p class="calc-note">{c.exampleNote}</p>
    </div>

    <div class="calc-comparison">
      <h3 class="calc-comparison-title">{c.comparisonTitle}</h3>
      <p class="calc-comparison-note">{c.comparisonNote}</p>
    </div>
  </div>
</section>

<script>
  const input = document.getElementById("calc-input") as HTMLInputElement | null;
  const priceDisplay = document.getElementById("calc-price-display");
  const keepEl = document.getElementById("calc-keep");
  const feeEl = document.getElementById("calc-fee");

  function formatKc(n: number) {
    return `${Math.round(n).toLocaleString("cs-CZ")} Kč`;
  }

  function update() {
    if (!input) return;
    const price = Number(input.value);
    const fee = price * 0.1;
    const keep = price - fee;
    if (priceDisplay) priceDisplay.textContent = formatKc(price);
    if (keepEl) keepEl.textContent = formatKc(keep);
    if (feeEl) feeEl.textContent = formatKc(fee);
  }

  input?.addEventListener("input", update);
  update();
</script>

<style>
  .calc-card {
    max-width: 560px; margin-inline: auto; padding: 40px;
    background: var(--landing-dark-elevated); border-radius: var(--radius-xl);
    text-align: center;
  }
  .calc-label { display: block; font-size: 13px; color: var(--landing-dark-text-muted); margin-bottom: 12px; }
  .calc-slider { width: 100%; margin-bottom: 16px; accent-color: var(--accent-primary); }
  .calc-price { font-size: 40px; font-weight: 800; margin-bottom: 24px; }
  .calc-split { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1); }
  .calc-split-item { display: flex; flex-direction: column; gap: 4px; }
  .calc-split-label { font-size: 12px; color: var(--landing-dark-text-muted); }
  .calc-split-value { font-size: 20px; font-weight: 700; }
  .calc-split-item--keep .calc-split-value { color: var(--success); }
  .calc-note { margin-top: 20px; font-size: 13px; color: var(--landing-dark-text-muted); }
  .calc-comparison { max-width: 640px; margin: 56px auto 0; text-align: center; }
  .calc-comparison-title { font-size: 18px; font-weight: 700; margin-bottom: 12px; }
  .calc-comparison-note { color: var(--landing-dark-text-muted); line-height: 1.6; }

  @media (max-width: 640px) {
    .calc-split { grid-template-columns: 1fr; }
    .calc-card { padding: 28px 20px; }
  }
</style>
```

## `ExampleScenarios.astro`

The disclaimer (`disclaimer` key) renders visibly above the cards, not buried in fine
print — per `01_OVERVIEW_AND_GUARDRAILS.md`, these are illustrative, not real customer
quotes, and the page must never let a reader mistake one for the other.

📁 `website/src/components/landing/sections/ExampleScenarios.astro`

```astro
---
import { useT } from "../../../lib/i18n";
const t = useT(Astro);
const s = t.landing.exampleScenarios;
---

<section class="landing" id="examples">
  <div class="container-lg">
    <p class="section-eyebrow section-eyebrow--center">{s.eyebrow}</p>
    <h2 class="section-title section-title--center">{s.title}</h2>
    <p class="section-sub section-sub--center">{s.sub}</p>
    <p class="scenarios-disclaimer">{s.disclaimer}</p>

    <div class="grid-auto" style="margin-top:40px" data-reveal-group>
      {s.scenarios.map((scenario) => (
        <div class="card scenario-card" data-reveal>
          <span class="badge badge-pending scenario-badge">{s.badgeLabel}</span>
          <h3 class="scenario-persona">{scenario.persona}</h3>
          <div class="scenario-numbers">
            <span>{scenario.monthly}</span>
            <strong>{scenario.keep}</strong>
          </div>
          <p class="scenario-desc">{scenario.desc}</p>
        </div>
      ))}
    </div>
  </div>
</section>

<style>
  .scenarios-disclaimer {
    text-align: center; font-size: 13px; color: var(--text-placeholder);
    font-style: italic; max-width: 560px; margin: 8px auto 0;
  }
  .scenario-badge { margin-bottom: 12px; }
  .scenario-persona { font-size: 16px; font-weight: 700; margin-bottom: 12px; }
  .scenario-numbers { display: flex; flex-direction: column; gap: 2px; margin-bottom: 12px; }
  .scenario-numbers span { font-size: 13px; color: var(--text-muted); }
  .scenario-numbers strong { font-size: 22px; color: var(--success); }
  .scenario-desc { color: var(--text-muted); font-size: 14px; line-height: 1.6; }
</style>
```

`badge-pending` reuses the existing badge color variant from `global.css` purely for
its neutral indigo tone here — it has no semantic "pending" meaning in this context,
it's just a convenient existing color token for an "Example" tag.
