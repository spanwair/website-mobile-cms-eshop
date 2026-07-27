-- Enriches the "Repasado" demo org's footer content pages so they carry the same depth as a
-- real repasovaná-elektronika storefront's info pages (structure/topics only — all copy below
-- is original writing for this fictional company, not copied from any third-party site).
--
-- Idempotent: always overwrites the target rows' body/seo fields to the version below, and
-- inserts the new faq_items only if they don't already exist. Apply with:
--   PGPASSWORD=postgres psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/seed/demo_store_footer_content_enriched.sql

\set party_id 'a0000000-0000-0000-0000-000000000001'

-- O nás -----------------------------------------------------------------------------------
UPDATE content_pages SET
  seo_title = 'O nás | Repasado',
  seo_description = 'Repasado prodává repasované Apple produkty s 12měsíční zárukou. Poznejte náš tým a najděte naši prodejnu v centru Prahy.',
  body = $body$## O nás

Repasado prodává repasované a zánovní Apple produkty — iPhony, iPady, Macy, Apple Watch,
sluchátka i příslušenství. Naším cílem je nabídnout kvalitní elektroniku za rozumnou cenu a
zároveň prodloužit životnost zařízení, která by jinak skončila v šuplíku nebo na skládce.

Každý kus prochází důkladnou technickou kontrolou a rozdělujeme je do jasně popsaných stavů
(Nové, Zánovní, A, B, C), abyste vždy věděli přesně, co kupujete. Nikdy neprodáváme repliky ani
neoriginální díly bez jasného označení — vždy jde o originální Apple produkty.

### Kde nás najdete

Naše prodejna se nachází na adrese **Karlova 15, 110 00 Praha 1**, pár minut chůze od
Staroměstského náměstí. Zastavte se osobně prohlédnout si zboží naživo, poradit se s výběrem,
nebo si vyzvednout objednávku z e-shopu.

### Co nás odlišuje

- **Transparentnost** — u každého produktu vidíte přesný stav, kapacitu baterie i to, co je součástí balení.
- **Původ dílů** — používáme výhradně originální Apple díly, nikdy neoriginální kopie.
- **Udržitelnost** — každé repasované zařízení znamená o kus méně elektroodpadu.
- **Osobní přístup** — jsme malý tým, který si zakládá na tom, že s vámi mluví člověk, ne skript.

### Zastavte se u nás na prodejně

Na prodejně vám poradíme s výběrem, provedeme výkup starého zařízení na počkání, vyřídíme
reklamaci nebo vám osobně předáme objednávku z e-shopu. Otevřeno máme Po–Pá 9:00–18:00.$body$
WHERE party_id = :'party_id' AND slug = 'o-nas';

-- Kontakt -----------------------------------------------------------------------------------
UPDATE content_pages SET
  seo_title = 'Kontakt | Repasado',
  seo_description = 'Kontaktujte Repasado telefonicky, e-mailem, nebo se zastavte osobně na naší prodejně v centru Prahy.',
  body = $body$Máte dotaz k objednávce, reklamaci, nebo si chcete poradit s výběrem repasovaného zařízení?
Ozvěte se nám telefonicky, e-mailem, nebo se zastavte osobně na naší prodejně — kontaktní
údaje najdete níže.

### Zastavte se u nás na prodejně

Na prodejně vám rádi poradíme s výběrem, provedeme výkup starého zařízení, vyřídíme reklamaci
nebo vám vydáme objednávku z e-shopu k osobnímu odběru.

### Bankovní spojení

Číslo účtu: **2200123456/2010** (Fio banka)

### Fakturační a registrační údaje

**Repasado s.r.o.**
Karlova 15, 110 00 Praha 1
IČO: 19283746 · DIČ: CZ19283746
Zapsaná v obchodním rejstříku vedeném Městským soudem v Praze, oddíl C, vložka 398217$body$
WHERE party_id = :'party_id' AND slug = 'kontakt';

-- Proč koupit repasovaný telefon? ------------------------------------------------------------
UPDATE content_pages SET
  seo_title = 'Proč koupit repasovaný telefon? | Repasado',
  seo_description = 'Originální díly, testovaná baterie, 12 měsíců záruky. Zjistěte, kolik ušetříte koupí repasovaného Apple zařízení u Repasado.',
  body = $body$## Proč koupit repasovaný telefon?

Repasovaný telefon prošel technickou kontrolou, opravou vad a důkladným otestováním, takže
funguje srovnatelně s novým kusem — jen za výrazně nižší cenu. Navíc dáváte druhou šanci
zařízení, které by jinak skončilo jako elektroodpad, což šetří suroviny i energii potřebnou na
výrobu nového telefonu.

