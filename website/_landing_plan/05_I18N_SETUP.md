# 05 — i18n Setup

## Where keys live

`shared/i18n/locales/en.ts` is the type source (`export type Translations = typeof en`).
**Add the `landing` block to `en.ts` first**, then mirror the exact same key
structure in `cs.ts` with translated values — `cs.ts` is typed as `Translations`, so a
missing or extra key is a type error, which is the safety net that keeps the two files
in sync.

Insert the `landing: { ... }` block as a new top-level key in both files, right before
the final closing `};` (after the existing `faq: { title: ... }` block).

Every section component reads its copy via `useT(Astro).landing.<section>` — never a
hardcoded string in a `.astro` file.

## `en.ts` — add this block

```ts
  landing: {
    meta: {
      defaultTitle: "mamtodoma.cz — Launch your online store for free",
      defaultDescription:
        "Start selling online today. No monthly fees, no setup cost — we only take 10% when you make a sale. You keep 90% of everything.",
    },
    nav: {
      features: "Features",
      pricing: "Pricing",
      templates: "Templates",
      about: "About",
      contact: "Contact",
      cta: "Start for free",
    },
    hero: {
      eyebrow: "For anyone with something to sell",
      titleLine1: "Your store,",
      titleHighlight: "zero upfront cost",
      titleLine2: "we only earn when you do",
      sub:
        "Open a full online store today. No signup fee, no monthly bill — ever. We take 10% only when a sale actually happens, so you keep 90% of every order.",
      formPlaceholder: "you@example.com",
      formCta: "Start selling free",
      formNote: "No credit card. No monthly fee. Cancel anytime — there's nothing to cancel.",
      trustLine: "0 Kč to start · 0 Kč per month · 10% only when you sell",
    },
    foundingSellers: {
      eyebrow: "Founding sellers",
      title: "We're brand new. That's exactly why now is the best time.",
      sub:
        "mamtodoma.cz just launched. We're not going to pretend we have thousands of stores already — instead, here's what founding sellers get, in plain numbers.",
      cards: [
        {
          title: "0% signup fee, 0 Kč/month",
          desc: "Not a trial, not a freemium tier with a catch. The store itself is free for as long as you use it.",
        },
        {
          title: "You keep 90% of every sale",
          desc: "We only make money when you do — 10% per completed order, nothing else, nothing hidden.",
        },
        {
          title: "Live in minutes, not months",
          desc: "No agency, no developer, no waiting list. Add your first product today and start taking orders.",
        },
      ],
      cta: "Claim your store name",
    },
    features: {
      eyebrow: "Everything included",
      title: "A real e-commerce platform, not a page builder toy",
      sub: "Every feature below is already built into the platform you're standing on right now.",
      items: [
        { title: "Full storefront & CMS", desc: "Custom pages, blog, team page, FAQ, navigation and footer — all editable without touching code." },
        { title: "Your own domain", desc: "Run your store on your own domain or a free subdomain — your brand, not ours." },
        { title: "Team access with real permissions", desc: "Invite staff and give them exactly the access they need — not full admin by default." },
        { title: "Orders, inventory & returns", desc: "Stock levels, order statuses, and returns handling built in from day one." },
        { title: "Stripe-powered checkout", desc: "Secure, familiar payment flow your customers already trust." },
        { title: "Themeable design", desc: "Pick a layout and product-card style that fits your brand — no design skills required." },
      ],
    },
    howItWorks: {
      eyebrow: "Getting started",
      title: "Three steps. No plan to pick, because there's only one.",
      sub: "Unlike platforms with six pricing tiers to compare, there's exactly one way to use mamtodoma.cz.",
      steps: [
        { step: "1", title: "Create your store", desc: "Enter your email, name your store, and you're in the admin panel." },
        { step: "2", title: "Add your products", desc: "Photos, prices, stock — add one product or your whole catalog." },
        { step: "3", title: "Share your link and sell", desc: "Your storefront is live immediately. We only get paid when you do." },
      ],
    },
    templatesShowcase: {
      eyebrow: "Design",
      title: "Looks like your brand, not a template",
      sub: "Choose a layout and product presentation that matches how you sell — swap it anytime as your store grows.",
      items: [
        { title: "Layout presets", desc: "Multiple homepage and product-page layouts, built for different kinds of catalogs." },
        { title: "Product card styles", desc: "Choose how products are presented — compact grid, editorial, or gallery-first." },
        { title: "Full content control", desc: "Hero banners, footer columns, and content pages are yours to shape." },
      ],
      cta: "See how it looks",
    },
    aiCapabilities: {
      eyebrow: "Smarter every month",
      title: "Built for AI-assisted selling",
      sub: "We're actively building AI tooling into the platform — here's what's already live and what's coming next.",
      roadmapNote: "Marked items are on the near-term roadmap, not yet live — we'd rather tell you than oversell.",
      items: [
        { title: "AI product descriptions", desc: "Turn a product name and a few bullet points into a polished listing." },
        { title: "Smart pricing suggestions", desc: "Roadmap — suggested pricing based on your category and margin target." },
        { title: "AI-ready storefronts", desc: "Roadmap — structured product data so your store surfaces well in AI shopping assistants." },
      ],
    },
    commissionCalculator: {
      eyebrow: "Pricing, the short version",
      title: "One number: 10%",
      sub: "Set a sale price. See exactly what you keep. No tiers, no hidden transaction fees stacked on top.",
      sliderLabel: "Sale price",
      youKeepLabel: "You keep",
      weTakeLabel: "Our commission (10%)",
      monthlyLabel: "Monthly cost to run your store",
      exampleNote: "This is the entire pricing model. There is no second number.",
      comparisonTitle: "Why this beats a monthly plan",
      comparisonNote:
        "A €20/month plan costs you money before you've sold a single item. At 10% commission, if you sell nothing, you pay nothing — the incentive is aligned with your success from day one.",
    },
    exampleScenarios: {
      eyebrow: "Illustrative examples",
      title: "What the math looks like in practice",
      sub: "We're a new platform and don't have real seller stories to share yet — so here are honest, worked examples instead of made-up quotes.",
      disclaimer: "These are illustrative example scenarios, not real customers or verified results.",
      badgeLabel: "Example",
      scenarios: [
        { persona: "Example: a candle maker", monthly: "20,000 Kč / month in sales", keep: "18,000 Kč kept", desc: "Ten orders a week at ~500 Kč each — 2,000 Kč goes to commission, nothing else." },
        { persona: "Example: a leather-goods maker", monthly: "60,000 Kč / month in sales", keep: "54,000 Kč kept", desc: "Higher order value, same flat 10% — no tier change, no renegotiation." },
        { persona: "Example: a supplements reseller", monthly: "150,000 Kč / month in sales", keep: "135,000 Kč kept", desc: "Even at scale, the commission stays flat and predictable — budget it once." },
      ],
    },
    finalCta: {
      eyebrow: "Ready when you are",
      title: "Start your store today — it costs nothing to find out if it works",
      sub: "Create your store, add a product, and see your first order come in. If it doesn't sell, you've paid nothing.",
      primaryCta: "Create your free store",
      secondaryCta: "See pricing details",
      badges: ["0 Kč to start", "10% only on sales", "Live in minutes"],
    },
    footer: {
      tagline: "The store is free. We only win when you sell.",
      columns: {
        product: {
          title: "Product",
          links: [
            { label: "Features", href: "/landingpage/features" },
            { label: "Pricing", href: "/landingpage/pricing" },
            { label: "Templates", href: "/landingpage/templates" },
          ],
        },
        company: {
          title: "Company",
          links: [
            { label: "About", href: "/landingpage/about" },
            { label: "Contact", href: "/landingpage/contact" },
          ],
        },
        legal: {
          title: "Legal",
          links: [
            { label: "Terms", href: "/terms" },
            { label: "Privacy & Cookies", href: "/privacy" },
          ],
        },
      },
      newsletterTitle: "Get occasional e-commerce tips",
      newsletterSub: "No spam — a few emails a month at most.",
      newsletterPlaceholder: "you@example.com",
      newsletterSubmit: "Subscribe",
      copyright: "mamtodoma.cz. All rights reserved.",
    },
    pricingPage: {
      title: "Pricing",
      sub: "No monthly fees. No hidden costs. Just 10% per sale.",
      faq: [
        { q: "Is there really no monthly fee?", a: "Correct — there is no subscription, no setup fee, and no charge for an inactive store." },
        { q: "What exactly counts toward the 10%?", a: "The 10% commission applies only to completed sales processed through the store's checkout." },
        { q: "Are there any other fees?", a: "Standard Stripe payment-processing fees apply to card transactions, same as any platform using Stripe — mamtodoma.cz does not add a separate transaction fee on top." },
        { q: "Can I leave at any time?", a: "Yes — there's no contract term to break, since there was never a subscription to begin with." },
        { q: "How and when do I get paid?", a: "Payouts follow your connected Stripe account's standard payout schedule." },
      ],
    },
    featuresPage: {
      title: "Platform features",
      sub: "Everything included, at no extra cost, for every store.",
    },
    templatesPage: {
      title: "Templates & design",
      sub: "Layouts and product-card styles you can switch anytime.",
      comingSoonNote: "The full template gallery is growing — this page shows what's live today.",
    },
    about: {
      title: "Why 10%, not a monthly bill",
      sub: "The reasoning behind the model.",
      paragraphs: [
        "Most e-commerce platforms charge you before you've made a single sale. That's a real barrier for anyone just testing an idea.",
        "mamtodoma.cz flips that: we built a full store platform and only get paid a 10% commission when you do. If your store doesn't sell anything, it costs you nothing to have tried.",
        "We're a new platform, launched in 2026. We'd rather be upfront about being early than invent a track record we don't have yet.",
      ],
    },
    contact: {
      title: "Get in touch",
      sub: "Questions before you start? We read every message.",
      formName: "Name",
      formEmail: "Email",
      formMessage: "Message",
      formSubmit: "Send message",
      successMsg: "Thanks — we'll reply within one business day.",
      errorMsg: "Something went wrong. Please try again or email us directly.",
    },
  },
```

