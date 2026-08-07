-- Org "Kytka z Beskyd" — legal/info pages + footer badges + store-visit details.
-- Drafted against current Czech consumer law (zákon č. 89/2012 Sb. občanský zákoník, zákon
-- č. 634/1992 Sb. o ochraně spotřebitele, GDPR/zákon č. 110/2019 Sb.) for an OSVČ (self-
-- employed individual) seller. The seller's IČO/DIČ are left as an explicit placeholder —
-- unlike the fictional "Repasado" demo, this org models a real individual, and inventing a
-- government registration number for a real person is not something to do without their
-- confirmation. Fill in the real IČO in this file (and re-run) once registered/confirmed,
-- and have this draft reviewed by a lawyer before real-world/production use — it is not
-- legal advice.
--
-- Idempotent: safe to re-run. Apply with:
--   psql "$DATABASE_URL" -f supabase/seed/kytka_store_legal.sql

SELECT NOT EXISTS (
  SELECT 1 FROM content_pages WHERE party_id = 'a0000000-0000-0000-0000-000000000003' AND slug = 'obchodni-podminky'
) AS should_seed \gset
\if :should_seed

\echo 'Seeding legal/info pages + footer badges for "Kytka z Beskyd"...'

UPDATE store_configs SET
  store_photo_url = 'http://127.0.0.1:54321/storage/v1/object/public/product-images/a0000000-0000-0000-0000-000000000003/venec-eukalyptus-susene-kvety.jpg'
WHERE party_id = 'a0000000-0000-0000-0000-000000000003';

