# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 32-packeta-verification.spec.ts >> 32 — Packeta verification: guest tracking visibility + admin cancel/return (mock mode) >> 32-01 guest (unauthenticated) checkout with Packeta: does order-confirmation show tracking?
- Location: tests/e2e/32-packeta-verification.spec.ts:90:3

# Error details

```
Error: Guest should see their tracking number on the confirmation page

expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - link "mamtodoma.cz" [ref=e4] [cursor=pointer]:
        - /url: /
      - navigation [ref=e5]:
        - link "Funkce" [ref=e6] [cursor=pointer]:
          - /url: /features
        - link "Ceník" [ref=e7] [cursor=pointer]:
          - /url: /pricing
        - link "Šablony" [ref=e8] [cursor=pointer]:
          - /url: /templates
        - link "O nás" [ref=e9] [cursor=pointer]:
          - /url: /about
        - link "Kontakt" [ref=e10] [cursor=pointer]:
          - /url: /contact
      - button "O Owner ▾" [ref=e13] [cursor=pointer]:
        - generic [ref=e14]: O
        - generic [ref=e15]: Owner
        - generic [ref=e16]: ▾
  - main [ref=e17]:
    - generic [ref=e20]:
      - paragraph [ref=e21]: Pro každého, kdo má co prodávat
      - heading "Váš e-shop bez vstupních nákladů — vyděláváme, jen když vyděláte vy" [level=1] [ref=e22]
      - paragraph [ref=e23]: "Spusťte si plnohodnotný e-shop bez vstupních nákladů ještě dnes. Žádný poplatek za založení, žádná měsíční platba — nikdy. Vyděláváme jen tehdy, když vyděláte vy: bereme si 10 % pouze z uskutečněného prodeje, 90 % z každé objednávky zůstává vám."
      - generic [ref=e24]:
        - textbox "vas@email.cz" [ref=e25]
        - button "Začít prodávat zdarma" [ref=e26] [cursor=pointer]
      - paragraph [ref=e27]: Bez platební karty. Bez měsíčního poplatku. Není co rušit.
      - paragraph [ref=e28]: 0 Kč na start · 0 Kč měsíčně · 10 % jen z prodeje
    - generic [ref=e32]:
      - paragraph [ref=e33]: Zakládající prodejci
      - heading "Jsme úplně noví. Přesně proto je teď ten nejlepší čas začít." [level=2] [ref=e34]
      - paragraph [ref=e35]: mamtodoma.cz právě spustilo provoz. Nebudeme předstírat, že už máme tisíce e-shopů — místo toho vám dáme přesná čísla toho, co jako zakládající prodejce získáte.
      - generic [ref=e36]:
        - generic [ref=e37]:
          - heading "0 % za založení, 0 Kč měsíčně" [level=3] [ref=e38]
          - paragraph [ref=e39]: Žádná zkušební verze s háčkem. E-shop je zdarma po celou dobu, kdy ho používáte.
        - generic [ref=e40]:
          - heading "90 % z každého prodeje zůstává vám" [level=3] [ref=e41]
          - paragraph [ref=e42]: Vyděláváme jen tehdy, když vyděláte vy — 10 % z uskutečněné objednávky, nic víc, nic skrytě.
        - generic [ref=e43]:
          - heading "Spuštěno za pár minut, ne měsíců" [level=3] [ref=e44]
          - paragraph [ref=e45]: Bez agentury, bez programátora, bez čekací listiny. První produkt nahrajete a prodáváte ještě dnes.
      - link "Zarezervujte si název e-shopu" [ref=e47] [cursor=pointer]:
        - /url: "#hero"
    - generic [ref=e49]:
      - paragraph [ref=e50]: Vše v ceně
      - heading "Skutečná e-commerce platforma, ne hračka na tvorbu stránek" [level=2] [ref=e51]
      - paragraph [ref=e52]: Každá funkce níže je už dnes součástí platformy, na které právě stojíte.
      - generic [ref=e53]:
        - generic [ref=e54]:
          - img [ref=e55]
          - heading "Kompletní e-shop a CMS" [level=3] [ref=e58]
          - paragraph [ref=e59]: Vlastní stránky, blog, tým, FAQ, navigace i patička — vše editovatelné bez zásahu do kódu.
        - generic [ref=e60]:
          - img [ref=e61]
          - heading "Vlastní doména" [level=3] [ref=e64]
          - paragraph [ref=e65]: Provozujte e-shop na vlastní doméně, nebo zdarma na subdoméně — vaše značka, ne naše.
        - generic [ref=e66]:
          - img [ref=e67]
          - heading "Týmový přístup s reálnými oprávněními" [level=3] [ref=e72]
          - paragraph [ref=e73]: Přizvěte kolegy a dejte jim přesně takový přístup, jaký potřebují — ne plná admin práva automaticky.
        - generic [ref=e74]:
          - img [ref=e75]
          - heading "Objednávky, sklad a reklamace" [level=3] [ref=e78]
          - paragraph [ref=e79]: Skladové zásoby, stavy objednávek i vyřizování reklamací už od prvního dne.
        - generic [ref=e80]:
          - img [ref=e81]
          - heading "Platby přes Stripe" [level=3] [ref=e83]
          - paragraph [ref=e84]: Bezpečný a důvěryhodný způsob platby, který vaši zákazníci už znají.
        - generic [ref=e85]:
          - img [ref=e86]
          - heading "Volitelný design" [level=3] [ref=e90]
          - paragraph [ref=e91]: Vyberte rozvržení a styl produktových karet, který sedí vaší značce — bez grafika.
    - generic [ref=e93]:
      - paragraph [ref=e94]: Jak začít
      - heading "Tři kroky. Žádný tarif nevybíráte, protože existuje jen jeden." [level=2] [ref=e95]
      - paragraph [ref=e96]: Na rozdíl od platforem se šesti tarify na porovnání existuje jen jeden způsob, jak mamtodoma.cz používat.
      - generic [ref=e97]:
        - generic [ref=e98]:
          - generic [ref=e99]: "1"
          - heading "Založte si e-shop" [level=3] [ref=e100]
          - paragraph [ref=e101]: Zadejte e-mail, pojmenujte e-shop a jste v administraci.
        - generic [ref=e102]:
          - generic [ref=e103]: "2"
          - heading "Nahrajte produkty" [level=3] [ref=e104]
          - paragraph [ref=e105]: Fotky, ceny, sklad — přidejte jeden produkt nebo celý katalog.
        - generic [ref=e106]:
          - generic [ref=e107]: "3"
          - heading "Sdílejte odkaz a prodávejte" [level=3] [ref=e108]
          - paragraph [ref=e109]: Váš e-shop je ihned online. My vyděláváme, až vyděláte vy.
    - generic [ref=e111]:
      - generic [ref=e112]:
        - paragraph [ref=e113]: Design
        - heading "Vypadá jako vaše značka, ne jako šablona" [level=2] [ref=e114]
        - paragraph [ref=e115]: Vyberte rozvržení a způsob prezentace produktů podle toho, jak prodáváte — kdykoli ho můžete změnit.
        - list [ref=e116]:
          - listitem [ref=e117]:
            - strong [ref=e118]: Přednastavená rozvržení
            - generic [ref=e119]: Několik variant úvodní i produktové stránky pro různé typy katalogů.
          - listitem [ref=e120]:
            - strong [ref=e121]: Styly produktových karet
            - generic [ref=e122]: Zvolte prezentaci produktů — kompaktní mřížka, editoriální styl, nebo galerie.
          - listitem [ref=e123]:
            - strong [ref=e124]: Plná kontrola nad obsahem
            - generic [ref=e125]: Hero bannery, sloupce v patičce i obsahové stránky jsou plně ve vašich rukou.
        - link "Podívejte se, jak to vypadá" [ref=e126] [cursor=pointer]:
          - /url: /templates
      - generic [ref=e128]:
        - generic [ref=e133]: vaseznacka.cz
        - generic [ref=e134]:
          - button "Mřížka" [ref=e135] [cursor=pointer]
          - button "Editoriál" [ref=e136] [cursor=pointer]
          - button "Galerie" [ref=e137] [cursor=pointer]
        - generic [ref=e138]:
          - generic [ref=e139]:
            - generic [ref=e145]: 🛍
            - generic [ref=e146]:
              - generic [ref=e147]:
                - generic [ref=e149]: Tričko
                - generic [ref=e150]: 490 Kč
              - generic [ref=e151]:
                - generic [ref=e153]: Mikina
                - generic [ref=e154]: 550 Kč
              - generic [ref=e155]:
                - generic [ref=e157]: Kšiltovka
                - generic [ref=e158]: 610 Kč
              - generic [ref=e159]:
                - generic [ref=e161]: Batoh
                - generic [ref=e162]: 670 Kč
              - generic [ref=e163]:
                - generic [ref=e165]: Ponožky
                - generic [ref=e166]: 730 Kč
              - generic [ref=e167]:
                - generic [ref=e169]: Šátek
                - generic [ref=e170]: 790 Kč
          - generic:
            - generic:
              - generic:
                - generic: Nová kolekce
                - generic: Podzim / Zima
                - generic: Zobrazit kolekci
            - generic:
              - generic:
                - generic: Redakční výběr
              - generic:
                - generic: Nejprodávanější
    - generic [ref=e172]:
      - generic [ref=e174]:
        - generic [ref=e179]: app.vaseznacka.cz/admin/products
        - generic [ref=e180]:
          - complementary [ref=e181]:
            - generic [ref=e182]: 📊
            - generic [ref=e183]: 🛍️
            - generic [ref=e184]: 📋
            - generic [ref=e185]: 👥
            - generic [ref=e186]: 💰
          - generic [ref=e187]:
            - generic [ref=e188]:
              - generic [ref=e189]: Název produktu
              - generic [ref=e190]: Pánská bunda Alpine 2.0
            - generic [ref=e191]:
              - generic [ref=e192]: voděodolná
              - generic [ref=e193]: lehká
              - generic [ref=e194]: kapuce
            - generic [ref=e195]:
              - generic [ref=e196]:
                - generic [ref=e197]: ✨ AI popis produktu
                - generic [ref=e198]: generuji…
              - paragraph [ref=e199]: L
            - generic [ref=e201]:
              - generic [ref=e202]:
                - generic [ref=e203]: ✓ Dámské šaty Riviera
                - generic [ref=e204]: před 2 min
              - generic [ref=e205]:
                - generic [ref=e206]: ✓ Sportovní láhev 750 ml
                - generic [ref=e207]: před 6 min
            - generic [ref=e208]:
              - generic [ref=e209]:
                - generic [ref=e210]: Návrh ceny
                - generic [ref=e211]: Plán vývoje
              - generic [ref=e212]:
                - generic [ref=e213]: AI vyhledávání
                - generic [ref=e214]: Plán vývoje
      - generic [ref=e215]:
        - paragraph [ref=e216]: Chytřejší každý měsíc
        - heading "Postaveno pro prodej s pomocí AI" [level=2] [ref=e217]
        - paragraph [ref=e218]: Aktivně zabudováváme AI nástroje do platformy — tady je, co už funguje, a co se chystá.
        - paragraph [ref=e219]: Označené položky jsou na blízkém plánu vývoje, zatím nejsou v provozu — raději vám to řekneme, než abychom slibovali víc, než umíme.
        - list [ref=e220]:
          - listitem [ref=e221]:
            - strong [ref=e222]: AI popisky produktů
            - generic [ref=e223]: Z názvu produktu a pár odrážek vznikne hotový, čtivý popisek.
          - listitem [ref=e224]:
            - strong [ref=e225]: Chytré návrhy cen
            - generic [ref=e226]: Plán vývoje — návrh ceny podle kategorie a cílové marže.
          - listitem [ref=e227]:
            - strong [ref=e228]: E-shop připravený na AI vyhledávání
            - generic [ref=e229]: Plán vývoje — strukturovaná data produktů, aby se e-shop dobře zobrazoval v AI nákupních asistentech.
    - generic [ref=e231]:
      - paragraph [ref=e232]: Ceník ve zkratce
      - 'heading "Jedno číslo: 10 %" [level=2] [ref=e233]'
      - paragraph [ref=e234]: Nastavte prodejní cenu. Uvidíte přesně, kolik vám zůstane. Žádné tarify, žádné skryté transakční poplatky navrch.
      - generic [ref=e235]:
        - generic [ref=e236]: Prodejní cena
        - slider "Prodejní cena" [ref=e237]: "1000"
        - generic [ref=e238]: 1 000 Kč
        - generic [ref=e239]:
          - generic [ref=e240]:
            - generic [ref=e241]: Zůstává vám
            - generic [ref=e242]: 900 Kč
          - generic [ref=e243]:
            - generic [ref=e244]: Naše provize (10 %)
            - generic [ref=e245]: 100 Kč
          - generic [ref=e246]:
            - generic [ref=e247]: Měsíční náklad na provoz e-shopu
            - generic [ref=e248]: 0 Kč
        - paragraph [ref=e249]: Toto je celý ceník. Žádné druhé číslo neexistuje.
      - generic [ref=e250]:
        - heading "Proč je to lepší než měsíční tarif" [level=3] [ref=e251]
        - paragraph [ref=e252]: Tarif za 500 Kč měsíčně vás stojí peníze dřív, než prodáte jediný kus. Při 10% provizi platíte 0 Kč, pokud nic neprodáte — zájem platformy je od prvního dne stejný jako váš.
    - generic [ref=e254]:
      - paragraph [ref=e255]: Nemáte firmu?
      - heading "Prodávejte i bez živnostenského listu" [level=2] [ref=e256]
      - paragraph [ref=e257]: Domácí výrobkyně a výrobci bez vlastní firmy mohou prodávat prostřednictvím Smalljobs s.r.o. — my se postaráme o fakturaci a odvody, vy o výrobky.
      - generic [ref=e258]:
        - generic [ref=e259]:
          - heading "Máte vlastní firmu" [level=3] [ref=e260]
          - list [ref=e261]:
            - listitem [ref=e262]: ✓ Fakturujete a prodáváte vlastním jménem
            - listitem [ref=e263]: ✓ 10% provize platformy z prodejní ceny
            - listitem [ref=e264]: ✓ Výplata podle standardního cyklu Stripe
        - generic [ref=e265]:
          - heading "Nemáte firmu — prodáváte přes nás" [level=3] [ref=e266]
          - list [ref=e267]:
            - listitem [ref=e268]: ✓ Smalljobs s.r.o. prodává vaším jménem jako komisionář
            - listitem [ref=e269]: ✓ 10% provize + DPH (jakmile bude Smalljobs plátcem DPH)
            - listitem [ref=e270]: ✓ Výplata 60 dní po zaplacení — kryje lhůtu pro vrácení a reklamace
            - listitem [ref=e271]: ✓ Vy fyzicky řešíte vrácení, my neseme právní odpovědnost vůči zákazníkovi
      - generic [ref=e272]:
        - link "Zjistit víc o podmínkách" [ref=e273] [cursor=pointer]:
          - /url: /pricing#faq
        - paragraph [ref=e274]: Aktivace v administraci organizace vyžaduje odsouhlasení podmínek komisního prodeje.
    - generic [ref=e276]:
      - paragraph [ref=e277]: Ilustrační příklady
      - heading "Jak vypadá matematika v praxi" [level=2] [ref=e278]
      - paragraph [ref=e279]: Jsme nová platforma a zatím nemáme reálné příběhy prodejců, které bychom mohli sdílet — místo toho tu jsou poctivé modelové příklady, ne vymyšlené citace.
      - paragraph [ref=e280]: Jde o ilustrační modelové scénáře, ne o reálné zákazníky ani ověřené výsledky.
      - generic [ref=e281]:
        - generic [ref=e282]:
          - generic [ref=e283]: Příklad
          - 'heading "Příklad: výrobkyně svíček" [level=3] [ref=e284]'
          - generic [ref=e285]:
            - generic [ref=e286]: 20 000 Kč měsíčního obratu
            - strong [ref=e287]: 18 000 Kč zůstane
          - paragraph [ref=e288]: Deset objednávek týdně po ~500 Kč — 2 000 Kč jde na provizi, nic dalšího.
        - generic [ref=e289]:
          - generic [ref=e290]: Příklad
          - 'heading "Příklad: výrobce kožených doplňků" [level=3] [ref=e291]'
          - generic [ref=e292]:
            - generic [ref=e293]: 60 000 Kč měsíčního obratu
            - strong [ref=e294]: 54 000 Kč zůstane
          - paragraph [ref=e295]: Vyšší hodnota objednávky, stejných rovných 10 % — žádná změna tarifu, žádné vyjednávání.
        - generic [ref=e296]:
          - generic [ref=e297]: Příklad
          - 'heading "Příklad: prodejce doplňků stravy" [level=3] [ref=e298]'
          - generic [ref=e299]:
            - generic [ref=e300]: 150 000 Kč měsíčního obratu
            - strong [ref=e301]: 135 000 Kč zůstane
          - paragraph [ref=e302]: I ve větším objemu zůstává provize stejná a předvídatelná — spočítáte si ji jednou.
    - generic [ref=e304]:
      - paragraph [ref=e305]: Až budete připraveni
      - heading "Založte si e-shop ještě dnes — zjistit, jestli to funguje, nic nestojí" [level=2] [ref=e306]
      - paragraph [ref=e307]: Založte e-shop, přidejte produkt a sledujte první objednávku. Pokud se nic neprodá, nezaplatíte nic.
      - generic [ref=e308]:
        - link "Založit e-shop zdarma" [ref=e309] [cursor=pointer]:
          - /url: "#hero"
        - link "Zobrazit ceník" [ref=e310] [cursor=pointer]:
          - /url: /pricing
      - generic [ref=e311]:
        - generic [ref=e312]: 0 Kč na start
        - generic [ref=e313]: 10 % jen z prodeje
        - generic [ref=e314]: Spuštěno za pár minut
  - contentinfo [ref=e315]:
    - generic [ref=e316]:
      - generic [ref=e317]:
        - text: mamtodoma.cz
        - paragraph [ref=e318]: E-shop je zdarma. Vyděláváme, jen když vyděláte vy.
      - generic [ref=e319]:
        - heading "Produkt" [level=4] [ref=e320]
        - list [ref=e321]:
          - listitem [ref=e322]:
            - link "Funkce" [ref=e323] [cursor=pointer]:
              - /url: /features
          - listitem [ref=e324]:
            - link "Ceník" [ref=e325] [cursor=pointer]:
              - /url: /pricing
          - listitem [ref=e326]:
            - link "Šablony" [ref=e327] [cursor=pointer]:
              - /url: /templates
      - generic [ref=e328]:
        - heading "Společnost" [level=4] [ref=e329]
        - list [ref=e330]:
          - listitem [ref=e331]:
            - link "O nás" [ref=e332] [cursor=pointer]:
              - /url: /about
          - listitem [ref=e333]:
            - link "Kontakt" [ref=e334] [cursor=pointer]:
              - /url: /contact
      - generic [ref=e335]:
        - heading "Právní informace" [level=4] [ref=e336]
        - list [ref=e337]:
          - listitem [ref=e338]:
            - link "Obchodní podmínky" [ref=e339] [cursor=pointer]:
              - /url: /terms
          - listitem [ref=e340]:
            - link "Soukromí a cookies" [ref=e341] [cursor=pointer]:
              - /url: /privacy
      - generic [ref=e342]:
        - heading "Občasné tipy z e-commerce" [level=4] [ref=e343]
        - paragraph [ref=e344]: Žádný spam — nejvýše pár e-mailů měsíčně.
        - generic [ref=e345]:
          - textbox "vas@email.cz" [ref=e346]
          - button "Odebírat" [ref=e347] [cursor=pointer]
    - generic [ref=e348]: © 2026 mamtodoma.cz. Všechna práva vyhrazena.
  - generic [ref=e351]:
    - button "Menu" [ref=e352]:
      - img [ref=e354]
      - generic: Menu
    - button "Inspect" [ref=e358]:
      - img [ref=e360]
      - generic: Inspect
    - button "Audit" [ref=e362]:
      - img [ref=e364]
      - generic: Audit
    - button "Settings" [ref=e367]:
      - img [ref=e369]
      - generic: Settings
```

