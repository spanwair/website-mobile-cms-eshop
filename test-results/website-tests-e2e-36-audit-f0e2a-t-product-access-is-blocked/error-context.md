# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: website/tests/e2e/36-audit-security.spec.ts >> cross-tenant product access is blocked
- Location: website/tests/e2e/36-audit-security.spec.ts:7:1

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/admin/products?party=11111111-2222-2222-2222-111111111111", waiting until "load"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - link "mamtodoma .cz" [ref=e4] [cursor=pointer]:
        - /url: /
        - img [ref=e5]
        - text: mamtodoma
        - generic [ref=e8]: .cz
      - navigation "Začít zdarma" [ref=e9]:
        - link "Funkce" [ref=e10] [cursor=pointer]:
          - /url: /features
        - link "Ceník" [ref=e11] [cursor=pointer]:
          - /url: /pricing
        - link "Reálné eshopy" [ref=e12] [cursor=pointer]:
          - /url: /eshopy
        - link "Zaměstnání" [ref=e13] [cursor=pointer]:
          - /url: /employment
        - link "Dokumentace" [ref=e14] [cursor=pointer]:
          - /url: /docs
        - link "O nás" [ref=e15] [cursor=pointer]:
          - /url: /about
        - link "Kontakt" [ref=e16] [cursor=pointer]:
          - /url: /contact
      - button "A admin ▾" [ref=e19] [cursor=pointer]:
        - generic [ref=e20]: A
        - generic [ref=e21]: admin
        - generic [ref=e22]: ▾
  - main [ref=e23]:
    - generic [ref=e25]:
      - generic [ref=e26]:
        - generic [ref=e27]: Pro každého, kdo má co prodávat
        - heading "Váš e-shop bez vstupních nákladů — vyděláváme, jen když vyděláte vy" [level=1] [ref=e28]
        - paragraph [ref=e29]: "Spusťte si plnohodnotný e-shop bez vstupních nákladů ještě dnes. Žádný poplatek za založení, žádné pevné měsíční předplatné. Vyděláváme jen tehdy, když vyděláte vy: bereme si 10 % pouze z uskutečněného prodeje, se snížením na 5 %, jakmile váš obrat překročí 29 900 Kč měsíčně — zbytek každé objednávky zůstává vám."
        - generic [ref=e30]:
          - textbox "vas@email.cz" [ref=e31]
          - button "Začít prodávat zdarma" [ref=e32] [cursor=pointer]
        - paragraph [ref=e33]: Bez platební karty. Bez pevného předplatného. Není co rušit.
        - paragraph [ref=e34]: 0 Kč na start · 10 % jen z prodeje · snížení na 5 % nad 29 900 Kč měsíčně
      - generic [ref=e36]:
        - generic [ref=e37]: 10 %
        - generic [ref=e38]: jen z uskutečněného prodeje
    - generic [ref=e42]:
      - paragraph [ref=e43]: Napojeno na
      - generic [ref=e44]:
        - generic [ref=e45]:
          - img [ref=e47]
          - generic [ref=e52]: PPL
        - generic [ref=e53]:
          - img [ref=e55]
          - generic [ref=e58]: Zásilkovna
        - generic [ref=e59]:
          - img [ref=e61]
          - generic [ref=e63]: Stripe
    - generic [ref=e65]:
      - paragraph [ref=e66]: Zakládající prodejci
      - heading "Jsme úplně noví. Přesně proto je teď ten nejlepší čas začít." [level=2] [ref=e67]
      - paragraph [ref=e68]: mamtodoma.cz právě spustilo provoz. Nebudeme předstírat, že už máme tisíce e-shopů — místo toho vám dáme přesná čísla toho, co jako zakládající prodejce získáte.
      - generic [ref=e69]:
        - generic [ref=e70]:
          - heading "0 % za založení, žádné SaaS předplatné" [level=3] [ref=e71]
          - paragraph [ref=e72]: Žádná zkušební verze s háčkem. Samotný e-shop je zdarma — platíte jen provizi z toho, co skutečně prodáte.
        - generic [ref=e73]:
          - heading "90 % z každého prodeje zůstává vám" [level=3] [ref=e74]
          - paragraph [ref=e75]: Vyděláváme jen tehdy, když vyděláte vy — 10 % z uskutečněné objednávky, nic víc, nic skrytě.
        - generic [ref=e76]:
          - heading "Spuštěno za pár minut, ne měsíců" [level=3] [ref=e77]
          - paragraph [ref=e78]: Bez agentury, bez programátora, bez čekací listiny. První produkt nahrajete a prodáváte ještě dnes.
      - link "Zarezervujte si název e-shopu" [ref=e80] [cursor=pointer]:
        - /url: /login?mode=signup
    - generic [ref=e82]:
      - paragraph [ref=e83]: Vše v ceně
      - heading "Skutečná e-commerce platforma, ne hračka na tvorbu stránek" [level=2] [ref=e84]
      - paragraph [ref=e85]: Každá funkce níže je už dnes součástí platformy, na které právě stojíte.
      - generic [ref=e86]:
        - generic [ref=e87]:
          - img [ref=e89]
          - heading "Kompletní e-shop a CMS" [level=3] [ref=e92]
          - paragraph [ref=e93]: Vlastní stránky, blog, tým, FAQ, navigace i patička — vše editovatelné bez zásahu do kódu.
        - generic [ref=e94]:
          - img [ref=e96]
          - heading "Vlastní doména" [level=3] [ref=e99]
          - paragraph [ref=e100]: Provozujte e-shop na vlastní doméně, nebo zdarma na subdoméně — vaše značka, ne naše.
        - generic [ref=e101]:
          - img [ref=e103]
          - heading "Týmový přístup s reálnými oprávněními" [level=3] [ref=e108]
          - paragraph [ref=e109]: Přizvěte kolegy a dejte jim přesně takový přístup, jaký potřebují — ne plná admin práva automaticky.
        - generic [ref=e110]:
          - img [ref=e112]
          - heading "Objednávky, sklad a reklamace" [level=3] [ref=e115]
          - paragraph [ref=e116]: Skladové zásoby, stavy objednávek i vyřizování reklamací už od prvního dne.
        - generic [ref=e117]:
          - img [ref=e119]
          - heading "Platby přes Stripe" [level=3] [ref=e121]
          - paragraph [ref=e122]: Bezpečný a důvěryhodný způsob platby, který vaši zákazníci už znají.
        - generic [ref=e123]:
          - img [ref=e125]
          - heading "Volitelný design" [level=3] [ref=e129]
          - paragraph [ref=e130]: Vyberte rozvržení a styl produktových karet, který sedí vaší značce — bez grafika.
    - generic [ref=e132]:
      - paragraph [ref=e133]: Jak začít
      - heading "Tři kroky. Žádný tarif nevybíráte — přepínáme vás automaticky." [level=2] [ref=e134]
      - paragraph [ref=e135]: Žádné srovnávání šesti tarifů. Platíte 10 % z prodeje, a jakmile váš obrat překročí 29 900 Kč měsíčně, sami vás snížíme na 5 % — nic nevybíráte ani nenastavujete.
      - generic [ref=e136]:
        - generic [ref=e137]:
          - generic [ref=e138]: "1"
          - heading "Založte si e-shop" [level=3] [ref=e139]
          - paragraph [ref=e140]: Zadejte e-mail, pojmenujte e-shop a jste v administraci.
        - generic [ref=e141]:
          - generic [ref=e142]: "2"
          - heading "Nahrajte produkty" [level=3] [ref=e143]
          - paragraph [ref=e144]: Fotky, ceny, sklad — přidejte jeden produkt nebo celý katalog.
        - generic [ref=e145]:
          - generic [ref=e146]: "3"
          - heading "Sdílejte odkaz a prodávejte" [level=3] [ref=e147]
          - paragraph [ref=e148]: Váš e-shop je ihned online. My vyděláváme, až vyděláte vy.
    - generic [ref=e150]:
      - paragraph [ref=e151]: Už běží naostro
      - heading "Reálné eshopy na platformě" [level=2] [ref=e152]
      - paragraph [ref=e153]: Žádné mockupy - toto jsou skutečné obchody, které už dnes prodávají na mamtodoma.cz.
      - generic [ref=e154]:
        - link "Náhled eshopu Kytka z Beskyd Kytka z Beskyd Ruční věnce a sušené květinové dekorace z Beskyd - každý kus je jedinečný, s expresním dodáním do druhého dne. Navštívit eshop" [ref=e155] [cursor=pointer]:
          - /url: /eshop-kytka-z-beskyd
          - img "Náhled eshopu Kytka z Beskyd" [ref=e157]
          - generic [ref=e158]:
            - heading "Kytka z Beskyd" [level=3] [ref=e159]
            - paragraph [ref=e160]: Ruční věnce a sušené květinové dekorace z Beskyd - každý kus je jedinečný, s expresním dodáním do druhého dne.
            - generic [ref=e161]: Navštívit eshop
        - link "R Repasado Kvalitní repasovaná elektronika za skvělou cenu Navštívit eshop" [ref=e162] [cursor=pointer]:
          - /url: /eshop-repasado
          - generic [ref=e164]: R
          - generic [ref=e165]:
            - heading "Repasado" [level=3] [ref=e166]
            - paragraph [ref=e167]: Kvalitní repasovaná elektronika za skvělou cenu
            - generic [ref=e168]: Navštívit eshop
        - link "Chcete být další? Spusťte si vlastní eshop zdarma a prodávejte vedle nich. Založit e-shop zdarma" [ref=e169] [cursor=pointer]:
          - /url: /login?mode=signup
          - generic [ref=e171]: +
          - generic [ref=e172]:
            - heading "Chcete být další?" [level=3] [ref=e173]
            - paragraph [ref=e174]: Spusťte si vlastní eshop zdarma a prodávejte vedle nich.
            - generic [ref=e175]: Založit e-shop zdarma
    - generic [ref=e177]:
      - paragraph [ref=e178]: Vy budete další
      - heading "Chcete se přidat do tohoto seznamu?" [level=2] [ref=e179]
      - paragraph [ref=e180]: Založte si vlastní eshop na mamtodoma.cz a během pár minut prodávejte vedle nich.
      - generic [ref=e181]:
        - link "Založit e-shop zdarma" [ref=e182] [cursor=pointer]:
          - /url: /login?mode=signup
        - link "Zobrazit ceník" [ref=e183] [cursor=pointer]:
          - /url: /pricing
    - generic [ref=e185]:
      - generic [ref=e187]:
        - generic [ref=e192]: app.vaseznacka.cz/admin/products
        - generic [ref=e193]:
          - complementary [ref=e194]:
            - generic [ref=e195]: 📊
            - generic [ref=e196]: 🛍️
            - generic [ref=e197]: 📋
            - generic [ref=e198]: 👥
            - generic [ref=e199]: 💰
          - generic [ref=e200]:
            - generic [ref=e201]:
              - generic [ref=e202]: Název produktu
              - generic [ref=e203]: Pánská bunda Alpine 2.0
            - generic [ref=e204]:
              - generic [ref=e205]: voděodolná
              - generic [ref=e206]: lehká
              - generic [ref=e207]: kapuce
            - generic [ref=e208]:
              - generic [ref=e209]:
                - generic [ref=e210]: ✨ AI popis produktu
                - generic [ref=e211]: generuji…
              - paragraph [ref=e212]: L
            - generic [ref=e214]:
              - generic [ref=e215]:
                - generic [ref=e216]: ✓ Dámské šaty Riviera
                - generic [ref=e217]: před 2 min
              - generic [ref=e218]:
                - generic [ref=e219]: ✓ Sportovní láhev 750 ml
                - generic [ref=e220]: před 6 min
            - generic [ref=e221]:
              - generic [ref=e222]:
                - generic [ref=e223]: Návrh ceny
                - generic [ref=e224]: Plán vývoje
              - generic [ref=e225]:
                - generic [ref=e226]: AI vyhledávání
                - generic [ref=e227]: Plán vývoje
      - generic [ref=e228]:
        - paragraph [ref=e229]: Chytřejší každý měsíc
        - heading "Postaveno pro prodej s pomocí AI" [level=2] [ref=e230]
        - paragraph [ref=e231]: Aktivně zabudováváme AI nástroje do platformy — tady je, co už funguje, a co se chystá.
        - paragraph [ref=e232]: Označené položky jsou na blízkém plánu vývoje, zatím nejsou v provozu — raději vám to řekneme, než abychom slibovali víc, než umíme.
        - list [ref=e233]:
          - listitem [ref=e234]:
            - strong [ref=e235]: AI popisky produktů
            - generic [ref=e236]: Z názvu produktu a pár odrážek vznikne hotový, čtivý popisek.
          - listitem [ref=e237]:
            - strong [ref=e238]: Chytré návrhy cen
            - generic [ref=e239]: Plán vývoje — návrh ceny podle kategorie a cílové marže.
          - listitem [ref=e240]:
            - strong [ref=e241]: E-shop připravený na AI vyhledávání
            - generic [ref=e242]: Plán vývoje — strukturovaná data produktů, aby se e-shop dobře zobrazoval v AI nákupních asistentech.
    - generic [ref=e244]:
      - paragraph [ref=e245]: Ceník ve zkratce
      - heading "10 % z prodeje, s růstem klesá na 5 %" [level=2] [ref=e246]
      - paragraph [ref=e247]: Nastavte měsíční obrat vašeho e-shopu. Uvidíte přesně, kolik zaplatíte a kolik vám zůstane.
      - generic [ref=e248]:
        - generic [ref=e249]: Měsíční obrat
        - slider "Měsíční obrat" [ref=e250]: "10000"
        - generic [ref=e251]:
          - generic [ref=e252]: 10 000 Kč
          - generic [ref=e253]: 10 % provize
        - generic [ref=e254] [cursor=pointer]:
          - generic [ref=e255]: Nemám IČO ani firmu
          - checkbox "Nemám IČO ani firmu" [ref=e257]
        - generic [ref=e260]:
          - generic [ref=e261]:
            - generic [ref=e262]: Čistý zisk
            - generic [ref=e263]: 9 000 Kč
          - generic [ref=e264]:
            - generic [ref=e265]: Platíte MámToDoma
            - generic [ref=e266]: 1 000 Kč
        - paragraph [ref=e267]: Jakmile váš obrat za měsíc překročí 29 900 Kč, 10% provize se automaticky sníží na 5 % z celého obratu — čím víc prodáte, tím nižší sazbu máte.
        - paragraph [ref=e268]: Orientační výpočet. Platba je vždy vázána na skutečně uskutečněný prodej.
      - generic [ref=e269]:
        - heading "Proč je to lepší než měsíční tarif" [level=3] [ref=e270]
        - paragraph [ref=e271]: Tarif za 500 Kč měsíčně vás stojí peníze dřív, než prodáte jediný kus. Při 10% provizi platíte 0 Kč, pokud nic neprodáte — zájem platformy je od prvního dne stejný jako váš.
    - generic [ref=e273]:
      - paragraph [ref=e274]: Nemáte firmu?
      - heading "Prodávejte i bez živnostenského listu" [level=2] [ref=e275]
      - paragraph [ref=e276]: Domácí výrobkyně a výrobci bez vlastní firmy mohou prodávat prostřednictvím Smalljobs s.r.o. — my se postaráme o fakturaci a odvody, vy o výrobky.
      - generic [ref=e277]:
        - generic [ref=e278]:
          - heading "Máte vlastní firmu" [level=3] [ref=e279]
          - list [ref=e280]:
            - listitem [ref=e281]: ✓ Fakturujete a prodáváte vlastním jménem
            - listitem [ref=e282]: ✓ 10% provize platformy z prodejní ceny, se snížením na 5 % nad 29 900 Kč měsíčně
            - listitem [ref=e283]: ✓ Výplata podle standardního cyklu Stripe
        - generic [ref=e284]:
          - heading "Nemáte firmu — prodáváte přes nás" [level=3] [ref=e285]
          - list [ref=e286]:
            - listitem [ref=e287]: ✓ Smalljobs s.r.o. prodává vaším jménem jako komisionář
            - listitem [ref=e288]: ✓ 30% odvod z prodejní ceny — kryje provizi i sociální a zdravotní pojištění za vás
            - listitem [ref=e289]: ✓ Max. 12 000 Kč čistého zisku měsíčně bez IČO — víc se zadrží do registrace
            - listitem [ref=e290]: ✓ Výplata 60 dní po zaplacení — kryje lhůtu pro vrácení a reklamace
            - listitem [ref=e291]: ✓ Vy fyzicky řešíte vrácení, my neseme právní odpovědnost vůči zákazníkovi
      - generic [ref=e292]:
        - link "Zjistit víc o podmínkách" [ref=e293] [cursor=pointer]:
          - /url: /pricing#faq
        - paragraph [ref=e294]: Aktivace v administraci organizace vyžaduje odsouhlasení podmínek komisního prodeje.
    - generic [ref=e296]:
      - paragraph [ref=e297]: Ilustrační příklady
      - heading "Jak vypadá matematika v praxi" [level=2] [ref=e298]
      - paragraph [ref=e299]: Jsme nová platforma a zatím nemáme reálné příběhy prodejců, které bychom mohli sdílet — místo toho tu jsou poctivé modelové příklady, ne vymyšlené citace.
      - paragraph [ref=e300]: Jde o ilustrační modelové scénáře, ne o reálné zákazníky ani ověřené výsledky.
      - generic [ref=e301]:
        - generic [ref=e302]:
          - generic [ref=e303]: Příklad
          - 'heading "Příklad: výrobkyně svíček" [level=3] [ref=e304]'
          - generic [ref=e305]:
            - generic [ref=e306]: 20 000 Kč měsíčního obratu
            - strong [ref=e307]: 18 000 Kč zůstane
          - paragraph [ref=e308]: Deset objednávek týdně po ~500 Kč — 2 000 Kč jde na 10% provizi, nic dalšího.
        - generic [ref=e309]:
          - generic [ref=e310]: Příklad
          - 'heading "Příklad: výrobce kožených doplňků" [level=3] [ref=e311]'
          - generic [ref=e312]:
            - generic [ref=e313]: 60 000 Kč měsíčního obratu
            - strong [ref=e314]: 57 000 Kč zůstane
          - paragraph [ref=e315]: Nad 29 900 Kč obratu klesne 10 % provize na 5 % z celého měsíce — 3 000 Kč místo 6 000 Kč, ušetříte tedy 3 000 Kč.
        - generic [ref=e316]:
          - generic [ref=e317]: Příklad
          - 'heading "Příklad: prodejce doplňků stravy" [level=3] [ref=e318]'
          - generic [ref=e319]:
            - generic [ref=e320]: 150 000 Kč měsíčního obratu
            - strong [ref=e321]: 142 500 Kč zůstane
          - paragraph [ref=e322]: Ve velkém objemu platíte 5 % místo 10 % — 7 500 Kč místo 15 000 Kč. Čím víc prodáte, tím nižší je vaše efektivní sazba.
    - generic [ref=e324]:
      - paragraph [ref=e325]: Dokumentace
      - heading "Kompletní návod ke každé části administrace" [level=2] [ref=e326]
      - paragraph [ref=e327]: Podrobný průvodce e-shopem — od prvního přihlášení přes produkty, objednávky a ceny až po vzhled storefrontu. Každá stránka administrace má svůj vlastní návod.
      - generic [ref=e328]:
        - generic [ref=e329]:
          - img [ref=e331]
          - heading "Začínáme" [level=3] [ref=e334]
          - paragraph [ref=e335]: Nastavení, onboarding a přehled celé administrace krok za krokem.
        - generic [ref=e336]:
          - img [ref=e338]
          - heading "Katalog a prodej" [level=3] [ref=e341]
          - paragraph [ref=e342]: Produkty, sklad, objednávky, reklamace, kupóny i ceníky.
        - generic [ref=e343]:
          - img [ref=e345]
          - heading "Obsah a vzhled" [level=3] [ref=e348]
          - paragraph [ref=e349]: Stránky, blog, navigace, branding a kompletní nastavení storefrontu.
      - link "Otevřít dokumentaci" [ref=e351] [cursor=pointer]:
        - /url: /docs
    - generic [ref=e353]:
      - paragraph [ref=e354]: Až budete připraveni
      - heading "Založte si e-shop ještě dnes — zjistit, jestli to funguje, nic nestojí" [level=2] [ref=e355]
      - paragraph [ref=e356]: Založte e-shop, přidejte produkt a sledujte první objednávku. Pokud se nic neprodá, nezaplatíte nic.
      - generic [ref=e357]:
        - link "Založit e-shop zdarma" [ref=e358] [cursor=pointer]:
          - /url: /login?mode=signup
        - link "Zobrazit ceník" [ref=e359] [cursor=pointer]:
          - /url: /pricing
      - generic [ref=e360]:
        - generic [ref=e361]: 0 Kč na start
        - generic [ref=e362]: 10 % jen z prodeje
        - generic [ref=e363]: Spuštěno za pár minut
  - contentinfo [ref=e364]:
    - generic [ref=e365]:
      - generic [ref=e366]:
        - link "mamtodoma.cz" [ref=e367] [cursor=pointer]:
          - /url: /
          - img [ref=e368]
          - text: mamtodoma.cz
        - paragraph [ref=e371]: E-shop je zdarma. Vyděláváme, jen když vyděláte vy.
      - generic [ref=e372]:
        - heading "Produkt" [level=4] [ref=e373]
        - list [ref=e374]:
          - listitem [ref=e375]:
            - link "Funkce" [ref=e376] [cursor=pointer]:
              - /url: /features
          - listitem [ref=e377]:
            - link "Ceník" [ref=e378] [cursor=pointer]:
              - /url: /pricing
          - listitem [ref=e379]:
            - link "Reálné eshopy" [ref=e380] [cursor=pointer]:
              - /url: /eshopy
          - listitem [ref=e381]:
            - link "Zaměstnání" [ref=e382] [cursor=pointer]:
              - /url: /employment
          - listitem [ref=e383]:
            - link "Dokumentace" [ref=e384] [cursor=pointer]:
              - /url: /docs
      - generic [ref=e385]:
        - heading "Společnost" [level=4] [ref=e386]
        - list [ref=e387]:
          - listitem [ref=e388]:
            - link "O nás" [ref=e389] [cursor=pointer]:
              - /url: /about
          - listitem [ref=e390]:
            - link "Kontakt" [ref=e391] [cursor=pointer]:
              - /url: /contact
      - generic [ref=e392]:
        - heading "Právní informace" [level=4] [ref=e393]
        - list [ref=e394]:
          - listitem [ref=e395]:
            - link "Obchodní podmínky" [ref=e396] [cursor=pointer]:
              - /url: /terms
          - listitem [ref=e397]:
            - link "Zásady ochrany osobních údajů" [ref=e398] [cursor=pointer]:
              - /url: /privacy
          - listitem [ref=e399]:
            - link "Komisionářská smlouva" [ref=e400] [cursor=pointer]:
              - /url: /commissionaire
      - generic [ref=e401]:
        - heading "Kontakt" [level=4] [ref=e402]
        - list [ref=e403]:
          - listitem [ref=e404]: Smalljobs s.r.o.
          - listitem [ref=e405]: IČO 22312846
          - listitem [ref=e406]: U parčíku 47/24, Topolany, 779 00 Olomouc
      - generic [ref=e407]:
        - heading "Občasné tipy z e-commerce" [level=4] [ref=e408]
        - paragraph [ref=e409]: Žádný spam — nejvýše pár e-mailů měsíčně.
        - generic [ref=e410]:
          - textbox "vas@email.cz" [ref=e411]
          - button "Odebírat" [ref=e412] [cursor=pointer]
    - generic [ref=e413]: © 2026 mamtodoma.cz. Všechna práva vyhrazena.
  - generic [ref=e416]:
    - button "Menu" [ref=e417]:
      - img [ref=e419]
      - generic: Menu
    - button "Inspect" [ref=e423]:
      - img [ref=e425]
      - generic: Inspect
    - button "Audit" [ref=e427]:
      - generic [ref=e428]:
        - img [ref=e429]
        - img [ref=e432]
      - generic: Audit
    - button "Settings" [ref=e435]:
      - img [ref=e437]
      - generic: Settings
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { loginAs, psql } from "./helpers";
  3  | 
  4  | const PARTY_ID = "11111111-1111-1111-1111-111111111111";
  5  | const PARTY2_ID = "11111111-2222-2222-2222-111111111111";
  6  | 
  7  | test("cross-tenant product access is blocked", async ({ browser }) => {
  8  |   const page = await browser.newPage();
  9  |   await loginAs(page, "admin@test.com", "Admin1234!");
> 10 |   await page.goto(`/admin/products?party=${PARTY2_ID}`);
     |              ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  11 |   await page.waitForLoadState("networkidle");
  12 |   // Admin is not member of PARTY2 - should not see PARTY2 products
  13 |   const body = await page.content();
  14 |   expect(body).not.toContain("Other Organisation");
  15 |   await page.close();
  16 | });
  17 | 
  18 | test("service_role is not exposed to client", async ({ page }) => {
  19 |   await page.goto("/shop");
  20 |   const content = await page.content();
  21 |   expect(content).not.toContain("service_role");
  22 | });
  23 | 
```