-- Footer badges ------------------------------------------------------------------------------
INSERT INTO footer_badges (party_id, kind, label, icon, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000003', 'shipping', 'Česká pošta', '✉️', 1),
  ('a0000000-0000-0000-0000-000000000003', 'shipping', 'Zásilkovna', '📦', 2),
  ('a0000000-0000-0000-0000-000000000003', 'shipping', 'Osobní předání', '🤝', 3);

INSERT INTO footer_badges (party_id, kind, label, icon, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000003', 'payment', 'Bankovním převodem', '🏦', 1),
  ('a0000000-0000-0000-0000-000000000003', 'payment', 'Dobírkou', '📦', 2);

INSERT INTO footer_badges (party_id, kind, label, icon, url, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000003', 'social', 'Facebook', '📘', 'https://facebook.com/kytkazbeskyd', 1),
  ('a0000000-0000-0000-0000-000000000003', 'social', 'Instagram', '📷', 'https://instagram.com/kytkazbeskyd', 2);

INSERT INTO footer_badges (party_id, kind, label, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000003', 'store_feature', 'Výroba na zakázku', 1),
  ('a0000000-0000-0000-0000-000000000003', 'store_feature', 'Dodání do druhého dne (u vybraných kusů)', 2);

-- Legal / policy pages -------------------------------------------------------------------------
\set party_id 'a0000000-0000-0000-0000-000000000003'

INSERT INTO content_pages (party_id, slug, title, template, body, seo_title, seo_description, is_visible, show_in_footer_column, sort_order) VALUES
(
  :'party_id', 'obchodni-podminky', 'Obchodní podmínky', 'default',
  $body$## Obchodní podmínky

Těmito obchodními podmínkami se řídí prodej zboží prostřednictvím e-shopu **Kytka z Beskyd**.

**Prodávající:**

- Natálie Ruszová, OSVČ
- Místo podnikání: Hrádek, okres Frýdek-Místek
- IČO: *bude doplněno*
- Telefon: +420 605 157 739
- Prodávající je neplátce DPH.

### 1. Uzavření kupní smlouvy

Objednávku je možné učinit telefonicky, e-mailem nebo přes kontaktní formulář. Vzhledem k tomu,
že většina produktů je vyráběna ručně na zakázku, je smlouva uzavřena až potvrzením termínu a
ceny prodávající stranou, nikoli okamžikem odeslání poptávky.

### 2. Cena a platba

Ceny u jednotlivých produktů jsou orientační podle velikosti; konečná cena se odvíjí od
zvolených materiálů a rozsahu práce a je vždy potvrzena před závaznou objednávkou. Platba
probíhá bankovním převodem nebo dobírkou dle domluvy.

### 3. Dodání

Standardní doba výroby je 7–14 dní od potvrzení objednávky. U vybraných produktů je možné
dodání do druhého dne po individuální domluvě.

### 4. Odstoupení od smlouvy

Je-li kupující spotřebitelem, má právo odstoupit od smlouvy do 14 dnů od převzetí zboží bez
udání důvodu (§ 1829 občanského zákoníku). Toto právo se neuplatní u zboží upraveného podle
přání spotřebitele nebo pro jeho osobu (§ 1837 písm. d) — což se týká většiny produktů
vyráběných na míru; rozsah výjimky bude u konkrétní objednávky upřesněn předem.

### 5. Práva z vadného plnění (reklamace)

Prodávající odpovídá za vady zboží podle § 2161 a násl. občanského zákoníku. Reklamaci lze
uplatnit telefonicky nebo e-mailem s popisem vady a fotodokumentací.

*Tento text je vzorovým návrhem a před ostrým nasazením e-shopu doporučujeme právní kontrolu.*$body$,
  'Obchodní podmínky | Kytka z Beskyd',
  'Obchodní podmínky e-shopu Kytka z Beskyd — objednávky na zakázku, platba, dodání a odstoupení od smlouvy.',
  true, 'information', 10
),
(
  :'party_id', 'ochrana-osobnich-udaju', 'Ochrana osobních údajů', 'default',
  $body$## Ochrana osobních údajů

Správcem osobních údajů zpracovávaných v souvislosti s objednávkami je Natálie Ruszová, OSVČ
(„**Kytka z Beskyd**").

### Jaké údaje zpracováváme

Jméno, kontaktní telefon/e-mail, doručovací adresa a obsah objednávky — v rozsahu nutném pro
vyřízení a doručení zakázky.

### Účel a doba zpracování

Údaje zpracováváme za účelem plnění kupní smlouvy a po dobu vyžadovanou daňovými a účetními
předpisy. Bez samostatného souhlasu údaje nepoužíváme k marketingovým účelům.

### Příjemci údajů

Údaje nutné k doručení předáváme zvolenému přepravci (Česká pošta, Zásilkovna). Technické
zpracování dat zajišťuje Supabase (databáze, hosting).

### Vaše práva

Máte právo na přístup ke svým údajům, jejich opravu, výmaz (není-li v rozporu s právní
povinností je uchovat) a na podání stížnosti u Úřadu pro ochranu osobních údajů.

*Tento text je vzorovým návrhem a před ostrým nasazením e-shopu doporučujeme právní kontrolu.*$body$,
  'Ochrana osobních údajů | Kytka z Beskyd',
  'Zásady zpracování osobních údajů e-shopu Kytka z Beskyd.',
  true, 'information', 11
),
(
  :'party_id', 'cookies', 'Zásady používání cookies', 'default',
  '## Zásady používání cookies' || E'\n\n' ||
  'Web používá pouze technické cookies nezbytné pro provoz e-shopu (např. obsah košíku). ' ||
  'Analytické ani marketingové cookies nejsou bez souhlasu používány.',
  'Zásady cookies | Kytka z Beskyd', 'Jaké cookies web Kytka z Beskyd používá a proč.',
  true, 'information', 12
),
(
  :'party_id', 'vraceni-zbozi', 'Vrácení zboží a odstoupení od smlouvy', 'default',
  '## Vrácení zboží' || E'\n\n' ||
  'U hotových (neupravovaných) produktů máte právo odstoupit od smlouvy do 14 dnů od převzetí ' ||
  'bez udání důvodu. U produktů vyráběných na míru (většina zakázek) se toto právo podle § 1837 ' ||
  'písm. d) občanského zákoníku neuplatní — rozsah bude u konkrétní objednávky upřesněn předem.',
  'Vrácení zboží | Kytka z Beskyd', 'Podmínky vrácení zboží a odstoupení od smlouvy.',
  true, 'information', 13
),
(
  :'party_id', 'reklamace', 'Reklamační řád', 'default',
  '## Reklamační řád' || E'\n\n' ||
  'Reklamaci vad zboží uplatňujte telefonicky na +420 605 157 739 nebo přes kontaktní formulář, ' ||
  'ideálně s fotodokumentací vady. Reklamace bude vyřízena bez zbytečného odkladu, nejpozději ' ||
  'do 30 dnů.',
  'Reklamační řád | Kytka z Beskyd', 'Jak probíhá reklamace u e-shopu Kytka z Beskyd.',
  true, 'information', 14
),
(
  :'party_id', 'platba-a-doprava', 'Platba a doprava', 'default',
  '## Platba a doprava' || E'\n\n' ||
  '**Platba:** bankovním převodem předem, nebo dobírkou.' || E'\n\n' ||
  '**Doprava:** Česká pošta, Zásilkovna, nebo osobní předání po domluvě v okolí Hrádku ' ||
  '(okres Frýdek-Místek).' || E'\n\n' ||
  'Přesná cena dopravy se odvíjí od velikosti zásilky a je potvrzena spolu s objednávkou.',
  'Platba a doprava | Kytka z Beskyd', 'Možnosti platby a doručení u e-shopu Kytka z Beskyd.',
  true, 'information', 15
);

\echo 'Legal/info pages + footer badges seeded for "Kytka z Beskyd".'
\else
\echo 'Legal/info pages already exist for "Kytka z Beskyd" — skipping.'
\endif