# Test source

```ts
  28  | function cleanup() {
  29  |   psql(`${replica}
  30  |     DELETE FROM public.order_shipments WHERE order_id IN (
  31  |       SELECT DISTINCT order_id FROM public.order_items WHERE product_id IN ('${PROD_GUEST.id}', '${PROD_CANCEL.id}')
  32  |     ) OR order_id IN ('e0000005-0000-0000-0000-000000000001', 'e0000005-0000-0000-0000-000000000002');
  33  |     DELETE FROM public.orders WHERE id IN (
  34  |       SELECT DISTINCT order_id FROM public.order_items WHERE product_id IN ('${PROD_GUEST.id}', '${PROD_CANCEL.id}')
  35  |     ) OR id IN ('e0000005-0000-0000-0000-000000000001', 'e0000005-0000-0000-0000-000000000002');
  36  |     DELETE FROM public.addresses WHERE id IN ('e0000004-0000-0000-0000-000000000001', 'e0000004-0000-0000-0000-000000000002');
  37  |     DELETE FROM public.customers WHERE party_id = '${PARTY_ID}' AND email IN ('${GUEST_EMAIL}', 'e2e-cancel-packeta@example.com', 'e2e-return-packeta@example.com');
  38  |     DELETE FROM public.inventory_items WHERE id IN ('${INV_GUEST}', '${INV_CANCEL}');
  39  |     DELETE FROM public.products WHERE id IN ('${PROD_GUEST.id}', '${PROD_CANCEL.id}');
  40  |   ${defaultRole}`);
  41  | }
  42  | 
  43  | async function addToCartAsGuest(page: Page, slug: string) {
  44  |   await page.goto(`${BASE}/shop/${slug}`);
  45  |   await page.waitForLoadState("networkidle");
  46  |   await page.locator("#cart-form button[type='submit']").click();
  47  |   await page.waitForTimeout(500);
  48  | }
  49  | 
  50  | async function fillAddressAndPay(page: Page, opts: { email?: string; firstName: string; lastName: string; line1: string; city: string; postal: string }) {
  51  |   await page.locator('input[name="shipping_provider"][value="packeta"]').check();
  52  |   if (opts.email) await page.fill("input[name='email']", opts.email);
  53  |   await page.fill("input[name='first_name']", opts.firstName);
  54  |   await page.fill("input[name='last_name']", opts.lastName);
  55  |   await page.fill("input[name='line1']", opts.line1);
  56  |   await page.fill("input[name='city']", opts.city);
  57  |   await page.fill("input[name='postal_code']", opts.postal);
  58  |   await page.locator("form.address-form button[type='submit']").click();
  59  |   await page.waitForURL(/checkout\.stripe\.com/, { timeout: 15000 });
  60  |   await page.waitForTimeout(1500);
  61  |   await page.getByPlaceholder("email@example.com").fill(opts.email ?? "buyer@example.com");
  62  |   await page.getByPlaceholder("1234 1234 1234 1234").fill(CARD.number);
  63  |   await page.getByPlaceholder("MM / YY").fill(CARD.expiry);
  64  |   await page.getByPlaceholder("CVC").fill(CARD.cvc);
  65  |   await page.getByPlaceholder("Full name on card").fill(`${opts.firstName} ${opts.lastName}`);
  66  |   await page.getByRole("button", { name: "Pay" }).click();
  67  |   await page.waitForURL(/order-confirmation/, { timeout: 20000 });
  68  | }
  69  | 
  70  | test.describe("32 — Packeta verification: guest tracking visibility + admin cancel/return (mock mode)", () => {
  71  |   test.describe.configure({ mode: "serial" });
  72  | 
  73  |   let ownerPage: Page;
  74  |   let guestOrderNumber = "";
  75  |   let cancelOrderNumber = "";
  76  | 
  77  |   test.beforeAll(async ({ browser }: { browser: Browser }) => {
  78  |     cleanup();
  79  |     seed();
  80  |     ownerPage = await browser.newPage();
  81  |     await loginAs(ownerPage, OWNER.email, OWNER.password);
  82  |     await ownerPage.context().addCookies([{ name: "activePartyId", value: PARTY_ID, domain: "localhost", path: "/" }]);
  83  |   });
  84  | 
  85  |   test.afterAll(async () => {
  86  |     cleanup();
  87  |     await ownerPage.close();
  88  |   });
  89  | 
  90  |   test("32-01 guest (unauthenticated) checkout with Packeta: does order-confirmation show tracking?", async ({ browser }) => {
  91  |     const guestPage = await browser.newPage();
  92  |     await addToCartAsGuest(guestPage, PROD_GUEST.slug);
  93  |     await guestPage.goto(`${BASE}/shop/checkout`);
  94  |     await guestPage.waitForLoadState("networkidle");
  95  |     await screenshot(guestPage, "32-01-guest-checkout-page");
  96  | 
  97  |     await fillAddressAndPay(guestPage, {
  98  |       email: GUEST_EMAIL,
  99  |       firstName: "Guest",
  100 |       lastName: "Buyer",
  101 |       line1: "Hostovská 1",
  102 |       city: "Plzeň",
  103 |       postal: "30100",
  104 |     });
  105 |     await screenshot(guestPage, "32-01-guest-order-confirmation");
  106 | 
  107 |     const url = new URL(guestPage.url());
  108 |     guestOrderNumber = url.searchParams.get("order") ?? "";
  109 |     expect(guestOrderNumber).toMatch(/^ORD-/);
  110 | 
  111 |     // Ground truth: the shipment WAS created server-side (service-role client bypasses RLS).
  112 |     const dbResult = psql(
  113 |       `SELECT os.tracking_number FROM public.order_shipments os
  114 |        JOIN public.orders o ON o.id = os.order_id WHERE o.order_number = '${guestOrderNumber}';`
  115 |     );
  116 |     console.log("[32-01] DB tracking_number for guest order:", dbResult);
  117 |     expect(dbResult).toMatch(/^\s*Z\d+/m);
  118 | 
  119 |     // What the guest actually sees on the page they're looking at right now.
  120 |     const trackingVisible = await guestPage.locator(".tracking-line").isVisible().catch(() => false);
  121 |     console.log("[32-01] Tracking line visible to guest on order-confirmation page:", trackingVisible);
  122 |     await guestPage.close();
  123 | 
  124 |     // This assertion is expected to FAIL if the RLS gap suspected from code review
  125 |     // (order-confirmation.astro uses the session-bound client; "Customers read own
  126 |     // orders"/"...order_shipments" policies are `TO authenticated` only, no anon grant)
  127 |     // is real. Left as a real assertion (not soft) so the report reflects true pass/fail.
> 128 |     expect(trackingVisible, "Guest should see their tracking number on the confirmation page").toBe(true);
      |                                                                                                ^ Error: Guest should see their tracking number on the confirmation page
  129 |   });
  130 | 
  131 |   test("32-02 admin creates Packeta shipment, then cancels it", async () => {
  132 |     // Seed a paid order directly (faster/more deterministic than another full checkout)
  133 |     // then drive the real create_shipment -> cancel_shipment actions through the admin UI.
  134 |     const custId = "e0000003-0000-0000-0000-000000000001";
  135 |     const addrId = "e0000004-0000-0000-0000-000000000001";
  136 |     const orderId = "e0000005-0000-0000-0000-000000000001";
  137 |     cancelOrderNumber = "ORD-E2E-CANCEL-01";
  138 |     psql(`${replica}
  139 |       INSERT INTO public.customers (id, party_id, first_name, last_name, email, phone, is_active)
  140 |       VALUES ('${custId}', '${PARTY_ID}', 'Cancel', 'Buyer', 'e2e-cancel-packeta@example.com', '+420123456789', true)
  141 |       ON CONFLICT (id) DO NOTHING;
  142 |       INSERT INTO public.addresses (id, customer_id, type, first_name, last_name, line1, city, postal_code, country_code)
  143 |       VALUES ('${addrId}', '${custId}', 'shipping', 'Cancel', 'Buyer', 'Zrušená 1', 'Ostrava', '70200', 'CZ')
  144 |       ON CONFLICT (id) DO NOTHING;
  145 |       INSERT INTO public.orders (id, party_id, customer_id, order_number, status, payment_status, subtotal, shipping_amount, total_amount, currency, shipping_address_id)
  146 |       VALUES ('${orderId}', '${PARTY_ID}', '${custId}', '${cancelOrderNumber}', 'processing', 'paid', ${PROD_CANCEL.price}, 79, ${PROD_CANCEL.price + 79}, 'CZK', '${addrId}');
  147 |       INSERT INTO public.order_shipments (order_id, party_id, provider, status, shipping_cost, weight_kg)
  148 |       VALUES ('${orderId}', '${PARTY_ID}', 'packeta', 'pending', 79, 1);
  149 |     ${defaultRole}`);
  150 | 
  151 |     await ownerPage.goto(`${BASE}/admin/orders/${orderId}`);
  152 |     await ownerPage.waitForLoadState("networkidle");
  153 |     await screenshot(ownerPage, "32-02-admin-order-before-shipment");
  154 | 
  155 |     await ownerPage.locator('form:has(input[value="create_shipment"]) button[type="submit"]').click();
  156 |     await ownerPage.waitForLoadState("networkidle");
  157 |     await screenshot(ownerPage, "32-02-admin-shipment-created");
  158 |     await expect(ownerPage.getByText("PACKETA", { exact: true })).toBeVisible();
  159 |     await expect(ownerPage.locator(".alert-error")).not.toBeVisible();
  160 | 
  161 |     const afterCreate = psql(`SELECT status, provider_shipment_id, tracking_number, consignment_code FROM public.order_shipments WHERE order_id = '${orderId}';`);
  162 |     console.log("[32-02] After create_shipment:", afterCreate);
  163 |     expect(afterCreate).toContain("label_ready");
  164 | 
  165 |     await ownerPage.locator('form:has(input[value="cancel_shipment"]) button[type="submit"]').click();
  166 |     await ownerPage.waitForLoadState("networkidle");
  167 |     await screenshot(ownerPage, "32-02-admin-shipment-cancelled");
  168 |     await expect(ownerPage.locator(".alert-error")).not.toBeVisible();
  169 | 
  170 |     const afterCancel = psql(`SELECT status, cancelled_at FROM public.order_shipments WHERE order_id = '${orderId}';`);
  171 |     console.log("[32-02] After cancel_shipment:", afterCancel);
  172 |     expect(afterCancel).toContain("cancelled");
  173 |     expect(afterCancel).not.toContain("cancelled_at    | \n"); // cancelled_at must be set, not null
  174 |   });
  175 | 
  176 |   test("32-03 admin creates a Packeta return shipment on a shipped order + consignment code shown", async () => {
  177 |     const custId = "e0000003-0000-0000-0000-000000000002";
  178 |     const addrId = "e0000004-0000-0000-0000-000000000002";
  179 |     const orderId = "e0000005-0000-0000-0000-000000000002";
  180 |     psql(`${replica}
  181 |       INSERT INTO public.customers (id, party_id, first_name, last_name, email, phone, is_active)
  182 |       VALUES ('${custId}', '${PARTY_ID}', 'Return', 'Buyer', 'e2e-return-packeta@example.com', '+420123456789', true)
  183 |       ON CONFLICT (id) DO NOTHING;
  184 |       INSERT INTO public.addresses (id, customer_id, type, first_name, last_name, line1, city, postal_code, country_code)
  185 |       VALUES ('${addrId}', '${custId}', 'shipping', 'Return', 'Buyer', 'Vratná 2', 'Liberec', '46001', 'CZ')
  186 |       ON CONFLICT (id) DO NOTHING;
  187 |       INSERT INTO public.orders (id, party_id, customer_id, order_number, status, payment_status, subtotal, shipping_amount, total_amount, currency, shipping_address_id)
  188 |       VALUES ('${orderId}', '${PARTY_ID}', '${custId}', 'ORD-E2E-RETURN-01', 'processing', 'paid', ${PROD_CANCEL.price}, 79, ${PROD_CANCEL.price + 79}, 'CZK', '${addrId}');
  189 |       INSERT INTO public.order_shipments (order_id, party_id, provider, status, shipping_cost, weight_kg, provider_shipment_id, tracking_number, is_mock)
  190 |       VALUES ('${orderId}', '${PARTY_ID}', 'packeta', 'label_ready', 79, 1, 'MOCK-PACKETA-SEEDED-01', 'Z0000000001', true);
  191 |     ${defaultRole}`);
  192 | 
  193 |     await ownerPage.goto(`${BASE}/admin/orders/${orderId}`);
  194 |     await ownerPage.waitForLoadState("networkidle");
  195 |     await screenshot(ownerPage, "32-03-admin-order-before-return");
  196 | 
  197 |     await ownerPage.locator('form:has(input[value="create_return_shipment"]) button[type="submit"]').click();
  198 |     await ownerPage.waitForLoadState("networkidle");
  199 |     await screenshot(ownerPage, "32-03-admin-return-created");
  200 |     await expect(ownerPage.locator(".alert-error")).not.toBeVisible();
  201 | 
  202 |     const afterReturn = psql(
  203 |       `SELECT return_provider_shipment_id, return_tracking_number, return_password FROM public.order_shipments WHERE order_id = '${orderId}';`
  204 |     );
  205 |     console.log("[32-03] After create_return_shipment:", afterReturn);
  206 |     expect(afterReturn).toMatch(/\|\s*\d{6}\s*\n/);
  207 |   });
  208 | });
  209 | 
```