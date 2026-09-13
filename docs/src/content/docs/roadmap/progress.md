---
title: Aktuální pokrok
description: Co je implementováno a funguje právě teď.
---

## Stav k 18. 07. 2026 (aktualizováno - kompletní zákaznická cesta)

### ✅ Plně funkční

#### Infrastruktura
- [x] Struktura monorepo (mobilní aplikace + web + sdílené + supabase)
- [x] Lokální nastavení Supabase s migraciemi
- [x] Nastavení dvou prostředí (vývoj + produkce)
- [x] Sdílené TypeScript typy automaticky generované ze schématu DB
- [x] Sdílená i18n (Čeština + Angličtina)
- [x] pnpm pracovní prostory

#### Autentizace
- [x] Přihlášení e-mailem + heslem
- [x] Magický odkaz (bez hesla)
- [x] Google OAuth (nastaveno)
- [x] Správa relací na serveru (SSR cookies)
- [x] Kontrola přístupu založená na rolech (Vlastník/Administrátor/EshopAdministrátor/Uživatel)
- [x] Viditelnost uživatelů na úrovni organizace (Administrátoři vidí pouze uživatele své organizace)
- [x] Systém bitmasky oprávnění pro jemné přístup k funkcím

#### Webová stránka administrátora - Všechny stránky fungují
- [x] Nástěnka s 6 kartami KPI
- [x] Organizace (organizace) - plné CRUD + správa členů
- [x] Kategorie - stromový pohled, hierarchie rodič-dítě, plné CRUD
- [x] Produkty - plné CRUD, vyhledávání, filtrování podle stavu a kategorie
- [x] Obrázky produktů - nahrávání přes Supabase Storage, nastavení primárního, smazání
- [x] **Kategorie propojené s produkty** - vícevýběrové zaškrtávací políčka v formuláři produktu
- [x] Objednávky - životní cyklus stavu, číslo sledování, odkaz na zákazníka
- [x] Zákazníci - CRUD, vyhledávání, historie objednávek
- [x] Skladové zásoby - úpravy zásob (nákup/prodej/vrácení/poškození), upozornění na nízké zásoby
- [x] Ceny - pravidla pro slevy (%), kupónové kódy s maximálním počtem použití
- [x] Uživatelé - správa rolí s řádným vynucováním hierarchie
- [x] Vlastní role - vytváření s zaškrtávacími políčky oprávnění, smazání
- [x] Oznámení - systémová oznámení, stav nepřečtené
- [x] Protokol auditu - všechny změny dat jsou zaznamenány, filtrovatelné podle tabulky

#### Testování
- [x] **149 E2E testů - 100 % úspěšných**
- [x] Skutečný prohlížeč (Playwright + Chromium), režim s GUI lokálně
- [x] Snímky obrazovky v každém kroku
- [x] Globální nastavení/demontáž ziaření
- [x] Testy pokrývají: autentizace, organizace, kategorie, produkty, objednávky, zákazníci, skladové zásoby, ceny, uživatelé, audit, nástěnka, kontrola přístupu
- [x] Testy pokrývají: kategorie na produktech (přidělení/odstranění), nahrávání obrázků (nahrání/nastavení primárního/smazání), viditelnost hierarchie uživatelů

#### Mobilní aplikace
- [x] Šablona Expo 55 / React Native 0.83
- [x] NativeWind (Tailwind pro React Native)
- [x] React Query pro získávání dat
- [x] MMKV pro šifrované lokální úložiště
- [x] Zustand pro globální stav
- [x] Ekrány autentizace (přihlášení, potvrzení)
- [x] Ekrány seznamu položek a detailu
- [x] Struktura navigace (záložky + zásobník)

#### Supabase Storage
- [x] Konfigurovaný bucket `product-images` (veřejný, limit 5MB, pouze typy obrázků)
- [x] RLS zásady (autentifikované nahrávání, veřejné čtení, autentifikované smazání)

#### Zákaznická cesta - Všechny fáze implementovány

- [x] **Veřejný obchod** - `/shop` mřížka produktů s filtrem kategorie, vyhledáváním, tříděním
- [x] **Detail produktu** - `/shop/[slug]` s galerií obrázků, variantami, recenzemi, souvisejícími produkty
- [x] **Systém recenzí** - odeslání, čeká na moderaci, administrátor schválit/odmítnout/skrýt, agregované hodnocení
- [x] **Košík** - trvalé tabulky `carts` + `cart_items`, podpora kupónů
- [x] **Seznam přání** - `wishlists` + `wishlist_items`, připraveno upozornění na pokles ceny
- [x] **Vrácení a RMA** - `return_requests` + `return_items`, administrátor `/admin/returns`, automatický spouštěč doplnění zásob
- [x] **Zbohatnutí zákazníka** - souhlas GDPR, opt-in pro marketing, body loajality, doživotní hodnota, segmenty
- [x] **Transakce loajality** - záznam o získávání/využívání/vypršení s sledováním zůstatku
- [x] **Šablona Stripe** - `website/src/lib/integrations/stripe.ts` připravená k propojení (vyžaduje API klíč)
- [x] **Šablona e-mailu** - `website/src/lib/integrations/email.ts` - 5 šablon přes Resend (vyžaduje API klíč)
- [x] **Stránka recenzí pro administrátora** - `/admin/reviews` se schválením/odmítnutím/skrytím/smazáním
- [x] **Stránka vrácení pro administrátora** - `/admin/returns` + `/admin/returns/[id]` s kompletním pracovním postupem řešení

## 🚧 Částečně hotové

- [ ] Tlačítko pro zrušení objednávky - backend to podporuje, UI tlačítko zatím ne
- [ ] Mobilní aplikace - obrazovky existují, ale nejsou připojeny k reálným datům
- [ ] Stránka reportů - náhrada, žádné grafy zatím
- [ ] Pokladna Stripe - šablona je připravena, vyžaduje klíče + endpoint `/api/checkout`
- [ ] E-maily Resend - šablona je připravena, vyžaduje klíče + propojení spouštěčů na události objednávky
- [ ] Portál pro sebeobsluhu zákazníka - stránky `/account` pro historii objednávek, adresy, seznam přání
- [ ] Job pro opuštěný košík - pole `abandoned_at` existuje, vyžaduje spouštěč cron/Edge Function

## ❌ Nezačato

- [ ] Veřejný obchod (seznam produktů, košík, pokladna)
- [ ] Integrace platb (Stripe, GoPay)
- [ ] E-mailová oznámení pro zákazníky
- [ ] Ceny pro skupiny zákazníků
- [ ] Obsah produktů v více jazycích
- [ ] Varianty produktů (velikost/barva)
- [ ] Skenování kódu čárového kódu (mobilní aplikace)
- [ ] Export do CSV (objednávky, zákazníci)
- [ ] Pipeline pro nasazení do produkce
