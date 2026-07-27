-- Demo org "Repasado" — legal/info pages, footer badges (shipping/payment/social/store
-- features), and store-visit details. All copy below is original writing for this fictional
-- company; it is not copied from any real business's terms, policies, or marketing text.
--
-- Idempotent: safe to re-run. Apply with:
--   psql "$DATABASE_URL" -f supabase/seed/demo_store_legal_footer.sql

SELECT NOT EXISTS (
  SELECT 1 FROM content_pages WHERE party_id = 'a0000000-0000-0000-0000-000000000001' AND slug = 'obchodni-podminky'
) AS should_seed \gset
\if :should_seed

\echo 'Seeding legal/info pages + footer badges for "Repasado"...'

UPDATE store_configs SET
  store_address = 'Karlova 15, 110 00 Praha 1',
  store_map_url = 'https://www.google.com/maps/search/?api=1&query=Karlova+15+Praha+1',
  store_photo_url = '/demo-media/prodejna-repasado.svg'
WHERE party_id = 'a0000000-0000-0000-0000-000000000001';

-- Footer badges ------------------------------------------------------------------------------
INSERT INTO footer_badges (party_id, kind, label, icon, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'shipping', 'Zásilkovna', '📦', 1),
  ('a0000000-0000-0000-0000-000000000001', 'shipping', 'PPL', '🚚', 2),
  ('a0000000-0000-0000-0000-000000000001', 'shipping', 'GLS', '🚚', 3),
  ('a0000000-0000-0000-0000-000000000001', 'shipping', 'Česká pošta', '✉️', 4),
  ('a0000000-0000-0000-0000-000000000001', 'shipping', 'Osobní odběr', '🏬', 5);

INSERT INTO footer_badges (party_id, kind, label, icon, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'payment', 'Visa', '💳', 1),
  ('a0000000-0000-0000-0000-000000000001', 'payment', 'Mastercard', '💳', 2),
  ('a0000000-0000-0000-0000-000000000001', 'payment', 'Google Pay', '📱', 3),
  ('a0000000-0000-0000-0000-000000000001', 'payment', 'Apple Pay', '📱', 4),
  ('a0000000-0000-0000-0000-000000000001', 'payment', 'Dobírkou', '📦', 5),
  ('a0000000-0000-0000-0000-000000000001', 'payment', 'Bankovním převodem', '🏦', 6),
  ('a0000000-0000-0000-0000-000000000001', 'payment', 'Splátky Home Credit', '🏛️', 7);

INSERT INTO footer_badges (party_id, kind, label, icon, url, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'social', 'Facebook', '📘', 'https://facebook.com', 1),
  ('a0000000-0000-0000-0000-000000000001', 'social', 'Instagram', '📷', 'https://instagram.com', 2),
  ('a0000000-0000-0000-0000-000000000001', 'social', 'TikTok', '🎵', 'https://tiktok.com', 3),
  ('a0000000-0000-0000-0000-000000000001', 'social', 'YouTube', '▶️', 'https://youtube.com', 4);

INSERT INTO footer_badges (party_id, kind, label, sort_order) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'store_feature', 'Osobní odběr e-shopu', 1),
  ('a0000000-0000-0000-0000-000000000001', 'store_feature', 'Výkup zařízení', 2),
  ('a0000000-0000-0000-0000-000000000001', 'store_feature', 'Platba kartou', 3),
  ('a0000000-0000-0000-0000-000000000001', 'store_feature', 'Servis a reklamace', 4);

