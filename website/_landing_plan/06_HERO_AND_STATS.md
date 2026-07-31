# 06 — Hero & Founding Sellers

## Lead-capture endpoint (build this first — Hero depends on it)

The existing `/api/newsletter/subscribe` endpoint requires a `partyId` (it's scoped to
one eshop's own newsletter) — wrong shape for a platform-level "start my store" email
capture. Add a small, separate endpoint instead, following the same Resend pattern
used in `website/src/lib/integrations/email.ts`.

📁 `website/src/pages/api/landing/lead.ts`

```ts
import type { APIRoute } from "astro";
import { Resend } from "resend";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (!email || !EMAIL_RE.test(email)) {
    return new Response(JSON.stringify({ error: "invalid_email" }), { status: 400 });
  }

  const key = import.meta.env.RESEND_API_KEY;
  if (!key) {
    return new Response(JSON.stringify({ error: "email_not_configured" }), { status: 500 });
  }
  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from: import.meta.env.EMAIL_FROM ?? "noreply@mamtodoma.cz",
    to: import.meta.env.LEADS_INBOX ?? "founders@mamtodoma.cz",
    subject: "New landing page lead",
    html: `<p>New store signup interest: ${email}</p>`,
  });
  if (error) {
    return new Response(JSON.stringify({ error: "send_failed" }), { status: 500 });
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
```

Add `LEADS_INBOX` to `.env.production`/`.env.development` alongside the existing
`RESEND_API_KEY`/`EMAIL_FROM` vars — do not hardcode a real inbox address in code.

This is intentionally the simplest possible mechanism (email the founder) — no new
Supabase table, no migration. If lead volume grows enough to need a real CRM/database
record, that's a follow-up task for the supabase-specialist agent, out of scope here.

## `Hero.astro`

📁 `website/src/components/landing/sections/Hero.astro`

```astro
---
import { useT } from "../../../lib/i18n";
const t = useT(Astro);
const h = t.landing.hero;
---

<section class="landing landing--dark hero-section" id="hero">
  <canvas id="hero-scene" class="hero-canvas" aria-hidden="true"></canvas>
  <div class="container-lg hero-inner">
    <p class="section-eyebrow">{h.eyebrow}</p>
    <h1 class="hero-title">
      {h.titleLine1} <span class="hero-highlight">{h.titleHighlight}</span> — {h.titleLine2}
    </h1>
    <p class="section-sub hero-sub">{h.sub}</p>

    <form id="hero-lead-form" class="hero-form" novalidate>
      <input type="email" name="email" required placeholder={h.formPlaceholder} class="hero-input" />
      <button type="submit" class="btn btn-primary btn-lg">{h.formCta}</button>
    </form>
    <p class="hero-note" id="hero-form-msg">{h.formNote}</p>
    <p class="hero-trust">{h.trustLine}</p>
  </div>
</section>

<script>
  import { mountFulfillmentScene } from "../three/fulfillmentScene";

  const canvas = document.getElementById("hero-scene") as HTMLCanvasElement | null;
  if (canvas) mountFulfillmentScene(canvas);

  const form = document.getElementById("hero-lead-form") as HTMLFormElement | null;
  const msg = document.getElementById("hero-form-msg");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const res = await fetch("/api/landing/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (msg) msg.textContent = res.ok ? "✓" : "…";
  });
</script>

<style>
  .hero-section { position: relative; overflow: hidden; min-height: 640px; display: flex; align-items: center; }
  .hero-canvas { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0.9; }
  .hero-inner { position: relative; z-index: 1; max-width: 720px; padding-block: 80px; }
  .hero-title { font-size: var(--display-2xl); font-weight: 800; letter-spacing: -0.02em; line-height: 1.08; margin-bottom: 20px; }
  .hero-highlight { color: var(--accent-primary); }
  .hero-sub { max-width: 560px; margin-bottom: 32px; }
  .hero-form { display: flex; gap: 10px; max-width: 440px; margin-bottom: 12px; }
  .hero-input { flex: 1; padding: 14px 16px; border-radius: var(--radius-md); border: 1.5px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.06); color: #fff; font-size: 15px; }
  .hero-input::placeholder { color: var(--landing-dark-text-muted); }
  .hero-note { font-size: 13px; color: var(--landing-dark-text-muted); margin-bottom: 24px; }
  .hero-trust { font-size: 14px; font-weight: 600; color: var(--landing-dark-text); }

  @media (max-width: 640px) {
    .hero-form { flex-direction: column; }
  }
</style>
```

`mountFulfillmentScene` is built in `11_THREEJS_SCENES.md` — if you're implementing in
order, that file comes after this one; stub it with an empty function first if you
need `pnpm dev` to run before reaching step 11, then replace the stub when you get
there.

## `FoundingSellers.astro`

📁 `website/src/components/landing/sections/FoundingSellers.astro`

```astro
---
import { useT } from "../../../lib/i18n";
const t = useT(Astro);
const s = t.landing.foundingSellers;
---

<section class="landing" id="founding-sellers">
  <div class="container-lg">
    <p class="section-eyebrow">{s.eyebrow}</p>
    <h2 class="section-title" style="max-width:760px">{s.title}</h2>
    <p class="section-sub" style="margin-bottom:48px">{s.sub}</p>

    <div class="grid-auto" data-reveal-group>
      {s.cards.map((card) => (
        <div class="card founding-card" data-reveal>
          <h3 class="founding-card-title">{card.title}</h3>
          <p class="founding-card-desc">{card.desc}</p>
        </div>
      ))}
    </div>

    <div class="founding-cta">
      <a href="#hero" class="btn btn-primary btn-lg">{s.cta}</a>
    </div>
  </div>
</section>

<style>
  .founding-card-title { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
  .founding-card-desc { color: var(--text-muted); font-size: 14px; line-height: 1.6; }
  .founding-cta { margin-top: 40px; text-align: center; }
</style>
```

`data-reveal` / `data-reveal-group` attributes are wired up by the scroll-reveal
utility built in `12_ANIMATIONS_VANILLA.md` — harmless no-ops until that script loads.