## `cs.ts` — mirrored block (same structure, Czech copy)

```ts
  landing: {
    meta: {
      defaultTitle: "mamtodoma.cz — Spusťte si e-shop zdarma",
      defaultDescription:
        "Začněte prodávat online ještě dnes. Bez měsíčních poplatků, bez vstupních nákladů — bereme si 10 % jen z uskutečněného prodeje. 90 % zůstává vám.",
    },
    nav: {
      features: "Funkce",
      pricing: "Ceník",
      templates: "Šablony",
      about: "O nás",
      contact: "Kontakt",
      cta: "Začít zdarma",
    },
    hero: {
      eyebrow: "Pro každého, kdo má co prodávat",
      titleLine1: "Váš e-shop",
      titleHighlight: "bez vstupních nákladů",
      titleLine2: "vyděláváme, jen když vyděláte vy",
      sub:
        "Spusťte si plnohodnotný e-shop ještě dnes. Žádný poplatek za založení, žádná měsíční platba — nikdy. Bereme si 10 % pouze z uskutečněného prodeje, 90 % z každé objednávky zůstává vám.",
      formPlaceholder: "vas@email.cz",
      formCta: "Začít prodávat zdarma",
      formNote: "Bez platební karty. Bez měsíčního poplatku. Není co rušit.",
      trustLine: "0 Kč na start · 0 Kč měsíčně · 10 % jen z prodeje",
    },
    foundingSellers: {
      eyebrow: "Zakládající prodejci",
      title: "Jsme úplně noví. Přesně proto je teď ten nejlepší čas začít.",
      sub:
        "mamtodoma.cz právě spustilo provoz. Nebudeme předstírat, že už máme tisíce e-shopů — místo toho vám dáme přesná čísla toho, co jako zakládající prodejce získáte.",
      cards: [
        {
          title: "0 % za založení, 0 Kč měsíčně",
          desc: "Žádná zkušební verze s háčkem. E-shop je zdarma po celou dobu, kdy ho používáte.",
        },
        {
          title: "90 % z každého prodeje zůstává vám",
          desc: "Vyděláváme jen tehdy, když vyděláte vy — 10 % z uskutečněné objednávky, nic víc, nic skrytě.",
        },
        {
          title: "Spuštěno za pár minut, ne měsíců",
          desc: "Bez agentury, bez programátora, bez čekací listiny. První produkt nahrajete a prodáváte ještě dnes.",
        },
      ],
      cta: "Zarezervujte si název e-shopu",
    },
    features: {
      eyebrow: "Vše v ceně",
      title: "Skutečná e-commerce platforma, ne hračka na tvorbu stránek",
      sub: "Každá funkce níže je už dnes součástí platformy, na které právě stojíte.",
      items: [
        { title: "Kompletní e-shop a CMS", desc: "Vlastní stránky, blog, tým, FAQ, navigace i patička — vše editovatelné bez zásahu do kódu." },
        { title: "Vlastní doména", desc: "Provozujte e-shop na vlastní doméně, nebo zdarma na subdoméně — vaše značka, ne naše." },
        { title: "Týmový přístup s reálnými oprávněními", desc: "Přizvěte kolegy a dejte jim přesně takový přístup, jaký potřebují — ne plná admin práva automaticky." },
        { title: "Objednávky, sklad a reklamace", desc: "Skladové zásoby, stavy objednávek i vyřizování reklamací už od prvního dne." },
        { title: "Platby přes Stripe", desc: "Bezpečný a důvěryhodný způsob platby, který vaši zákazníci už znají." },
        { title: "Volitelný design", desc: "Vyberte rozvržení a styl produktových karet, který sedí vaší značce — bez grafika." },
      ],
    },
    howItWorks: {
      eyebrow: "Jak začít",
      title: "Tři kroky. Žádný tarif nevybíráte, protože existuje jen jeden.",
      sub: "Na rozdíl od platforem se šesti tarify na porovnání existuje jen jeden způsob, jak mamtodoma.cz používat.",
      steps: [
        { step: "1", title: "Založte si e-shop", desc: "Zadejte e-mail, pojmenujte e-shop a jste v administraci." },
        { step: "2", title: "Nahrajte produkty", desc: "Fotky, ceny, sklad — přidejte jeden produkt nebo celý katalog." },
        { step: "3", title: "Sdílejte odkaz a prodávejte", desc: "Váš e-shop je ihned online. My vyděláváme, až vyděláte vy." },
      ],
    },
    templatesShowcase: {
      eyebrow: "Design",
      title: "Vypadá jako vaše značka, ne jako šablona",
      sub: "Vyberte rozvržení a způsob prezentace produktů podle toho, jak prodáváte — kdykoli ho můžete změnit.",
      items: [
        { title: "Přednastavená rozvržení", desc: "Několik variant úvodní i produktové stránky pro různé typy katalogů." },
        { title: "Styly produktových karet", desc: "Zvolte prezentaci produktů — kompaktní mřížka, editoriální styl, nebo galerie." },
        { title: "Plná kontrola nad obsahem", desc: "Hero bannery, sloupce v patičce i obsahové stránky jsou plně ve vašich rukou." },
      ],
      cta: "Podívejte se, jak to vypadá",
    },
    aiCapabilities: {
      eyebrow: "Chytřejší každý měsíc",
      title: "Postaveno pro prodej s pomocí AI",
      sub: "Aktivně zabudováváme AI nástroje do platformy — tady je, co už funguje, a co se chystá.",
      roadmapNote: "Označené položky jsou na blízkém plánu vývoje, zatím nejsou v provozu — raději vám to řekneme, než abychom slibovali víc, než umíme.",
      items: [
        { title: "AI popisky produktů", desc: "Z názvu produktu a pár odrážek vznikne hotový, čtivý popisek." },
        { title: "Chytré návrhy cen", desc: "Plán vývoje — návrh ceny podle kategorie a cílové marže." },
        { title: "E-shop připravený na AI vyhledávání", desc: "Plán vývoje — strukturovaná data produktů, aby se e-shop dobře zobrazoval v AI nákupních asistentech." },
      ],
    },
    commissionCalculator: {
      eyebrow: "Ceník ve zkratce",
      title: "Jedno číslo: 10 %",
      sub: "Nastavte prodejní cenu. Uvidíte přesně, kolik vám zůstane. Žádné tarify, žádné skryté transakční poplatky navrch.",
      sliderLabel: "Prodejní cena",
      youKeepLabel: "Zůstává vám",
      weTakeLabel: "Naše provize (10 %)",
      monthlyLabel: "Měsíční náklad na provoz e-shopu",
      exampleNote: "Toto je celý ceník. Žádné druhé číslo neexistuje.",
      comparisonTitle: "Proč je to lepší než měsíční tarif",
      comparisonNote:
        "Tarif za 500 Kč měsíčně vás stojí peníze dřív, než prodáte jediný kus. Při 10% provizi platíte 0 Kč, pokud nic neprodáte — zájem platformy je od prvního dne stejný jako váš.",
    },
    exampleScenarios: {
      eyebrow: "Ilustrační příklady",
      title: "Jak vypadá matematika v praxi",
      sub: "Jsme nová platforma a zatím nemáme reálné příběhy prodejců, které bychom mohli sdílet — místo toho tu jsou poctivé modelové příklady, ne vymyšlené citace.",
      disclaimer: "Jde o ilustrační modelové scénáře, ne o reálné zákazníky ani ověřené výsledky.",
      badgeLabel: "Příklad",
      scenarios: [
        { persona: "Příklad: výrobkyně svíček", monthly: "20 000 Kč měsíčního obratu", keep: "18 000 Kč zůstane", desc: "Deset objednávek týdně po ~500 Kč — 2 000 Kč jde na provizi, nic dalšího." },
        { persona: "Příklad: výrobce kožených doplňků", monthly: "60 000 Kč měsíčního obratu", keep: "54 000 Kč zůstane", desc: "Vyšší hodnota objednávky, stejných rovných 10 % — žádná změna tarifu, žádné vyjednávání." },
        { persona: "Příklad: prodejce doplňků stravy", monthly: "150 000 Kč měsíčního obratu", keep: "135 000 Kč zůstane", desc: "I ve větším objemu zůstává provize stejná a předvídatelná — spočítáte si ji jednou." },
      ],
    },
    finalCta: {
      eyebrow: "Až budete připraveni",
      title: "Založte si e-shop ještě dnes — zjistit, jestli to funguje, nic nestojí",
      sub: "Založte e-shop, přidejte produkt a sledujte první objednávku. Pokud se nic neprodá, nezaplatíte nic.",
      primaryCta: "Založit e-shop zdarma",
      secondaryCta: "Zobrazit ceník",
      badges: ["0 Kč na start", "10 % jen z prodeje", "Spuštěno za pár minut"],
    },
    footer: {
      tagline: "E-shop je zdarma. Vyděláváme, jen když vyděláte vy.",
      columns: {
        product: {
          title: "Produkt",
          links: [
            { label: "Funkce", href: "/landingpage/features" },
            { label: "Ceník", href: "/landingpage/pricing" },
            { label: "Šablony", href: "/landingpage/templates" },
          ],
        },
        company: {
          title: "Společnost",
          links: [
            { label: "O nás", href: "/landingpage/about" },
            { label: "Kontakt", href: "/landingpage/contact" },
          ],
        },
        legal: {
          title: "Právní informace",
          links: [
            { label: "Obchodní podmínky", href: "/terms" },
            { label: "Soukromí a cookies", href: "/privacy" },
          ],
        },
      },
      newsletterTitle: "Občasné tipy z e-commerce",
      newsletterSub: "Žádný spam — nejvýše pár e-mailů měsíčně.",
      newsletterPlaceholder: "vas@email.cz",
      newsletterSubmit: "Odebírat",
      copyright: "mamtodoma.cz. Všechna práva vyhrazena.",
    },
    pricingPage: {
      title: "Ceník",
      sub: "Žádné měsíční poplatky. Žádné skryté náklady. Jen 10 % z prodeje.",
      faq: [
        { q: "Opravdu neplatím nic měsíčně?", a: "Přesně tak — neexistuje předplatné, poplatek za založení ani platba za neaktivní e-shop." },
        { q: "Co přesně se počítá do těch 10 %?", a: "Provize 10 % se počítá pouze z dokončených prodejů zpracovaných přes pokladnu e-shopu." },
        { q: "Existují ještě nějaké další poplatky?", a: "Platí standardní poplatky Stripe za zpracování platby kartou, stejně jako u jakékoli platformy využívající Stripe — mamtodoma.cz si navrch neúčtuje žádný vlastní transakční poplatek." },
        { q: "Můžu kdykoli odejít?", a: "Ano — není potřeba vypovídat žádnou smlouvu, protože žádné předplatné nikdy neexistovalo." },
        { q: "Jak a kdy dostanu peníze?", a: "Výplaty se řídí standardním výplatním cyklem vašeho propojeného Stripe účtu." },
      ],
    },
    featuresPage: {
      title: "Funkce platformy",
      sub: "Vše v ceně, bez příplatku, pro každý e-shop.",
    },
    templatesPage: {
      title: "Šablony a design",
      sub: "Rozvržení a styly produktových karet, které můžete kdykoli změnit.",
      comingSoonNote: "Kompletní galerie šablon se rozrůstá — tato stránka ukazuje, co je dostupné už dnes.",
    },
    about: {
      title: "Proč 10 %, a ne měsíční paušál",
      sub: "Zdůvodnění tohoto modelu.",
      paragraphs: [
        "Většina e-commerce platforem si účtuje peníze dřív, než uskutečníte jediný prodej. To je reálná bariéra pro každého, kdo si teprve ověřuje nápad.",
        "mamtodoma.cz to obrací: postavili jsme plnohodnotnou platformu a bereme si 10% provizi jen tehdy, když vy prodáte. Pokud se v e-shopu nic neprodá, nestálo vás to nic.",
        "Jsme nová platforma, spuštěná v roce 2026. Raději jsme upřímní ohledně toho, že jsme na začátku, než abychom si vymýšleli historii, kterou zatím nemáme.",
      ],
    },
    contact: {
      title: "Ozvěte se nám",
      sub: "Máte otázky, než začnete? Čteme každou zprávu.",
      formName: "Jméno",
      formEmail: "E-mail",
      formMessage: "Zpráva",
      formSubmit: "Odeslat zprávu",
      successMsg: "Děkujeme — ozveme se do jednoho pracovního dne.",
      errorMsg: "Něco se pokazilo. Zkuste to prosím znovu, nebo nám napište přímo.",
    },
  },
```

## Verification

After adding both blocks:

```bash
cd website && pnpm typecheck
```

If `cs.ts` is missing a key present in `en.ts` (or has an extra one), this fails with a
type error naming the exact key — fix by matching the structure exactly, don't loosen
the type.
