---
title: Kompletní cesta zákazníka
description: Každý krok, který zákazník podnikne od objevení obchodu až po stanou se loajálním opakovaným kupujícím.
---

## Cesta zákazníka v 7 fázích

Každý zákazník prochází těmito fázemi. CMS má pro ně všechny funkce.

```
AWARENESS → BROWSING → CONSIDERATION → CHECKOUT → FULFILLMENT → POST-PURCHASE → RETENTION
```

---

## Fáze 1: Oznámení (Awareness)

Zákazník najde obchod přes Google, sociální média nebo z ústních doporučení.

**Co poskytujeme:**
- SEO název a popis na každém produktu (`seo_title`, `seo_description` sloupce)
- Čisté URL: `/shop/product-slug`
- Veřejné stránky produktů dostupné bez přihlášení (anon RLS politiky)

**Co udělat před spuštěním:**
- Přidat Google Search Console
- Nastavit sitemap.xml (viz [SEO průvodce](../guides/seo))
- Nastavit `seo_title` a `seo_description` na všech produktech v administraci

---

## Fáze 2: Procházení (Browsing)

Zákazník dorazí do obchodu, prochází kategorie a hledá produkty.

**Stránky:**
- `/shop` - mřížka produktů s bočním panelem kategorií, vyhledáváním, tříděním podle ceny
- `/shop?category=electronics` - filtrováno podle kategorie
- `/shop?q=laptop` - vyhledávání celého textu

**Funkce:**
- Strom kategorií s hierarchií rodič/dítě
- Třídění podle ceny: nejnovější, nejnižší, nejvyšší, nejlépe hodnocený
- Karty produktů zobrazují: obrázek, název, cenu, cenu v akci, hodnocení hvězdičkami

---

## Fáze 3: Zvažování (Consideration)

Zákazník čte detaily produktu, kontroluje recenze a přidává do seznamu přání.

**Stránka detailu produktu (`/shop/[slug]`):**
- Plná galerie obrázků s přepínáním miniatury
- Více obrázků s hlavním označením
- Varianty (velikost, barva), pokud jsou definovány
- Tagy kategorií (klikatelné, zpět na filtrovaný seznam)
- Název značky
- Hodnocení hvězdičkami s počtem
- Recenze zákazníků (jméno, hodnocení, název, text, odznak ověřeného nákupu)
- Formulář „Napsat recenzi“ (jakýkoli návštěvník, přihlášení je volitelné)
- Související produkty (stejné kategorie)
- Tlačítko „Přidat do košíku“

**Co víme o recenzích:**
- Stav: `pending` → musí být schválen administrátorem před zobrazením
- `is_verified` = true, pokud recenzent má objednávku tohoto produktu
- Souhrnné hodnocení (`rating_avg`, `review_count`) se automaticky aktualizuje spouštěčem DB

---

## Fáze 4: Pokladna (Checkout)

Zákazník zadá adresu, vybere způsob dopravy a zaplatí.

**Aktuální stav:** Tok pokladny je rámcový, ale vyžaduje klíče Stripe pro spuštění.

**Pro aktivaci plateb:**

