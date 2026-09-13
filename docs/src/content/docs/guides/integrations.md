---
title: Průvodce integracemi
description: Jak připojit platby Stripe, e-maily Resend a poskytovatele dopravy.
---

## Platby - Stripe

**Stav v tomto repozitáři:** Balíček `stripe` je nainstalován a obě trasy existují - `website/src/pages/api/checkout.ts` (vytváří sesíli Checkout) a `website/src/pages/api/stripe/webhook.ts` (ověřuje podpis, aktualizuje `orders.payment_status`, odesílá potvrzovací e-mail při stavu `paid`). Zbývá jen vložit vaše vlastní API klíče.

**Proč Stripe?** Dodržuje PCI DSS výchozí konfigurací při použití Stripe Checkout. Nikdy nezasahujete do surových číslic karet - Stripe hostuje platební formulář.

### 1. Vytvořte účet a najděte své klíče

1. Zaregistrujte se na [dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Každý účet Stripe má dva paralelní režimy, přepínané přepínačem v pravém horním rohu nástěnky: **Test mode** a **Live mode**. Používejte Test mode pro vše, dokud nejste připraveni přijímat skutečné platby.
3. Přejděte na **Developers → API keys** (boční panel, nebo [dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys))
4. Uvidíte dva klíče:
   - **Publishable key** (`pk_test_...`) - je bezpečné ho zveřejnit, tento šablona nepoužívá (Stripe Checkout je přesměrován na server, není potřeba klient-side Stripe.js)
   - **Secret key** (`sk_test_...`) - klikněte na **Reveal test key**, zkopírujte ho
5. Vložte tajný klíč do `.env.development`:

```env
STRIPE_SECRET_KEY=sk_test_...
```

6. Když přejdete do produkce, opakujte kroky 2-5 s přepínačem nastaveným na **Live mode** (klíče se stanou `sk_live_...`) a vložte tuto hodnotu do `.env.production`. **Nikdy nevkládejte klíč `sk_live_...` do `.env.development`.**

### 2. Získejte tajný klíč pro ověřování webhooků

Tajný klíč pro webhook je jiný pro lokální vývoj než pro produkci - každý *endpoint* webhook, který Stripe zná, má svůj vlastní tajný klíč.

**Lokální vývoj - použijte Stripe CLI, ne nástěnku:**

```bash
# Nainstalujte jednou: https://docs.stripe.com/stripe-cli
stripe login
stripe listen --forward-to localhost:4321/api/stripe/webhook
```

Tento příkaz vypíše `Ready! Your webhook signing secret is whsec_...` - zkopírujte ho do `.env.development` jako `STRIPE_WEBHOOK_SECRET`. Udržujte proces `stripe listen` spuštěný v terminálu, zatímco testujete pokladnu lokálně; přeposílá skutečné testovací události Stripe na váš vývojový server.

**Produkce - zaregistrujte endpoint v nástěnce:**

1. Stripe Dashboard → **Developers → Webhooks** → **Add endpoint**
2. URL endpointu: `https://yourdomain.cz/api/stripe/webhook`
3. Vyberte události, které chcete sledovat: `checkout.session.completed`, `checkout.session.async_payment_failed`, `charge.refunded`
4. Klikněte na vytvořený endpoint → **Signing secret** → **Reveal** → zkopírujte jako `whsec_...`
5. Vložte ho do `.env.production` jako `STRIPE_WEBHOOK_SECRET`

### 3. Už je hotovo: balíček + trasy

`stripe` je v `website/package.json`. Obě trasy již existují:

- **`website/src/pages/api/checkout.ts`** - přijímá `{ lineItems, orderId, customerId?, currency? }`, volá `createCheckoutSession()`, vrací `{ url }` pro přesměrování zákazníka.
- **`website/src/pages/api/stripe/webhook.ts`** - ověřuje hlavičku `stripe-signature` pomocí `constructWebhookEvent()`, aktualizuje `orders.payment_status` pomocí `handleWebhookEvent()` a při stavu `paid` načte objednávku/zákazníka/položky a volá `sendOrderConfirmation()`.

Trasa webhooku čte `request.text()` (ne `.json()`) - je to nutné, aby surové bajty odpovídaly tomu, co Stripe podepsal.

### Jak funguje pokladna koncovým bodem

```
Zákazník klikne na "Zaplatit"
  → POST /api/checkout vytvoří sesíli Stripe Checkout
  → Zákazník je přesměrován na stránku pro platbu hostovanou Stripe (checkoutUrl)
  → Zákazník zaplatí
  → Stripe spustí webhook na /api/stripe/webhook
  → handleWebhookEvent() nastaví orders.payment_status = 'paid'
  → Odesláno potvrzovací e-mail (vložte wire sendOrderConfirmation() do stejného handleru webhooku, jakmile budete mít k dispozici data objednávky + zákazníka)
```

### Testování

```bash
# Terminál 1
cd website && pnpm dev

# Terminál 2 - přeposílá testovací události Stripe na vaši lokální trasu webhooku
stripe listen --forward-to localhost:4321/api/stripe/webhook

# Terminál 3 - spustí falešnou událost bez procházení pokladny
stripe trigger checkout.session.completed
```

Použijte [testovací čísla karet Stripe](https://docs.stripe.com/testing#cards) (`4242 4242 4242 4242`, jakýkoli budoucí datum expirace, jakýkoli CVC) na skutečné hostované stránce pokladny.

### Poznámky k PCI souladu

Používání Stripe Checkout: úroveň **SAQ A** (nejjednodušší). Vy neseš odpovědnost za údaje o kartě - to dělá Stripe. Požadavky:
- Vždy používejte HTTPS (SSL)
- Nikdy neprotiskujte čísla karet
- Používejte hostovanou pokladnu Stripe - nikdy si nevytvářejte vlastní platební formulář

---

## Transakční e-mail - Resend

**Stav v tomto repozitáři:** `website/src/lib/integrations/email.ts` již obsahuje `sendPartyInvitation` (připojený k `/admin/parties/[id].astro`) plus `sendOrderConfirmation`, `sendShippingNotification`, `sendPasswordReset`, `sendReviewRequest`, `sendAbandonedCartRecovery` - tyto pět je napsáno, ale zatím nic je je nevolá. Pokud je `RESEND_API_KEY` neukázán, `sendPartyInvitation` loguje do konzole místo odeslání (viz `website/src/lib/integrations/email.ts:175`), takže pozvánky stále fungují v lokálním vývoji bez jakéhokoli klíče.

**Proč Resend?** Moderní, přátelský pro vývojáře, bezplatný plán je 100 e-mailů/den (3 000/měsíc). Vestavěná podpora e-mailů pro React.

### 1. Vytvořte účet a najděte svůj klíč

1. Zaregistrujte se na [resend.com](https://resend.com)
2. Přejděte na **API Keys** (boční panel) → **Create API Key**
3. Dejte mu jméno (např. `website-dev` nebo `website-prod`), oprávnění **Full access**, není nutné omezení domény na začátku
4. Zkopírujte klíč - je zobrazen **pouze jednou**, začínající na `re_...`

### 2. Sandbox režim vs. ověřená doména

Dokud neověříte doménu, váš účet je v **sandbox režimu**:
- Můžete posílat e-maily **pouze na e-mailovou adresu, kterou jste se zaregistrovali**
- `EMAIL_FROM` musí být `onboarding@resend.dev` (sdílený sandbox odesílatel Resend)

To je v pořádku pro lokální vývoj - vložte to do `.env.development`:

```env
RESEND_API_KEY=re_...
EMAIL_FROM=onboarding@resend.dev
```

### 3. Ověřte svou doménu pro produkci

1. Resend Dashboard → **Domains** → **Add Domain** → zadejte `yourdomain.cz`
2. Resend vám ukáže 3 DNS záznamy, které musíte přidat u vašeho doménového registrátora (hodnoty jsou jedinečné pro účet, zkopírujte přesně to, co Resend ukazuje - níže uvedené jsou pouze ilustrativní):

```
TXT   send.yourdomain.cz            v=spf1 include:amazonses.com ~all
CNAME resend._domainkey.yourdomain.cz   <hodnota z Resend dashboardu>
TXT   _dmarc.yourdomain.cz          v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.cz
```

3. Návratem do Resend dashboardu klikněte na **Verify DNS Records** - šíření může trvat několik minut až několik hodin
4. Jakmile je ověřeno, stav se změní na zelený a můžete posílat z jakékoli adresy `@yourdomain.cz` jakémukoli příjemci

Bez těchto DNS záznamů: e-maily buď selhávají při odesílání (mimo sandbox), nebo skončí ve spamu.

5. Vložte produkční hodnoty do `.env.production`:

```env
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.cz
PUBLIC_SHOP_URL=https://yourdomain.cz
```

### 4. Nainstalujte SDK

```bash
cd website && pnpm add resend
```

### Dostupné funkce e-mailu

| Funkce | Stav | Bod spuštění pro připojení |
|----------|--------|---------------------------|
| `sendPartyInvitation()` | ✅ připojeno | Formulář pozvánky `/admin/parties/[id].astro` |
| `sendOrderConfirmation()` | ✅ připojeno | `website/src/pages/api/stripe/webhook.ts`, po `payment_status = 'paid'` |
| `sendShippingNotification()` | napsáno, nevoláno | kamkoli se stav objednávky nastaví na `shipped` (nebohdy postaveno - viz `/admin/orders`) |
| `sendPasswordReset()` | napsáno, nevoláno | Supabase Auth již řeší reset hesla pomocí kouzelného odkazu; nutné pouze, pokud vytvoříte vlastní tok resetu |
| `sendReviewRequest()` | napsáno, nevoláno | vyžaduje plánovaný úkol (např. Supabase cron / Edge Function) spuštěný 7 dní po doručení |
| `sendAbandonedCartRecovery()` | napsáno, nevoláno | vyžaduje plánovaný úkol kontrolující košíky bez objednávky po N hodinách |

Všechny funkce jsou v `website/src/lib/integrations/email.ts`.

---

## Doprava - Český trh

Pro český e-commerce jsou nejdůležitější přepravci:

### Zásilkovna (Packeta)

Nejpopulárnější v České republice a Slovensku. Nabízí vyzvedací místa (Z-BOX), doručení domů a mezinárodní dopravu.

- Dokumentace API: [client.packeta.com/api](https://client.packeta.com/)
- Bezplatné použití, platba za zásilku
- Integrace: odešlete data zásilky přes REST API, získáte zpět číslo sledování

```typescript
// Budoucí: website/src/lib/integrations/packeta.ts
// POST https://www.zasilkovna.cz/api/rest
// Vytvoří zásilku, vrátí kód čárového kódu/sledování
```

### PPL (spřízněný s DHL)

Firemní doručení, vyžaduje podpis. Dobré pro položky s vyšší hodnotou.

### Česká pošta

Standardní česká poštovní služba. Dobrá pro malé balíčky pod 2 kg.

### ShipStation (mezinárodní)

Pokud posíláte mezinárodně, ShipStation se připojuje k více než 200 přepravcům přes jeden API.

---

## Úložiště - Kapacita obrázků

| Plán | Úložiště DB | Úložiště souborů | Měsíční výstup |
|------|-----------|-------------|---------------|
| Free | 500 MB | 1 GB | 5 GB |
| Pro ($25/měsíc) | 8 GB | 100 GB | 250 GB |

**Pravidlo palce:** Při 500 KB na obrázek produktu × 5 obrázků × 200 produktů = 500 MB. Dosáhnete limitu bezplatného úložiště přibližně u 200 produktů s 5 obrázky každý.

**Doporučení před spuštěním:**
1. Komprimujte všechny obrázky před nahráním (cíl ≤ 500 KB)
2. Používejte Supabase Image Transformations pro miniatury (úpravte na místě)
3. Upgradejte na Pro, jakmile budete mít 150+ produktů

**Aktuální košík:** `product-images` - veřejný, max 5 MB na soubor, pouze typy obrázků.

---

## Vyhledávání

Zatím: základní vyhledávání `ilike` v PostgreSQL (funguje pro malé katalogy až do cca 1000 produktů).

**Kdy upgradovat:**

U 1000+ produktů přejděte na jednu z následujících možností:

- **Supabase pg_search** - vyhledávání plného textu PostgreSQL, bezplatné, již v vaší DB
- **Algolia** - okamžité vyhledávání při psaní, bezplatný plán pro 10k záznamů
- **Typesense** - hostovaný náhrada pro Algolia, open source

---

## Analytika

**Doporučeno: Plausible Analytics**

- Šetrné k soukromí (není potřeba cookies, GDPR kompatibilní z krabice)
- 9 €/měsíc pro neomezené stránky
- Přidejte do `Layout.astro`:

```html
<script defer data-domain="yourdomain.cz" src="https://plausible.io/js/plausible.js"></script>
```

Pro Plausible není potřeba banner souhlasu (není sbíráno osobních údajů).