-- Legal / policy pages -------------------------------------------------------------------------
INSERT INTO content_pages (party_id, slug, title, template, body, show_in_footer_column, sort_order) VALUES
(
  'a0000000-0000-0000-0000-000000000001', 'obchodni-podminky', 'Obchodní podmínky', 'default',
  '## Obchodní podmínky' || E'\n\n' ||
  'Tyto obchodní podmínky upravují vztahy mezi společností Repasado s.r.o. (dále jen "prodávající") ' ||
  'a zákazníky internetového obchodu repasado.cz (dále jen "kupující").' || E'\n\n' ||
  '### 1. Uzavření kupní smlouvy' || E'\n\n' ||
  'Kupní smlouva vzniká odesláním objednávky kupujícím a jejím potvrzením ze strany prodávajícího. ' ||
  'Prodávající si vyhrazuje právo objednávku odmítnout, pokud zboží není skladem nebo pokud údaje ' ||
  'uvedené v objednávce vzbuzují pochybnost o skutečném úmyslu kupujícího zboží objednat.' || E'\n\n' ||
  '### 2. Cena a platební podmínky' || E'\n\n' ||
  'Všechny ceny jsou uvedeny včetně DPH. Platbu lze provést bankovním převodem, platební kartou online, ' ||
  'na dobírku nebo formou splátek přes Home Credit. Zboží zůstává majetkem prodávajícího až do ' ||
  'úplného zaplacení kupní ceny.' || E'\n\n' ||
  '### 3. Dodání zboží' || E'\n\n' ||
  'Zboží dodáváme prostřednictvím Zásilkovny, PPL, GLS nebo České pošty, případně formou osobního ' ||
  'odběru na naší prodejně v Praze. Dodací lhůta činí obvykle 1-3 pracovní dny od potvrzení objednávky.' || E'\n\n' ||
  '### 4. Odstoupení od smlouvy' || E'\n\n' ||
  'Informace o právu na odstoupení od smlouvy do 14 dnů najdete na samostatné stránce ' ||
  '"Vrácení zboží a odstoupení od smlouvy".' || E'\n\n' ||
  '### 5. Odpovědnost za vady a záruka' || E'\n\n' ||
  'Podrobnosti o záruce a reklamačním řízení upravuje náš Reklamační řád.' || E'\n\n' ||
  '### 6. Ochrana osobních údajů' || E'\n\n' ||
  'Zpracování osobních údajů se řídí samostatným dokumentem "Ochrana osobních údajů".' || E'\n\n' ||
  '### 7. Závěrečná ustanovení' || E'\n\n' ||
  'Tyto obchodní podmínky nabývají účinnosti dnem jejich zveřejnění na webových stránkách repasado.cz. ' ||
  'Prodávající si vyhrazuje právo podmínky v přiměřeném rozsahu měnit.',
  'information', 1
),
(
  'a0000000-0000-0000-0000-000000000001', 'ochrana-osobnich-udaju', 'Ochrana osobních údajů', 'default',
  '## Ochrana osobních údajů' || E'\n\n' ||
  'Společnost Repasado s.r.o. zpracovává osobní údaje zákazníků v souladu s nařízením GDPR a ' ||
  'zákonem o zpracování osobních údajů.' || E'\n\n' ||
  '### Jaké údaje zpracováváme' || E'\n\n' ||
  'Jméno a příjmení, doručovací a fakturační adresu, e-mail, telefonní číslo a údaje o objednávkách. ' ||
  'Tyto údaje potřebujeme k vyřízení objednávky, komunikaci se zákazníkem a plnění zákonných povinností.' || E'\n\n' ||
  '### Doba uchování' || E'\n\n' ||
  'Osobní údaje uchováváme po dobu nezbytnou k vyřízení objednávky a po dobu vyžadovanou účetními ' ||
  'a daňovými předpisy (obvykle 10 let od vystavení dokladu).' || E'\n\n' ||
  '### Předávání třetím stranám' || E'\n\n' ||
  'Údaje předáváme pouze dopravcům (Zásilkovna, PPL, GLS, Česká pošta) a platebním bránám v rozsahu ' ||
  'nezbytném pro doručení zásilky a zpracování platby. Údaje nikdy neprodáváme třetím stranám za ' ||
  'marketingovými účely bez vašeho souhlasu.' || E'\n\n' ||
  '### Vaše práva' || E'\n\n' ||
  'Máte právo na přístup ke svým údajům, jejich opravu, výmaz, omezení zpracování a přenositelnost. ' ||
  'Svá práva můžete uplatnit na e-mailu podpora@repasado.cz.' || E'\n\n' ||
  '### Newsletter' || E'\n\n' ||
  'E-mail zadaný do newsletteru používáme výhradně k zasílání obchodních sdělení. Z odběru se ' ||
  'můžete kdykoliv odhlásit prostřednictvím odkazu v každém e-mailu.',
  'purchase_info', 8
),
(
  'a0000000-0000-0000-0000-000000000001', 'cookies', 'Zásady používání cookies', 'default',
  '## Zásady používání cookies' || E'\n\n' ||
  'Náš web používá soubory cookie ke zlepšení funkčnosti, analýze návštěvnosti a personalizaci obsahu.' || E'\n\n' ||
  '### Nezbytné cookies' || E'\n\n' ||
  'Zajišťují základní funkčnost webu (přihlášení, obsah košíku) a nelze je vypnout.' || E'\n\n' ||
  '### Analytické cookies' || E'\n\n' ||
  'Pomáhají nám pochopit, jak návštěvníci web používají, abychom mohli zlepšovat jeho obsah a funkce.' || E'\n\n' ||
  '### Marketingové cookies' || E'\n\n' ||
  'Používáme je k zobrazování relevantní reklamy na jiných webech. Tyto cookies můžete kdykoliv ' ||
  'odmítnout v nastavení souhlasu, aniž by to ovlivnilo základní funkčnost webu.',
  'purchase_info', 9
),
(
  'a0000000-0000-0000-0000-000000000001', 'vraceni-zbozi', 'Vrácení zboží a odstoupení od smlouvy', 'default',
  '## Vrácení zboží a odstoupení od smlouvy' || E'\n\n' ||
  'Jako spotřebitel máte právo odstoupit od kupní smlouvy uzavřené na dálku do **14 dnů** od ' ||
  'převzetí zboží, a to bez udání důvodu.' || E'\n\n' ||
  '### Jak zboží vrátit' || E'\n\n' ||
  '1. Napište nám na podpora@repasado.cz nebo použijte formulář pro odstoupení od smlouvy.' || E'\n' ||
  '2. Zboží zabalte tak, aby nedošlo k jeho poškození při přepravě, pokud možno v původním obalu.' || E'\n' ||
  '3. Zašlete zboží na adresu naší prodejny nebo jej přineste osobně.' || E'\n' ||
  '4. Peníze vrátíme na váš účet do 14 dnů od obdržení vráceného zboží, stejným způsobem, jakým jste platili.' || E'\n\n' ||
  '### Podmínky vrácení' || E'\n\n' ||
  'Zboží by mělo být vráceno kompletní, s veškerým příslušenstvím a bez známek nadměrného opotřebení ' ||
  'nad rámec běžného vyzkoušení. Náklady na vrácení zboží hradí kupující, pokud není dohodnuto jinak.' || E'\n\n' ||
  '### Výjimky z práva na odstoupení' || E'\n\n' ||
  'Právo na odstoupení se nevztahuje na zboží upravené na přání zákazníka nebo na zboží, které bylo ' ||
  'po dodání nenávratně smícháno s jiným zbožím.',
  'purchase_info', 2
),
(
  'a0000000-0000-0000-0000-000000000001', 'reklamace', 'Reklamační řád', 'default',
  '## Reklamační řád' || E'\n\n' ||
  'Na veškeré repasované zboží poskytujeme zákonnou záruku v délce **24 měsíců** od převzetí zboží, ' ||
  'pokud u konkrétního produktu není uvedeno jinak.' || E'\n\n' ||
  '### Jak reklamaci uplatnit' || E'\n\n' ||
  '1. Kontaktujte nás na podpora@repasado.cz nebo telefonicky a popište vadu zboží.' || E'\n' ||
  '2. Zboží zašlete na adresu prodejny spolu s dokladem o koupi a popisem závady, nebo jej přineste osobně.' || E'\n' ||
  '3. O výsledku reklamace vás informujeme do 3 pracovních dnů, reklamaci vyřídíme nejpozději do 30 dnů.' || E'\n\n' ||
  '### Co záruka pokrývá' || E'\n\n' ||
  'Záruka se vztahuje na funkční vady zařízení, které nebyly způsobeny neodborným zacházením, pádem, ' ||
  'vniknutím kapaliny nebo neautorizovaným zásahem do zařízení. Přirozené opotřebení baterie pod ' ||
  'garantovanou kapacitu (80 %) je řešeno v rámci záruky na baterii.' || E'\n\n' ||
  '### Způsob vyřízení' || E'\n\n' ||
  'V závislosti na povaze vady zboží opravíme, vyměníme za kus ve stejném nebo lepším stavu, ' ||
  'nebo vám vrátíme peníze.',
  'information', 5
),
(
  'a0000000-0000-0000-0000-000000000001', 'platba-a-doprava', 'Platba a doprava', 'default',
  '## Platba a doprava' || E'\n\n' ||
  '### Způsoby dopravy' || E'\n\n' ||
  '- **Zásilkovna** — doručení na výdejní místo nebo do Z-boxu, obvykle do 1-2 pracovních dnů' || E'\n' ||
  '- **PPL** — doručení až domů, s možností sledování zásilky' || E'\n' ||
  '- **GLS** — doručení až domů nebo na GLS ParcelShop' || E'\n' ||
  '- **Česká pošta** — doručení na adresu nebo uložení na poště' || E'\n' ||
  '- **Osobní odběr** — zdarma na naší prodejně v Praze' || E'\n\n' ||
  'Doprava je zdarma při objednávce nad 1000 Kč, jinak účtujeme dopravu podle zvoleného přepravce.' || E'\n\n' ||
  '### Způsoby platby' || E'\n\n' ||
  '- Platební kartou online (Visa, Mastercard)' || E'\n' ||
  '- Google Pay / Apple Pay' || E'\n' ||
  '- Bankovním převodem předem' || E'\n' ||
  '- Dobírkou při převzetí zásilky' || E'\n' ||
  '- Na splátky přes Home Credit',
  'purchase_info', 4
),
(
  'a0000000-0000-0000-0000-000000000001', 'cenik-sluzeb-a-oprav', 'Ceník služeb a oprav', 'default',
  '## Ceník služeb a oprav' || E'\n\n' ||
  'Orientační ceník nejčastějších oprav a servisních úkonů. Konečná cena se může lišit podle ' ||
  'konkrétního modelu a rozsahu poškození — přesnou cenu vám sdělíme po prohlídce zařízení zdarma.' || E'\n\n' ||
  '| Služba | Orientační cena |' || E'\n' ||
  '|---|---|' || E'\n' ||
  '| Výměna displeje iPhone | od 1990 Kč |' || E'\n' ||
  '| Výměna baterie iPhone | od 990 Kč |' || E'\n' ||
  '| Výměna zadního krytu | od 1490 Kč |' || E'\n' ||
  '| Diagnostika zdarma | 0 Kč |' || E'\n' ||
  '| Záchrana dat | od 990 Kč |' || E'\n\n' ||
  '*Ceny jsou orientační k datu zveřejnění a mohou se lišit podle aktuálních cen náhradních dílů.*',
  'purchase_info', 5
),
(
  'a0000000-0000-0000-0000-000000000001', 'zaruka-originality', 'Záruka originality', 'default',
  '## Záruka originality' || E'\n\n' ||
  'Všechny produkty, které prodáváme, jsou 100% originální Apple produkty. Nikdy neprodáváme ' ||
  'repliky, kopie ani neoriginální náhradní díly bez jasného označení.' || E'\n\n' ||
  'Každé zařízení před prodejem ověřujeme podle sériového čísla přímo u výrobce, abychom měli ' ||
  'jistotu, že neprodáváme kradené nebo blokované zařízení (např. přes Найти iPhone / Find My).',
  'purchase_info', 1
),
(
  'a0000000-0000-0000-0000-000000000001', 'peclive-testovano', 'Pečlivě testováno', 'default',
  '## Pečlivě testováno' || E'\n\n' ||
  'Každý kus, který k nám přijde, prochází důkladnou technickou kontrolou ve více než 50 bodech — ' ||
  'displej, baterie, fotoaparát, reproduktory, mikrofony, konektivita (Wi-Fi, Bluetooth, mobilní síť), ' ||
  'tlačítka a senzory.' || E'\n\n' ||
  'Teprve po úspěšném otestování a případné opravě vad zařazujeme produkt do nabídky s odpovídajícím ' ||
  'stavovým hodnocením (Nové, Zánovní, A, B, C).',
  'purchase_info', 2
),
(
  'a0000000-0000-0000-0000-000000000001', 'vyhodne-ceny', 'Výhodné ceny', 'default',
  '## Výhodné ceny' || E'\n\n' ||
  'Repasované produkty nabízíme běžně o 20-40 % levněji než srovnatelný nový kus, v závislosti na ' ||
  'stavu a stáří modelu.' || E'\n\n' ||
  'Nižší cena je dána tím, že zařízení pochází z výkupu, vrácených objednávek nebo repasovaných ' ||
  'vzorků — nikoliv nižší kvalitou. Každý kus prochází stejnou technickou kontrolou bez ohledu na ' ||
  'jeho původ.',
  'purchase_info', 3
),
(
  'a0000000-0000-0000-0000-000000000001', 'zakaznicky-servis', 'Zákaznický servis', 'default',
  '## Zákaznický servis' || E'\n\n' ||
  'Jsme tu pro vás každý den. Ať už řešíte výběr produktu, stav objednávky, reklamaci nebo výkup ' ||
  'starého zařízení, ozvěte se nám telefonicky, e-mailem nebo se zastavte osobně na naší prodejně.' || E'\n\n' ||
  'Rychlé odkazy: [Reklamační řád](/stranka/reklamace), [Vrácení zboží](/stranka/vraceni-zbozi), ' ||
  '[Časté dotazy](/stranka/faq), [Kontakt](/stranka/kontakt).',
  'information', 3
),
(
  'a0000000-0000-0000-0000-000000000001', 'kariera', 'Kariéra', 'default',
  '## Kariéra v Repasado' || E'\n\n' ||
  'Rosteme a rádi bychom náš tým rozšířili o šikovné kolegy a kolegyně, kteří mají rádi technologie ' ||
  'a chtějí dělat věci pořádně.' || E'\n\n' ||
  'Aktuálně hledáme posily na pozice: technik repasí, specialista zákaznické podpory a specialista ' ||
  'expedice. Pokud vás naše práce zajímá, pošlete nám životopis na kariera@repasado.cz — rádi se s ' ||
  'vámi spojíme, i když aktuálně žádnou pozici neinzerujeme.',
  'information', 4
),
(
  'a0000000-0000-0000-0000-000000000001', 'esim', 'eSIM', 'default',
  '## eSIM' || E'\n\n' ||
  'Novější modely iPhone podporují eSIM — digitální SIM kartu, kterou aktivujete přímo v telefonu ' ||
  'bez nutnosti fyzické karty od operátora.' || E'\n\n' ||
  'Pokud si u nás koupíte model podporující eSIM, rádi vám s aktivací poradíme přímo na prodejně. ' ||
  'Aktivační QR kód vám poskytne váš mobilní operátor.',
  'information', 7
),
(
  'a0000000-0000-0000-0000-000000000001', 'bonusovy-program', 'Bonusový program', 'default',
  '## Bonusový program' || E'\n\n' ||
  'Za každý nákup u nás sbíráte věrnostní body, které můžete uplatnit jako slevu na příští nákup.' || E'\n\n' ||
  '### Jak to funguje' || E'\n\n' ||
  '- Za každých utracených 100 Kč získáváte 1 bod' || E'\n' ||
  '- 100 bodů = sleva 100 Kč na další nákup' || E'\n' ||
  '- Body se automaticky připisují po dokončení a zaplacení objednávky' || E'\n' ||
  '- Přehled bodů najdete ve svém zákaznickém účtu',
  'information', 6
);