U nás navíc na každý repasovaný kus dostanete 12 měsíců záruky a 14 dní na vrácení bez udání
důvodu, takže riziko nákupu je minimální.

### Co všechno pro vás děláme

- **100 % originální díly** — nikdy nepoužíváme neoriginální ani repasované náhradní díly z neznámého zdroje.
- **Baterie s kapacitou 80–100 %** — kapacitu každé baterie měříme a garantujeme.
- **100+ bodů testování** — displej, fotoaparát, reproduktory, konektivita i tlačítka projdou důkladnou kontrolou.
- **12 měsíců záruka** — na každý repasovaný kus, ne jen na vybrané modely.
- **14 dní na vrácení** — bez udání důvodu.
- **Podpora 7 dní v týdnu** — poradíme telefonicky, e-mailem i osobně na prodejně.

### Kolik můžete ušetřit

Repasovaný kus vás obvykle vyjde o 20–40 % levněji než srovnatelný nový model, v závislosti na
stavu a stáří zařízení:

- **iPhone** — úspora přibližně 4 000–12 000 Kč oproti novému kusu
- **iPad** — úspora přibližně 2 000–7 000 Kč
- **MacBook** — úspora přibližně 5 000–15 000 Kč
- **Apple Watch** — úspora přibližně 1 500–4 000 Kč

*Konkrétní úspora se liší podle modelu, kapacity a stavu — přesnou cenu vždy najdete u
jednotlivého produktu.*

### Máte pochybnosti?

Podívejte se na naše [časté dotazy](/stranka/faq), nebo se rovnou podívejte, [jak pečlivě
každý kus testujeme](/stranka/peclive-testovano).$body$
WHERE party_id = :'party_id' AND slug = 'proc-koupit-repasovany';

-- Výkup ---------------------------------------------------------------------------------------
UPDATE content_pages SET
  seo_title = 'Výkup starých zařízení | Repasado',
  seo_description = 'Vykoupíme váš starý iPhone, iPad, Mac nebo Apple Watch za férovou cenu. Nezávazně, poštou nebo osobně na prodejně v Praze.',
  body = $body$## Výkup starých zařízení

Nepoužívaný iPhone, iPad, Mac nebo Apple Watch doma jen sbírá prach? Pošlete nám ho, nebo
přijďte osobně na prodejnu — po rychlé kontrole stavu vám nabídneme férovou cenu. Pokud se s
výkupní cenou nespokojíte, zařízení vám bez poplatku vrátíme zpět.

### Jak výkup probíhá

1. **Popište nám zařízení** — model, kapacitu a stav pošlete e-mailem na podpora@repasado.cz nebo přineste osobně na prodejnu.
2. **Dostanete orientační nabídku** — cenu vám sdělíme do 24 hodin, zcela nezávazně.
3. **Pošlete nebo přineste zařízení** — na kontrolu stavu a funkčnosti.
4. **Dostanete zaplaceno** — na bankovní účet do 2 pracovních dnů od potvrzení stavu, nebo rovnou na místě při osobním výkupu.

### Kolik můžete za své staré zařízení dostat

Orientační výkupní ceny se odvíjí od modelu, kapacity a stavu zařízení:

- **iPhone** — výkup až 18 000 Kč
- **iPad** — výkup až 12 000 Kč
- **MacBook / iMac** — výkup až 35 000 Kč
- **Apple Watch** — výkup až 6 000 Kč

Přesnou cenu vždy stanovíme až po kontrole konkrétního kusu.

### Nesouhlasíte s nabídkou? Nic neztrácíte

Pokud vám finální nabídka po kontrole zařízení nebude vyhovovat, zařízení vám zdarma pošleme
zpět nebo si ho můžete vyzvednout osobně na prodejně — výkup je vždy zcela nezávazný.

### Chcete rovnou nový kus?

Výkupní cenu vašeho starého zařízení můžete rovnou uplatnit jako slevu na nákup repasovaného
kusu z naší nabídky.$body$
WHERE party_id = :'party_id' AND slug = 'vykup';

-- Průvodce stavy produktů ----------------------------------------------------------------------
UPDATE content_pages SET
  seo_title = 'Průvodce stavy produktů | Repasado',
  seo_description = 'Nové, Zánovní, Stav A, B nebo C — zjistěte přesně, co jednotlivé stavy repasovaných produktů znamenají.',
  body = $body$## Jak rozumět stavům produktů

Každé zařízení, které nabízíme, projde před zařazením do prodeje důkladnou technickou kontrolou
a je zařazeno do jedné z pěti kategorií podle vzhledového a technického stavu. Fotografie u
každého produktu vždy odpovídají skutečnému stavu konkrétního kusu, ne obecné ilustraci.

### Nové

