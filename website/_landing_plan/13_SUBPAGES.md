# 13 — Page Assembly & Subpages

## `/landingpage` — `index.astro`

Assembles every section from files `06`–`10`, in the exact order specified in
`04_CONTENT_ARCHITECTURE.md`.

📁 `website/src/pages/landingpage/index.astro`

```astro
---
import LandingLayout from "../../components/landing/LandingLayout.astro";
import Hero from "../../components/landing/sections/Hero.astro";
import FoundingSellers from "../../components/landing/sections/FoundingSellers.astro";
import Features from "../../components/landing/sections/Features.astro";
import HowItWorks from "../../components/landing/sections/HowItWorks.astro";
import TemplatesShowcase from "../../components/landing/sections/TemplatesShowcase.astro";
import AICapabilities from "../../components/landing/sections/AICapabilities.astro";
import CommissionCalculator from "../../components/landing/sections/CommissionCalculator.astro";
import ExampleScenarios from "../../components/landing/sections/ExampleScenarios.astro";
import FinalCta from "../../components/landing/sections/FinalCta.astro";
import { useT } from "../../lib/i18n";

const t = useT(Astro);
---

<LandingLayout title={t.landing.meta.defaultTitle} description={t.landing.meta.defaultDescription}>
  <Hero />
  <FoundingSellers />
  <Features />
  <HowItWorks />
  <TemplatesShowcase />
  <AICapabilities />
  <CommissionCalculator />
  <ExampleScenarios />
  <FinalCta />
</LandingLayout>
```

## `/landingpage/pricing`

📁 `website/src/pages/landingpage/pricing.astro`

```astro
---
import LandingLayout from "../../components/landing/LandingLayout.astro";
import CommissionCalculator from "../../components/landing/sections/CommissionCalculator.astro";
import FinalCta from "../../components/landing/sections/FinalCta.astro";
import { useT } from "../../lib/i18n";

const t = useT(Astro);
const p = t.landing.pricingPage;
---

<LandingLayout title={`${p.title} — mamtodoma.cz`} description={p.sub}>
  <section class="landing" style="padding-bottom:0">
    <div class="container-lg">
      <h1 class="section-title section-title--center">{p.title}</h1>
      <p class="section-sub section-sub--center">{p.sub}</p>
    </div>
  </section>
  <CommissionCalculator />
  <section class="landing" id="faq">
    <div class="container-lg faq-list">
      {p.faq.map((item) => (
        <details class="faq-item">
          <summary>{item.q}</summary>
          <p>{item.a}</p>
        </details>
      ))}
    </div>
  </section>
  <FinalCta />
</LandingLayout>

<style>
  .faq-list { max-width: 720px; margin-inline: auto; display: flex; flex-direction: column; gap: 12px; }
  .faq-item { border: 1px solid var(--border-default); border-radius: var(--radius-md); padding: 16px 20px; }
  .faq-item summary { cursor: pointer; font-weight: 700; }
  .faq-item p { margin-top: 12px; color: var(--text-muted); line-height: 1.6; }
</style>
```

## `/landingpage/features`

📁 `website/src/pages/landingpage/features.astro`

```astro
---
import LandingLayout from "../../components/landing/LandingLayout.astro";
import Features from "../../components/landing/sections/Features.astro";
import AICapabilities from "../../components/landing/sections/AICapabilities.astro";
import FinalCta from "../../components/landing/sections/FinalCta.astro";
import { useT } from "../../lib/i18n";

const t = useT(Astro);
const f = t.landing.featuresPage;
---

<LandingLayout title={`${f.title} — mamtodoma.cz`} description={f.sub}>
  <section class="landing" style="padding-bottom:0">
    <div class="container-lg">
      <h1 class="section-title section-title--center">{f.title}</h1>
      <p class="section-sub section-sub--center">{f.sub}</p>
    </div>
  </section>
  <Features />
  <AICapabilities />
  <FinalCta />
</LandingLayout>
```

## `/landingpage/templates`

📁 `website/src/pages/landingpage/templates.astro`

```astro
---
import LandingLayout from "../../components/landing/LandingLayout.astro";
import TemplatesShowcase from "../../components/landing/sections/TemplatesShowcase.astro";
import FinalCta from "../../components/landing/sections/FinalCta.astro";
import { useT } from "../../lib/i18n";

const t = useT(Astro);
const p = t.landing.templatesPage;
---

<LandingLayout title={`${p.title} — mamtodoma.cz`} description={p.sub}>
  <section class="landing" style="padding-bottom:0">
    <div class="container-lg">
      <h1 class="section-title section-title--center">{p.title}</h1>
      <p class="section-sub section-sub--center">{p.sub}</p>
      <p class="section-sub section-sub--center" style="font-style:italic;font-size:13px">{p.comingSoonNote}</p>
    </div>
  </section>
  <TemplatesShowcase />
  <FinalCta />
</LandingLayout>
```