-- Reorganize footer_links to match the reference layout: "Zákaznický servis" (information)
-- keeps the org/contact/service pages; "Proč koupit použitý iPhone" moves into the new
-- "Vše o nákupu" (purchase_info) column alongside the other purchase-education pages.
UPDATE footer_links SET column_key = 'purchase_info', sort_order = 6
WHERE party_id = 'a0000000-0000-0000-0000-000000000001' AND url = '/stranka/proc-koupit-repasovany';

-- The very first org seed put "Časté dotazy"/"Kontakt" in a separate "customer_service" column
-- before this "purchase_info"/"information" split existed — fold that leftover column back into
-- "information" so "Zákaznický servis" doesn't render as two duplicate footer columns.
UPDATE footer_links SET column_key = 'information', sort_order = 6
WHERE party_id = 'a0000000-0000-0000-0000-000000000001' AND column_key = 'customer_service' AND label = 'Časté dotazy';
DELETE FROM footer_links
WHERE party_id = 'a0000000-0000-0000-0000-000000000001' AND column_key = 'customer_service' AND label = 'Kontakt';

UPDATE footer_links SET sort_order = 10
WHERE party_id = 'a0000000-0000-0000-0000-000000000001' AND url = '/blog';
UPDATE footer_links SET sort_order = 1
WHERE party_id = 'a0000000-0000-0000-0000-000000000001' AND url = '/stranka/o-nas';
UPDATE footer_links SET sort_order = 2
WHERE party_id = 'a0000000-0000-0000-0000-000000000001' AND url = '/stranka/kontakt';
UPDATE footer_links SET sort_order = 7
WHERE party_id = 'a0000000-0000-0000-0000-000000000001' AND url = '/stranka/vykup';
UPDATE footer_links SET sort_order = 8
WHERE party_id = 'a0000000-0000-0000-0000-000000000001' AND url = '/stranka/stavy-produktu';