Nerozbalený kus v originálním balení, nikdy nepoužitý. Nejčastěji jde o vrácené objednávky,
které zákazník ani nerozbalil.

### Zánovní

Použito jen velmi krátce, bez viditelných známek opotřebení. Funguje i vypadá prakticky jako nové.

### Stav A

Velmi dobře zachovaný kus. Displej bez škrábanců, tělo zařízení může mít jen nepatrné, těžko
postřehnutelné stopy používání.

### Stav B

Plně funkční zařízení s drobnými viditelnými známkami používání — například jemné oděrky na
rámečku nebo zadní straně. Displej bez prasklin, funkčnost 100 %.

### Stav C

Plně funkční zařízení s výraznějším kosmetickým opotřebením (viditelnější škrábance nebo
oděrky), které však nijak neovlivňuje funkčnost ani výkon.

### Proč na stavu záleží

Nižší stav neznamená nižší kvalitu funkčnosti — vždy jde o kosmetický rozdíl. Každý kus, bez
ohledu na stav, prochází stejnou technickou kontrolou. Více o tom, jak testujeme, najdete na
stránce [Pečlivě testováno](/stranka/peclive-testovano).$body$
WHERE party_id = :'party_id' AND slug = 'stavy-produktu';

-- FAQ page intro ------------------------------------------------------------------------------
UPDATE content_pages SET
  seo_title = 'Časté dotazy | Repasado',
  body = $body$Odpovědi na nejčastější otázky ohledně repasovaných produktů, záruky a vrácení zboží. Pokud tu
svou otázku nenajdete, ozvěte se nám na [kontaktní stránce](/stranka/kontakt) — rádi poradíme.$body$
WHERE party_id = :'party_id' AND slug = 'faq';

-- Light-touch enrichment of remaining short purchase_info pages ------------------------------
UPDATE content_pages SET body = body || E'\n\n' ||
  '### Jak ověřujeme originalitu' || E'\n\n' ||
  'U každého kusu kontrolujeme sériové číslo přímo v systému výrobce a ověřujeme, že zařízení ' ||
  'není nahlášené jako ztracené nebo odcizené (Find My / Activation Lock). Teprve po úspěšném ' ||
  'ověření zařízení zařadíme do nabídky.'
WHERE party_id = :'party_id' AND slug = 'zaruka-originality' AND body NOT LIKE '%Jak ověřujeme originalitu%';

UPDATE content_pages SET body = body || E'\n\n' ||
  '### Co konkrétně kontrolujeme' || E'\n\n' ||
  'Displej a dotykovou vrstvu, fotoaparáty, reproduktory a mikrofony, Wi-Fi a Bluetooth ' ||
  'připojení, výdrž a kapacitu baterie, biometriku (Face ID / Touch ID) i všechna tlačítka a ' ||
  'porty. Výsledek kontroly se promítá přímo do přiděleného stavu (Nové, Zánovní, A, B, C).'
WHERE party_id = :'party_id' AND slug = 'peclive-testovano' AND body NOT LIKE '%Co konkrétně kontrolujeme%';

UPDATE content_pages SET body = body || E'\n\n' ||
  '### Bez skrytých poplatků' || E'\n\n' ||
  'Cena, kterou vidíte u produktu, je konečná cena včetně DPH. Žádné skryté poplatky za ' ||
  '„aktivaci" nebo „kontrolu" si neúčtujeme — jedinou dodatečnou položkou může být doprava, ' ||
  'pokud objednávka nedosáhne 1000 Kč.'
WHERE party_id = :'party_id' AND slug = 'vyhodne-ceny' AND body NOT LIKE '%Bez skrytých poplatků%';

UPDATE content_pages SET body = body || E'\n\n' ||
  '### Jak nás nejrychleji zastihnete' || E'\n\n' ||
  'Na telefonu a e-mailu jsme dostupní v pracovní dny 9:00–18:00, odpovídáme obvykle do ' ||
  'několika hodin. Osobně nás najdete na prodejně v centru Prahy — bez objednání, stačí přijít.'
WHERE party_id = :'party_id' AND slug = 'zakaznicky-servis' AND body NOT LIKE '%nejrychleji zastihnete%';

UPDATE content_pages SET body = body || E'\n\n' ||
  '### Co u nás najdete' || E'\n\n' ||
  'Malý tým, kde má každý přehled o celém provozu — od příjmu zařízení přes testování až po ' ||
  'expedici. Práci s technikou, kterou máte v ruce denně, a prostor navrhovat, jak věci dělat lépe.'
WHERE party_id = :'party_id' AND slug = 'kariera' AND body NOT LIKE '%Co u nás najdete%';

