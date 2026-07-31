# 12 — Vanilla Animations

No GSAP, no Framer Motion. `IntersectionObserver` + CSS transitions cover everything
this page needs: reveal-on-scroll and a count-up. Both respect
`prefers-reduced-motion`.

## `reveal.ts` — scroll reveal

Every section built in files `06`–`10` already emits `data-reveal` (individual
elements) and `data-reveal-group` (their container, for stagger). This script is what
makes those attributes do something — load it once, globally, from `LandingLayout.astro`.

📁 `website/src/components/landing/scripts/reveal.ts`

```ts
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function initReveal() {
  const groups = document.querySelectorAll<HTMLElement>("[data-reveal-group]");

  groups.forEach((group) => {
    const items = Array.from(group.querySelectorAll<HTMLElement>("[data-reveal]"));
    items.forEach((el, i) => {
      el.style.transitionDelay = REDUCED_MOTION ? "0ms" : `${i * 80}ms`;
    });
  });

  if (REDUCED_MOTION) {
    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
  );

  document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => observer.observe(el));
}
```

Corresponding CSS (add to `website/src/styles/landing.css`, next to the tokens from
`03_DESIGN_SYSTEM.md`):

```css
.landing [data-reveal] {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.landing [data-reveal].is-visible {
  opacity: 1;
  transform: translateY(0);
}
```

## `countUp.ts` — number count-up

Not currently used by any section in this plan (the honest stats decision in
`01_OVERVIEW_AND_GUARDRAILS.md` removed the fabricated stats block that would have
used this), but the commission calculator's live-updating numbers
(`09_PRICING_AND_SOCIAL_PROOF.md`) update instantly on slider `input`, which is
correct — a count-up animation on every slider tick would feel laggy, not premium.
Keep this utility only if a future real stats section is added once mamtodoma.cz has
real numbers; skip building it now — don't write dead code for a section that doesn't
exist.

## Wiring `initReveal()`

📁 Add to `LandingLayout.astro`, right before `</body>`:

```astro
<script>
  import { initReveal } from "./scripts/reveal";
  initReveal();
</script>
```

Astro inlines and scopes `<script>` modules automatically per page — this runs once
per navigation, which is exactly what's needed (no SPA route persistence to worry
about, this site does full page loads between routes).
