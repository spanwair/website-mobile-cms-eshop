# 10 — Final CTA, Nav & Footer

## `LandingNav.astro`

Referenced by `LandingLayout.astro` (`02_TECH_STACK_AND_FOLDER_MAP.md`) but not yet
specified — build it here. Simple sticky top nav, no auth-awareness (this page is
always anonymous), links to the subpages built in `13_SUBPAGES.md`.

📁 `website/src/components/landing/LandingNav.astro`

```astro
---
import { useT } from "../../lib/i18n";
const t = useT(Astro);
const n = t.landing.nav;
---

<header class="landing-nav">
  <div class="container-lg landing-nav-inner">
    <a href="/landingpage" class="landing-nav-brand">mamtodoma.cz</a>
    <nav class="landing-nav-links">
      <a href="/landingpage/features">{n.features}</a>
      <a href="/landingpage/pricing">{n.pricing}</a>
      <a href="/landingpage/templates">{n.templates}</a>
      <a href="/landingpage/about">{n.about}</a>
      <a href="/landingpage/contact">{n.contact}</a>
    </nav>
    <a href="/landingpage#hero" class="btn btn-primary">{n.cta}</a>
  </div>
</header>

<style>
  .landing-nav { position: sticky; top: 0; z-index: 20; background: rgba(255,255,255,0.85); backdrop-filter: blur(8px); border-bottom: 1px solid var(--border-default); }
  .landing-nav-inner { display: flex; align-items: center; justify-content: space-between; padding-block: 16px; }
  .landing-nav-brand { font-weight: 800; font-size: 18px; color: var(--text-primary); }
  .landing-nav-links { display: flex; gap: 24px; }
  .landing-nav-links a { color: var(--text-muted); font-size: 14px; font-weight: 600; }
  .landing-nav-links a:hover { color: var(--accent-primary); text-decoration: none; }

  @media (max-width: 900px) {
    .landing-nav-links { display: none; }
  }
</style>
```

## `FinalCta.astro`

📁 `website/src/components/landing/sections/FinalCta.astro`

```astro
---
import { useT } from "../../../lib/i18n";
const t = useT(Astro);
const c = t.landing.finalCta;
---

<section class="landing landing--dark" id="final-cta">
  <div class="container-lg final-cta-inner">
    <p class="section-eyebrow section-eyebrow--center">{c.eyebrow}</p>
    <h2 class="section-title section-title--center" style="max-width:640px">{c.title}</h2>
    <p class="section-sub section-sub--center" style="margin-bottom:32px">{c.sub}</p>

    <div class="final-cta-buttons">
      <a href="#hero" class="btn btn-primary btn-lg">{c.primaryCta}</a>
      <a href="/landingpage/pricing" class="btn btn-outline-light btn-lg">{c.secondaryCta}</a>
    </div>

    <div class="final-cta-badges">
      {c.badges.map((badge) => <span>{badge}</span>)}
    </div>
  </div>
</section>

<style>
  .final-cta-inner { text-align: center; }
  .final-cta-buttons { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin-bottom: 32px; }
  .final-cta-badges { display: flex; gap: 24px; justify-content: center; flex-wrap: wrap; font-size: 13px; color: var(--landing-dark-text-muted); }
</style>
```

## `LandingFooter.astro`

Mirrors Shoptet's footer *shape* (info column / links column / contact+newsletter /
legal) at a scale honest for a platform this new — no invented sub-product ecosystem
columns.

📁 `website/src/components/landing/LandingFooter.astro`

```astro
---
import { useT } from "../../lib/i18n";
const t = useT(Astro);
const f = t.landing.footer;
const year = new Date().getFullYear();
---

<footer class="landing-footer">
  <div class="container-lg footer-grid">
    <div class="footer-brand">
      <span class="landing-nav-brand">mamtodoma.cz</span>
      <p class="footer-tagline">{f.tagline}</p>
    </div>

    {Object.values(f.columns).map((col) => (
      <div class="footer-col">
        <h4>{col.title}</h4>
        <ul>
          {col.links.map((link) => (
            <li><a href={link.href}>{link.label}</a></li>
          ))}
        </ul>
      </div>
    ))}

    <div class="footer-newsletter">
      <h4>{f.newsletterTitle}</h4>
      <p class="footer-newsletter-sub">{f.newsletterSub}</p>
      <form id="footer-newsletter-form" class="footer-newsletter-form">
        <input type="email" name="email" required placeholder={f.newsletterPlaceholder} class="form-input" />
        <button type="submit" class="btn btn-primary">{f.newsletterSubmit}</button>
      </form>
    </div>
  </div>

  <div class="container-lg footer-bottom">
    <span>© {year} {f.copyright}</span>
  </div>
</footer>

<script>
  const form = document.getElementById("footer-newsletter-form") as HTMLFormElement | null;
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    await fetch("/api/landing/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    form.reset();
  });
</script>

<style>
  .landing-footer { background: var(--landing-dark, #111827); color: #9CA3AF; padding-block: 64px 32px; }
  .footer-grid { display: grid; gap: 32px; grid-template-columns: 1.4fr repeat(3, 1fr); margin-bottom: 40px; }
  .footer-tagline { font-size: 13px; margin-top: 8px; max-width: 220px; line-height: 1.6; }
  .footer-col h4, .footer-newsletter h4 { color: #fff; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }
  .footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 10px; }
  .footer-col a { color: #9CA3AF; font-size: 14px; }
  .footer-col a:hover { color: #fff; text-decoration: none; }
  .footer-newsletter-sub { font-size: 13px; margin-bottom: 12px; }
  .footer-newsletter-form { display: flex; gap: 8px; }
  .footer-bottom { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 24px; font-size: 12px; }

  @media (max-width: 900px) {
    .footer-grid { grid-template-columns: 1fr 1fr; }
  }
</style>
```

`LandingFooter.astro` reuses the same `/api/landing/lead` endpoint from
`06_HERO_AND_STATS.md` for the newsletter form — one lead-capture mechanism, two entry
points on the page. Don't build a second endpoint for this.