1. Vytvořte účet Stripe na [stripe.com](https://stripe.com)
2. Zkopírujte svůj Secret Key a Webhook Secret
3. Přidejte do `.env.production`:
   ```
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
4. Nasazení webhook endpointu na `/api/stripe/webhook`
5. Registrujte URL webhooku v panelu Stripe

**Tok objednávky:**
1. Zákazník vyplní košík (`carts` + `cart_items` tabulky)
2. Klikne na „Pokladna“ → vytvořena sesí z pokladny Stripe
3. Stripe přesměruje zpět na `/shop/checkout/success?order_id=...`
4. Webhook spustí `checkout.session.completed` → stav platby objednávky je nastaven na `paid`
5. E-mail s potvrzením objednávky je odeslán přes Resend

---

## Fáze 5: Dodání (Fulfillment)

Administrátor zpracovává objednávku v CMS.

**Životní cyklus objednávky v administraci:**

| Stav | Co to znamená | Akce |
|--------|--------------|--------|
| `pending` | Objednávka přijata, platba obdržena | Prohlédnout objednávku |
| `confirmed` | Administrátor potvrdil | Začít sběr |
| `processing` | Položky jsou sbírány/baleny | Přiřadit sběratele |
| `shipped` | Balík odeslán | Zadat číslo sledování |
| `delivered` | Zákazník obdržel | Automaticky nebo ručně |
| `cancelled` | Zrušeno před odesláním | Vrácení peněz, pokud byla zaplacena |
| `refunded` | Vráceno a vráceny peníze | Podívat se na vrácení |

**Pracovní postup sběru a balení:**
1. Přejděte na `/admin/orders` → klikněte na číslo objednávky
2. Změňte stav na `confirmed`, přidejte interní poznámku
3. Vytiskněte stránku detailu objednávky jako nakladatelský list
4. Sbírejte položky ze skladu (skenujte kód čárového kódu, pokud používáte WMS)
5. Balení a označení balíku
6. Zadejte číslo sledování do detailu objednávky
7. Nastavte stav na `shipped` → zákazník obdrží e-mail s dopravou (pokud je aktivována integrace e-mailu)

---

## Fáze 6: Po nákupu (Post-Purchase)

Zákazník obdrží objednávku a volitelně ji vrátí nebo nechá recenzi.

### Psaní recenze

- Zákazník navštíví `/shop/product-slug` → posune se dolů k „Napsat recenzi“
- Vyplní jméno, e-mail, hodnocení hvězdičkami, volitelný název a text
- Recenze se dostane do stavu `pending`
- Administrátor schválí/odmítne v `/admin/reviews`
- Schválené recenze se veřejně zobrazí s hodnocením hvězdičkami

**Spouštěč e-mailu pro recenze** (zatím ruční, automatický po nastavení e-mailu):
- Po doručení odešlete e-mail `sendReviewRequest()` s odkazem na stránky produktů

### Vrácení a vrácení peněz

Zákazník chce vrátit položku:

1. Zákazník se s vámi spojí (nebo použije samoobslužný portál po jeho vytvoření)
2. Administrátor jde na `/admin/returns` → uvidí všechny žádosti o vrácení (RMA)
3. Administrátor vytvoří vrácení propojené s objednávkou a konkrétními položkami
4. Schvalte vrácení → odešlete štítek pro dopravu
5. Obdržíte položky → zkontrolujte stav
6. Nastavte `restock: true` na každé položce v dobrém stavu → skladové zásoby se automaticky obnoví
7. Nastavte řešení: `refund`, `exchange` nebo `store_credit`
8. Nastavte `completed` → `completed_at` časové razítko je automaticky nastaveno

**Pravidla pro vrácení peněz:**
- Plné vrácení peněz: pokud je položka vadná, špatná nebo neodpovídá popisu
- Částečné vrácení peněz: poškození nebo chyba zákazníka
- Kredit v obchodě: nabídnut jako alternativa k zachování prodeje
- 9 % vrácení je podvodné - zkontrolujte historii objednávky před schválením

---

## Fáze 7: Udržení (Retention)

Přeměňte jednorázové kupující do loajálních opakovaných zákazníků.

### Body lovislosti

Každý zákazník má zůstatek `loyalty_points`. Tabulka `loyalty_transactions` zaznamenává každou událost získání/využení.

**Výchozí pravidla (implementovat v administraci):**
- Získejte 1 bod za každých 10 Kč utracených
- 100 bodů = 10 Kč kredit v obchodě
- Bonusové body za napsání ověřené recenze

### Obnovení opuštěného košíku

Když košík nebyl aktualizován po 1 hodině, `abandoned_at` je automaticky nastaven.

**Sekvence e-mailů pro obnovení:**
1. **1 hodina**: Jemné připomenutí - „Zanechali jste něco za sebou“
2. **24 hodin**: Zdůraznění výhody produktu
3. **72 hodin**: Nabídka kupónu se slevou 10 %

Použijte `sendAbandonedCartRecovery()` z `website/src/lib/integrations/email.ts`.

### Snížení cen v seznamu přání

Když se cena produktu v seznamu přání zákazníka sníží:
1. Dotaz na `wishlist_items` spojený s `products`, kde je `discount_price < old_price`
2. Odeslat oznámení e-mail „Snížení ceny!“
3. Nastavit `notified_at` na položce v seznamu přání, aby se zabránilo spamování

---

## Co víme o zákaznících

Každý záznam zákazníka (`customers` tabulka) obsahuje:

| Pole | Účel |
|-------|---------|
| `first_name`, `last_name` | Personalizace e-mailů |
| `email` | Všechna komunikace |
| `phone` | SMS aktualizace dopravy |
| `addresses[]` | Doprava + fakturace |
| `is_active` | Deaktivace bez mazání |
| `marketing_opt_in` | **Požadováno GDPR** - posílat e-mail pouze pokud je true |
| `gdpr_consent` + `gdpr_consent_at` | **Právní** - zaznamenat, kdy byl souhlas udělen |
| `gdpr_consent_ip` | **Právní** - IP v době souhlasu |
| `loyalty_points` | Aktuální zůstatek |
| `customer_group` | standard / vip / wholesale / staff |
| `preferred_language` | cs / en |
| `lifetime_value` | Automaticky vypočítáno z zaplacených objednávek |
| `tags[]` | Segmentace volného tvaru |
| `notes` | Interní poznámky pouze pro personál |
| `user_id` | Propojený účet Supabase auth (pokud je registrován) |

---

## Kontrolní seznam dodržování GDPR

Před spuštěním jakýchkoli marketingových e-mailů:

- [ ] `marketing_opt_in = true` před odesláním novinek
- [ ] `gdpr_consent = true` zaznamenáno při registraci/pokladně
- [ ] `gdpr_consent_at` s časovým razítkem
- [ ] Stránka zásad ochrany osobních údajů je odkázána v pokladně a při registraci
- [ ] Banner souhlasu s cookies při prvním návštěvě
- [ ] Správa požadavku „Smažte mé údaje“ (mazání PII zákazníka + objednávky)
- [ ] Dokumentovaná politika uchování dat (doporučení: mazat neaktivní po 3 letech)