UPDATE content_pages SET body = body || E'\n\n' ||
  '### Jak aktivaci zvládnout sami' || E'\n\n' ||
  'Po výběru tarifu vám operátor pošle QR kód nebo aktivační odkaz — ten stačí naskenovat v ' ||
  'nastavení telefonu (Nastavení → Mobilní data → Přidat eSIM). Pokud si nejste jistí, rádi ' ||
  'vám s prvním nastavením pomůžeme přímo na prodejně.'
WHERE party_id = :'party_id' AND slug = 'esim' AND body NOT LIKE '%aktivaci zvládnout sami%';

UPDATE content_pages SET body = body || E'\n\n' ||
  '### Proč se to vyplatí' || E'\n\n' ||
  'Body se nevztahují jen na drahé produkty — sbíráte je za každý nákup včetně příslušenství. ' ||
  'Ideální na slevu k dalšímu nákupu nebo jako příspěvek na výkup nového kusu.'
WHERE party_id = :'party_id' AND slug = 'bonusovy-program' AND body NOT LIKE '%Proč se to vyplatí%';

-- Homepage buyback promo banner — keep punchy (white text on brand-color background) --------
UPDATE store_configs SET
  buyback_content = '## Prodejte staré, kupte repasované' || E'\n\n' ||
    'Vykoupíme váš nepoužívaný iPhone, iPad, Mac, Apple Watch nebo sluchátka za férovou cenu — ' ||
    'stačí poslat poštou nebo přinést na prodejnu v Praze. Cenu vám sdělíme předem a výkup je ' ||
    'zcela nezávazný.' || E'\n\n' ||
    '[Zjistit cenu výkupu →](/stranka/vykup)'
WHERE party_id = :'party_id';

-- More FAQ items, continuing sort_order from the existing max (5) -----------------------------
INSERT INTO faq_items (party_id, question, answer, context, sort_order)
SELECT :'party_id', v.question, v.answer, v.context, v.sort_order
FROM (VALUES
  ('Jak poznám, jaký stav zařízení potřebuji?',
   'Podívejte se na náš průvodce stavy produktů — najdete tam přesný popis každé kategorie i doporučení, na co se zaměřit podle způsobu používání.',
   'general', 6),
  ('Je v ceně i nabíječka a sluchátka?',
   'Není-li u produktu uvedeno jinak, dodáváme zařízení bez originálního příslušenství výrobce. Rozsah balení najdete vždy v popisu konkrétního produktu.',
   'general', 7),
  ('Podporujete eSIM?',
   'Ano, novější modely iPhone eSIM podporují. S aktivací vám rádi pomůžeme přímo na prodejně.',
   'general', 8),
  ('Jak dlouho trvá doručení?',
   'Objednávky expedujeme obvykle do 24 hodin, doručení pak trvá 1–2 pracovní dny podle zvoleného přepravce.',
   'doprava', 9),
  ('Je doprava zdarma?',
   'Ano, při objednávce nad 1000 Kč dopravu hradíme my.',
   'doprava', 10),
  ('Jak dlouho trvá vyřízení reklamace?',
   'O výsledku vás informujeme do 3 pracovních dnů, samotné vyřízení reklamace trvá nejdéle 30 dnů.',
   'reklamace', 11),
  ('Musím zařízení před výkupem smazat?',
   'Doporučujeme zálohovat data a odhlásit se z Apple ID / Find My ještě před odesláním — usnadní to i zrychlí vyřízení výkupu. Pokud si nevíte rady, poradíme vám na prodejně.',
   'vykup', 12)
) AS v(question, answer, context, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM faq_items WHERE party_id = :'party_id' AND question = v.question
);

\echo 'Enriched footer content pages, buyback promo copy, and FAQ items for "Repasado".'

-- One pre-existing bug fix: this page's body used a markdown table, but contentRenderer.ts's
-- sanitizeHtml allowlist has no table/tr/td tags, so the table rendered as unstructured run-on
-- text. Replace with a bullet list, which maps to allowed <ul>/<li> tags.
UPDATE content_pages SET
  body = $body$## Ceník služeb a oprav

Orientační ceník nejčastějších oprav a servisních úkonů. Konečná cena se může lišit podle
konkrétního modelu a rozsahu poškození — přesnou cenu vám sdělíme po prohlídce zařízení zdarma.

- **Výměna displeje iPhone** — od 1990 Kč
- **Výměna baterie iPhone** — od 990 Kč
- **Výměna zadního krytu** — od 1490 Kč
- **Diagnostika** — zdarma
- **Záchrana dat** — od 990 Kč

*Ceny jsou orientační k datu zveřejnění a mohou se lišit podle aktuálních cen náhradních dílů.*$body$
WHERE party_id = :'party_id' AND slug = 'cenik-sluzeb-a-oprav';

\echo 'Fixed cenik-sluzeb-a-oprav table-to-list rendering bug.'