INSERT INTO footer_links (party_id, column_key, label, url, sort_order)
SELECT 'a0000000-0000-0000-0000-000000000001', 'information', v.label, v.url, v.sort_order
FROM (VALUES
  ('Zákaznický servis', '/stranka/zakaznicky-servis', 3),
  ('Kariéra', '/stranka/kariera', 4),
  ('Reklamace', '/stranka/reklamace', 5),
  ('eSIM', '/stranka/esim', 9),
  ('Bonusový program', '/stranka/bonusovy-program', 11)
) AS v(label, url, sort_order);

INSERT INTO footer_links (party_id, column_key, label, url, sort_order)
SELECT 'a0000000-0000-0000-0000-000000000001', 'purchase_info', v.label, v.url, v.sort_order
FROM (VALUES
  ('Záruka originality', '/stranka/zaruka-originality', 1),
  ('Pečlivě testováno', '/stranka/peclive-testovano', 2),
  ('Výhodné ceny', '/stranka/vyhodne-ceny', 3),
  ('Platba a doprava', '/stranka/platba-a-doprava', 4),
  ('Ceník služeb a oprav', '/stranka/cenik-sluzeb-a-oprav', 5),
  ('Obchodní podmínky', '/stranka/obchodni-podminky', 7),
  ('Ochrana osobních údajů', '/stranka/ochrana-osobnich-udaju', 8),
  ('Zásady používání cookies', '/stranka/cookies', 9),
  ('Vrácení zboží', '/stranka/vraceni-zbozi', 10)
) AS v(label, url, sort_order);

\echo 'Legal/info pages + footer badges + store visit details seeded.'
\else
\echo 'Legal/info pages already exist — skipping.'
\endif