## `/landingpage/about`

📁 `website/src/pages/landingpage/about.astro`

```astro
---
import LandingLayout from "../../components/landing/LandingLayout.astro";
import FinalCta from "../../components/landing/sections/FinalCta.astro";
import { useT } from "../../lib/i18n";

const t = useT(Astro);
const a = t.landing.about;
---

<LandingLayout title={`${a.title} — mamtodoma.cz`} description={a.sub}>
  <section class="landing">
    <div class="container-lg about-content">
      <h1 class="section-title section-title--center">{a.title}</h1>
      <p class="section-sub section-sub--center" style="margin-bottom:40px">{a.sub}</p>
      {a.paragraphs.map((p) => <p class="about-paragraph">{p}</p>)}
    </div>
  </section>
  <FinalCta />
</LandingLayout>

<style>
  .about-content { max-width: 680px; margin-inline: auto; }
  .about-paragraph { color: var(--text-muted); line-height: 1.7; margin-bottom: 20px; font-size: 16px; }
</style>
```

## `/landingpage/contact`

The contact form needs its own endpoint (distinct from `/api/landing/lead` — this one
carries a name + free-text message, not just an email for later outreach).

📁 `website/src/pages/api/landing/contact.ts`

```ts
import type { APIRoute } from "astro";
import { Resend } from "resend";
import sanitizeHtml from "sanitize-html";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 200) : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim().slice(0, 5000) : "";

  if (!name || !email || !EMAIL_RE.test(email) || !message) {
    return new Response(JSON.stringify({ error: "invalid_input" }), { status: 400 });
  }

  const key = import.meta.env.RESEND_API_KEY;
  if (!key) {
    return new Response(JSON.stringify({ error: "email_not_configured" }), { status: 500 });
  }
  const resend = new Resend(key);
  const safeMessage = sanitizeHtml(message, { allowedTags: [], allowedAttributes: {} });
  const { error } = await resend.emails.send({
    from: import.meta.env.EMAIL_FROM ?? "noreply@mamtodoma.cz",
    to: import.meta.env.LEADS_INBOX ?? "founders@mamtodoma.cz",
    replyTo: email,
    subject: `Contact form: ${name}`,
    html: `<p><strong>${sanitizeHtml(name, { allowedTags: [], allowedAttributes: {} })}</strong> (${email})</p><p>${safeMessage.replace(/\n/g, "<br/>")}</p>`,
  });
  if (error) {
    return new Response(JSON.stringify({ error: "send_failed" }), { status: 500 });
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
```

`sanitize-html` is already a dependency (used elsewhere in the codebase for rendered
content) — reused here rather than trusting raw form input inside an HTML email body.

📁 `website/src/pages/landingpage/contact.astro`

```astro
---
import LandingLayout from "../../components/landing/LandingLayout.astro";
import { useT } from "../../lib/i18n";

const t = useT(Astro);
const c = t.landing.contact;
---

<LandingLayout title={`${c.title} — mamtodoma.cz`} description={c.sub}>
  <section class="landing">
    <div class="container-lg contact-content">
      <h1 class="section-title section-title--center">{c.title}</h1>
      <p class="section-sub section-sub--center" style="margin-bottom:40px">{c.sub}</p>

      <form id="contact-form" class="contact-form">
        <div class="form-group">
          <label class="form-label" for="contact-name">{c.formName}</label>
          <input id="contact-name" name="name" class="form-input" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="contact-email">{c.formEmail}</label>
          <input id="contact-email" name="email" type="email" class="form-input" required />
        </div>
        <div class="form-group">
          <label class="form-label" for="contact-message">{c.formMessage}</label>
          <textarea id="contact-message" name="message" class="form-input" rows="5" required></textarea>
        </div>
        <button type="submit" class="btn btn-primary btn-lg">{c.formSubmit}</button>
        <p id="contact-msg" class="contact-msg"></p>
      </form>
    </div>
  </section>
</LandingLayout>

<script define:vars={{ successMsg: c.successMsg, errorMsg: c.errorMsg }}>
  const form = document.getElementById("contact-form");
  const msg = document.getElementById("contact-msg");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const res = await fetch("/api/landing/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (msg) {
      msg.textContent = res.ok ? successMsg : errorMsg;
      if (res.ok) form.reset();
    }
  });
</script>

<style>
  .contact-content { max-width: 560px; margin-inline: auto; }
  .contact-form { display: flex; flex-direction: column; gap: 20px; }
  .contact-msg { font-size: 14px; color: var(--text-muted); min-height: 18px; }
</style>
```

`define:vars` passes the translated success/error strings into the plain `<script>`
tag (not `type="module"` here since there's no import needed) — this keeps the
user-facing message localized without a second network round-trip to fetch it.
