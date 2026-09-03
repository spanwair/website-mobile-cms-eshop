# Bod 8/8 - PPL reálná mapa pickup-pointů - analýza a implementační plán

Status: ANALÝZA A PLÁN, ŽÁDNÁ IMPLEMENTACE.
Branch: `plan/ppl-pickup-map`.
Autor: agent (analytická session), 2026-09-03.

## Shrnutí pro netrpělivé

Klíčové zjištění mění charakter celého úkolu: **reálná PPL mapa/widget už je v kódu naimplementovaná**, včetně skutečného oficiálního PPL JS widgetu (Widget 2.0), server-side booking API (CPL API) a e2e testů.
Na dev serveru se dnes zobrazují mock pickup-pointy ("Míčková data") čistě proto, že chybí jedna konkrétní hodnota: `PUBLIC_PPL_WIDGET_API_KEY`.
`PUBLIC_SHIPPING_MOCK_MODE` je na dev serveru dokonce už `false` (viz `.env.development`, řádek `PUBLIC_SHIPPING_MOCK_MODE=false`) - jediná chybějící věc je samotný widget klíč od PPL.

Doporučené řešení proto není "postavit mapu" (Fáze 3, varianta 2), ale **varianta 1 - použít existující oficiální PPL widget integraci** a doplnit jednu chybějící bezpečnostní vrstvu (server-side validace vybraného pickup-pointu), která u PPL na rozdíl od Packety chybí.

---

## Fáze 1 - Analýza současného stavu

### Kde a jak jsou dnes mock pickup-pointy definované

Hardcoded pole přímo v komponentě, žádný JSON soubor ani DB seed:

`website/src/components/shop/ShippingProviderSelector.astro`, řádky 25-36:

```ts
const MOCK_POINTS: Record<string, { id: string; name: string; address: string }[]> = {
  ppl: [
    { id: "MOCK-PPL-101", name: "PPL ParcelShop Praha - Václavské náměstí", address: "Václavské náměstí 1, 110 00 Praha 1" },
    { id: "MOCK-PPL-202", name: "PPL ParcelShop Brno - Náměstí Svobody", address: "Náměstí Svobody 8, 602 00 Brno" },
    { id: "MOCK-PPL-303", name: "PPL ParcelBox Ostrava - Nádraží", address: "Nádražní 685, 702 00 Ostrava" },
  ],
  packeta: [ /* obdobně 3 mock body */ ],
};
```

Toto jsou ty "Míčková data" ze zadání (mock data).

### Jak zákazník dnes vybírá pickup-point v checkout UI

Komponenta `ShippingProviderSelector.astro` (`website/src/components/shop/`) vykresluje pro každého povoleného dopravce (`ShippingProviderConfig` z `shipping_provider_configs` tabulky) blok "pickup-block". Rozhodnutí real-vs-mock je v řádku 73:

```ts
const hasRealWidget = !mockMode && (cfg.code === "ppl" ? Boolean(pplWidgetKey) : Boolean(packetaWidgetKey));
```

- `mockMode = (import.meta.env.PUBLIC_SHIPPING_MOCK_MODE ?? "true") !== "false"`
- `pplWidgetKey = import.meta.env.PUBLIC_PPL_WIDGET_API_KEY ?? ""`

Pokud `hasRealWidget` je `true`, vykreslí se tlačítko `data-open-ppl-widget`, které otevírá **skutečný oficiální PPL widget**. Pokud `false` (dnešní stav na devu), vykreslí se `<select>` s `MOCK_POINTS`.

Klientská logika je v `website/src/lib/client/shippingSelector.ts`, funkce `openPplWidget()` (řádky 85-104):

```ts
async function openPplWidget(apiKey, setPickupPoint) {
  await loadScriptOnce("https://www.ppl.cz/accesspointwidget/loader.js");
  let widget = document.getElementById("ppl-access-point-widget");
  if (!widget) {
    widget = document.createElement("ppl-access-point-widget");
    widget.id = "ppl-access-point-widget";
    widget.setAttribute("api-key", apiKey);
    widget.setAttribute("config", JSON.stringify({ viewMode: "modal" }));
    widget.addEventListener("ppl-accesspointwidget-select", (e) => {
      const p = e.detail;
      setPickupPoint(p.code, p.name, `${p.address?.street ?? ""}, ${p.address?.zipCode ?? ""} ${p.address?.city ?? ""}`);
    });
    document.body.appendChild(widget);
  }
  widget.open?.();
}
```

Toto je přesně oficiální PPL Widget 2.0 (custom element `<ppl-access-point-widget>`, loader `https://www.ppl.cz/accesspointwidget/loader.js`, event `ppl-accesspointwidget-select`) - ověřeno proti aktuální PPL dokumentaci ve Fázi 2 níže. Kód sedí na skutečné API smlouvě widgetu.

Vybraný bod (`id`/`code`, `name`, `address`) se uloží do skrytých inputů (`pickup_point_id`, `pickup_point_name`, `pickup_point_address`) ve formuláři `checkout-form` a odešle se s objednávkou. Server (`website/src/pages/shop/checkout.astro`, řádky 63-65, 178-182 a identicky `website/src/pages/eshop-[partySlug]/checkout.astro`) tyto hodnoty jen přebírá a ukládá do `order_shipments.pickup_point_id/name/address` - **bez jakékoliv server-side validace u PPL** (viz zjištěná mezera níže).

### Proč dnes na devu vidíme jen mock (přesná diagnóza)

`.env.development` (skutečný soubor v hlavním checkoutu, ne worktree) obsahuje:

```
PPL_CLIENT_ID=
PPL_CLIENT_SECRET=
PPL_API_BASE_URL=https://api-sandbox.dhl.com/ecs/ppl/sandbox
PUBLIC_PPL_WIDGET_API_KEY=
PUBLIC_SHIPPING_MOCK_MODE=false
```

`PUBLIC_SHIPPING_MOCK_MODE` je `false` (dopravci nejsou globálně v mock módu), ALE `PUBLIC_PPL_WIDGET_API_KEY` je prázdné. Takže `hasRealWidget` pro PPL vyjde `false` a UI spadne zpět na mock `<select>`. Packeta widget klíč je taky prázdný, takže Packeta má stejný problém - i tam se dnes zobrazuje mock, i když to zadání zmiňuje jen PPL.

Toto **není chybějící feature, je to chybějící konfigurační hodnota** (env var), kterou může doplnit jen někdo s PPL obchodním účtem.

### Existující "real" vrstva - server-side booking (CPL API)

Kromě widgetu (výběr pickup-pointu) existuje ještě samostatná, nezávislá vrstva pro **rezervaci skutečné zásilky** u PPL po zaplacení objednávky - `website/src/lib/integrations/shipping/ppl.ts`. Implementuje PPL CPL API (`POST /shipment/batch`, `GET /shipment/batch/{batchId}`, `GET /shipment/batch/{batchId}/label`, `GET /shipment`, `POST /shipment/{shipmentNumber}/cancel`) s OAuth2 client-credentials flow (`PPL_CLIENT_ID`/`PPL_CLIENT_SECRET`). Toto je **jiný pár credentials** než widget klíč a jiná PPL smlouva (viz Fáze 2).

Pokud `PPL_CLIENT_ID`/`PPL_CLIENT_SECRET` chybí, `website/src/lib/integrations/shipping/index.ts` (`getShippingProvider()`) spadne na `createMockProvider("ppl")` z `mock.ts` - odtud pochází "TEST MODE"/"TESTOVACÍ REŽIM" badge v adminu a mock PDF štítek. Tato mock vrstva **není** předmětem tohoto úkolu (úkol je jen o výběru pickup-pointu v checkoutu), ale je důležité ji nezaměnit - i po doplnění widget klíče zůstane booking v mock módu, dokud nebudou i CPL API credentials.

### Referenční vzor - Packeta (pokročilejší v jednom směru)

Packeta má identickou widget integraci (`openPacketaWidget()` ve `shippingSelector.ts`, `https://widget.packeta.com/v6/www/js/library.js`), ale navíc má **server-side re-validaci** vybraného bodu:

`website/src/lib/integrations/shipping/widgetValidate.ts`:

```ts
export async function validatePacketaPickupPoint(pointId: string): Promise<boolean> {
  const apiKey = import.meta.env.PUBLIC_PACKETA_WIDGET_API_KEY;
  if (!apiKey) return false;
  const res = await fetch("https://widget.packeta.com/v6/pps/api/widget/v1/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey, point: { id: pointId } }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  return data.isValid === true;
}
```

Komentář v souboru: "Point selection happens entirely client-side and can be tampered with, so this must run before the point id is trusted [...] per Packeta's own widget docs."

**Zjištěná mezera:** grep přes `checkout.astro` (`shop/` i `eshop-[partySlug]/`) nenašel žádné volání `validatePacketaPickupPoint` ani žádný PPL ekvivalent - `pickup_point_id` z formuláře se ukládá bez validace u OBOU dopravců. Tzn. i Packeta validaci má napsanou, ale nikde zavolanou (to je bug mimo scope tohoto úkolu, ale stojí za zmínku Janovi). Pro PPL navíc žádná validační funkce vůbec neexistuje - ta se musí napsat od nuly (viz Fáze 4).

### DB schéma (už existuje, nic se nemění)

`supabase/migrations/20260103000069_shipping_providers.sql` definuje `shipping_provider_configs` (per-carrier nastavení, cena, sender adresa) a `order_shipments` (`pickup_point_id`, `pickup_point_name`, `pickup_point_address` jako prosté `TEXT` sloupce, žádná FK na cache tabulku pickup-pointů). Toto schéma je dostatečné i pro reálný widget - není potřeba nová tabulka `ppl_pickup_points` (viz Fáze 4, varianta zamítnuta).

### i18n

Všechny potřebné klíče (`t.shop.choosePickupPoint`, `t.shop.pickupPointChosen`, `t.shop.shippingHome`, `t.shop.shippingPickup`) už existují v `shared/i18n/locales/cs.ts` (řádky ~1515-1518) a `en.ts` (~1513-1516). Není potřeba přidávat nic.

### E2E testy

`website/tests/e2e/31-shipping-providers.spec.ts` a `32-packeta-verification.spec.ts` pokrývají celý flow (checkout → admin booking → label → status refresh → cancel/return) **výhradně v mock módu** (komentář v souboru: "Real PPL/Packeta credentials aren't self-serve [...] and neither carrier has a usable sandbox, so this drives the actual checkout/admin/label UI end to end against the built-in mock provider"). Žádný z testů netestuje `hasRealWidget = true` větev (reálný widget skript) - to dává smysl, protože vyžaduje živý PPL klíč a běží by proti `ppl.cz`, což by v CI bylo nespolehlivé. Tento test-gap je legitimní a neměl by se řešit voláním živého PPL widgetu v CI (viz Fáze 4 - doporučení testovat jen `hasRealWidget`-rozhodovací logiku, ne samotný widget).

---

## Fáze 2 - PPL dokumentace - zjištění

Zdroje (WebSearch + WebFetch, 2026-09-03):

- https://ppl-widget2-en.apidog.io/1-quick-start-integration-in-5-minutes-2040716m0 (Widget 2.0 Quick Start)
- https://ppl-widget2-en.apidog.io/ppl-access-point-widget-implementation-guide-for-e-shops-2040712m0 (Implementation Guide - obsah stránky byl jen navigační, detaily nešly z ní vytáhnout)
- https://ppl-widgetapikeyen.apidog.io/ (API Key Acquisition and Configuration)
- https://ppl-cpl-api-en.apidog.io/codelist-externalnumbers-13601462e0
- https://ppl-cpl-api.apidog.io/seznam-v%C3%BDdejn%C3%ADch-m%C3%ADst-13465887e0 (CPL API - Seznam výdejních míst / `GET /accessPoint`)
- https://www.ppl.cz/w/novy-mapovy-widget-ppl-2-0 (nalezeno přes vyhledávání, nebylo fetchováno do detailu)

### Widget 2.0 - potvrzeno, kód v repu odpovídá realitě

- Loader script: `https://www.ppl.cz/accesspointwidget/loader.js`, ideálně v `<head>`.
- Custom element: `<ppl-access-point-widget>`.
- Povinný atribut: `api-key`. Nepovinný, ale doporučený: `id`.
- `config` atribut (JSON): `viewMode` (`"modal"` výchozí, nebo `"inline"`), jazyk, země a další nastavení dědí z admin nastavení klíče (přepsatelné per-page).
- Admin nastavení klíče (na `klient.ppl.cz/widgetadmin`) zahrnuje: whitelist domén (bezpečnostní), typ produktu, povolené typy access pointů (AlzaBox/ParcelBox/ParcelShop), zobrazovací mód, jazyk, výchozí mapové souřadnice.
- Event výběru: `ppl-accesspointwidget-select`, `e.detail` obsahuje minimálně `name`, `code`, `type` (ParcelShop/ParcelBox/AlzaBox) - dokumentace explicitně nepotvrdila pole `address` (street/city/zipCode), i když kód v `shippingSelector.ts` s ním počítá (komentář v kódu cituje "DetailResponseModel" a §7.8 specifikace, kterou agent nemohl fetchnout do detailu - **toto pole jde ověřit až s reálným klíčem, viz otevřená otázka níže**).
- Event `ppl-accesspointwidget-ready` - fired po úspěšné inicializaci.
- **Migrační deadline: 31. srpna 2026** je poslední termín pro migraci všech customizovaných widgetů na verzi 2.0. (Datum je v minulosti vzhledem k "dnešnímu" datu 2026-09-03 v tomto prostředí - je tedy MOŽNÉ, že staré Widget 1.0 instance k tomuto datu už nefungují. Kód v repu už používá 2.0, takže je v souladu.)
- Žádná zmínka o sandbox/testovacím klíči pro vývoj - **potvrzeno i nezávisle existujícím komentářem v `.env.production.example`**: "PPL's validates the key server-side immediately on load (fails hard with 'Neplatný API klíč' on anything invalid/placeholder) - there is no way to preview the real map without a genuine key."

### Autentizace/přístup k widget klíči

- Získání klíče: `https://klient.ppl.cz/widgetadmin`.
- Vyžaduje reálný PPL obchodní účet (dřívější zjištění v `.env.production.example`, potvrzeno směrem dokumentace, i když přesný registrační proces nebyl z fetchnutých stránek čitelný do detailu): registrace "Stát se zákazníkem" na ppl.cz.
- Web dokumentace explicitně NEPOTVRDILA cenu ani přesný self-serve/sales-kontakt proces pro samotný widget klíč (na rozdíl od CPL API credentials, kde `.env.production.example` už dřív zjistilo, že je nutný kontakt na `ithelp@ppl.cz` nebo `developer.ppl.cz`). Nešlo tedy plně ověřit, zda widget klíč lze získat čistě samoobslužně po registraci firmy, nebo je i zde nutný lidský kontakt s obchodním zástupcem PPL. **Toto je otevřená otázka pro Jana / je třeba prakticky vyzkoušet na `klient.ppl.cz/widgetadmin`.**

### CPL API - server-side vyhledání/validace access pointu (nové zjištění, v repu zatím nevyužité)

Existuje `GET /accessPoint` endpoint (stejná CPL API báze jako `ppl.ts`, OAuth2 Bearer token z `PPL_CLIENT_ID`/`PPL_CLIENT_SECRET`):

- Povinné parametry: `CountryCode`, `Limit` (1-1000), `Offset`.
- Volitelné (klíčové pro validaci): `AccessPointCode` - přesný lookup podle kódu vybraného ve widgetu.
- Další filtry: `ZipCode`, `City`, `Latitude`/`Longitude`/`Radius`, `AccessPointTypes`, `TribalServicePoint`, `ActiveCardPayment`, `ActiveCashPayment`, `PickupEnabled`, `Sizes`.
- Odpověď na jeden access point obsahuje: `accessPointCode`, `accessPointType`, `name`, `name2`, `street`, `city`, `country`, `zipCode`, `phone`, `email`, `tribalServicePoint`, `activeCardPayment`, `activeCashPayment`, `pickupEnabled`, `dimensionForced`, `gps: {latitude, longitude}`, `workHours[]` (otevírací doba po dnech), `capacitySettings[]` (S/M/L/XL kapacity a rozměry), `accessPointNote`.

Toto je přesně to, co je potřeba pro server-side re-validaci PPL pickup-pointu (analogicky k `validatePacketaPickupPoint`) - **ale vyžaduje CPL API credentials (`PPL_CLIENT_ID`/`SECRET`), ne widget klíč**. To znamená: bez CPL API smlouvy nejde bezpečně validovat, co si zákazník vybral ve widgetu - jen se to dá vzít na důvěru z klienta (stejně jako se dnes bere na důvěru Packeta pickup point, viz zjištěná mezera výše).

### Náklady/limity

Žádný z fetchnutých zdrojů explicitně neuvádí cenu widgetu ani CPL API. Dřívější poznámka v `.env.production.example` naznačuje, že jde o standardní součást PPL obchodního vztahu (ne samostatně zpoplatněnou službu), ale toto nebylo nezávisle ověřeno webovým zdrojem - **needomýšlet, ověřit přímo s PPL při zakládání účtu.**

### Kde dokumentace vyžaduje přihlášení / nejde plně prostudovat veřejně

- Detailní implementační guide (`ppl-access-point-widget-implementation-guide-for-e-shops`) vrátil při fetchi jen navigační obsah, ne technické detaily (pravděpodobně JS-rendered obsah, který statický fetch nezachytil celý).
- Přesný proces založení PPL obchodního účtu a generování widget klíče na `klient.ppl.cz/widgetadmin` vyžaduje přihlášení - nebylo možné ověřit bez PPL účtu.
- CPL API sandbox (`sandbox.ppl.cz`) - podle existujícího komentáře v repu vyžaduje email na `CISteam@ppl.cz` před přihlášením.

Tyto body **nefabrikuji dál** - jsou to legitimní meze veřejně dostupné dokumentace, řešitelné jen se skutečným PPL kontem.

---

## Fáze 3 - Návrh řešení (varianty)

### Varianta 1 - Použít existující oficiální PPL Widget 2.0 integraci (DOPORUČENO)

Kód už existuje a je hotový (`ShippingProviderSelector.astro` + `shippingSelector.ts`). Zbývá:
1. Založit PPL obchodní účet a vygenerovat widget klíč na `klient.ppl.cz/widgetadmin`.
2. Nastavit `PUBLIC_PPL_WIDGET_API_KEY` v `.env.development` (a později `.env.production`).
3. Doplnit chybějící server-side validaci vybraného pickup-pointu (bezpečnostní mezera popsaná ve Fázi 1/2) - vyžaduje navíc CPL API credentials.
4. Ručně ověřit v prohlížeči, že widget skutečně vykresluje mapu a vrací očekávaná pole (`code`/`name`/`address`), protože to nejde ověřit bez klíče.

Klady: nulová dodatečná implementace mapy, žádná vlastní synchronizace dat o pobočkách (PPL widget si data táhne přímo z PPL), konzistentní se stávajícím Packeta vzorem (stejný soubor, stejný event pattern), UI/UX už hotové (delivery-type přepínač home/pickup, shrnutí vybraného bodu, cena v souhrnu objednávky).
Zápory: závislost na PPL frontend kódu (mimo naši kontrolu, branding je PPL, ne vlastní), vyžaduje reálný PPL obchodní vztah (ne self-serve zdarma), bez CPL API credentials zůstává výběr bodu bez server-side validace (řešitelné, ale to vyžaduje druhý, těžší pár credentials).
Náročnost: **nízká** (většina je "získat klíč" + "nastavit env var" + jedna nová validační funkce ~20-30 řádků + otestovat).

### Varianta 2 - Vlastní mapa (Leaflet/MapLibre) + PPL adresní feed/API

Postavit vlastní mapovou komponentu nad `GET /accessPoint` (CPL API), s pravidelnou synchronizací dat do vlastní cache tabulky.

Klady: plná kontrola nad UX/brandingem, konzistentní vzhled s vlastním designem eshopu, žádná závislost na PPL JS kódu v prohlížeči zákazníka (žádné cizí skripty, GDPR/CSP čistší).
Zápory: vyžaduje CPL API credentials (těžší získat - sales kontakt, ne jen registrace), vyžaduje vlastní cache tabulku a pravidelný sync job (PPL pobočky se mění - otevírací doby, nové/zrušené pobočky), vyžaduje mapovou knihovnu + geolokaci/vyhledávání podle adresy zákazníka, výrazně vyšší implementační a údržbová zátěž, duplikuje funkčnost, kterou PPL widget dělá zdarma (mapově) lépe.
Náročnost: **vysoká** (odhad v Fázi 4 dolů, ale řádově dny, ne hodiny).

### Varianta 3 - Fallback: ruční CSV import

Nerelevantní v tomto případě - PPL nabízí funkční, aktuální widget i CPL API endpoint, není důvod sahat po ručně importovaném a rychle zastarávajícím seznamu poboček. Zmiňuji jen pro úplnost zadání; nedoporučuji.

### Doporučení

**Varianta 1.** Důvody:
- Kód už existuje, je otestovaný v mock režimu a strukturálně odpovídá reálné PPL Widget 2.0 smlouvě (ověřeno ve Fázi 2).
- Je to přesně stejný vzor jako Packeta, který v repu evidentně funguje (Packeta má navíc i server-side validaci, kterou stačí zkopírovat/upravit pro PPL).
- Varianta 2 by duplikovala práci, kterou PPL dělá za nás (a vyžadovala by těžší CPL API credentials jen na to, co widget dá zdarma s lehčím widget klíčem).
- Odpovídá principu "Quality, Simplicity, Robustness, Scalability, Long-term maintainability" bez ohledu na vývojářský čas (viz Janovy obecné instrukce) - vlastní mapa by byla vyšší údržbová zátěž bez odpovídajícího přínosu, protože oficiální widget už řeší přesně tento problém.

---

## Fáze 4 - Detailní implementační plán (BUDOUCÍ práce, NEIMPLEMENTOVÁNO TEĎ)

### Krok 1 - Získat PPL widget klíč (blokující, mimo kód)

- Založit/ověřit PPL obchodní účet ("Stát se zákazníkem" na ppl.cz).
- Vygenerovat widget klíč na `https://klient.ppl.cz/widgetadmin`.
- V admin nastavení klíče nakonfigurovat doménový whitelist (musí zahrnovat dev doménu i produkční doménu - pravděpodobně dvě samostatné administrace/klíče, jeden na dev, jeden na prod, protože widget validuje doménu).
- **Otevřená otázka pro Jana:** kdo v Smalljobs/na projektu má/založí PPL firemní účet? Toto agent nemůže udělat sám - vyžaduje IČO firmy a pravděpodobně lidský kontakt s PPL.

### Krok 2 - Nastavit env proměnnou na devu

- Soubor: `.env.development` (v hlavním checkoutu, není v gitu).
- Nastavit `PUBLIC_PPL_WIDGET_API_KEY=<získaný klíč>`.
- `PUBLIC_SHIPPING_MOCK_MODE` už je `false` - neměnit.
- Restartovat `pnpm dev`, aby se nová env hodnota načetla (Astro `import.meta.env` je build/start-time).

### Krok 3 - Ruční ověření v prohlížeči (E2E lidské, ne automatizované)

- Otevřít `/shop/checkout` s položkou v košíku, zvolit PPL jako dopravce, přepnout na "Výdejní místo", kliknout na tlačítko "Vybrat výdejní místo".
- Ověřit, že se načte skutečná PPL mapa (ne "Neplatný API klíč" chyba).
- Vybrat reálnou pobočku, ověřit že se `p.code`/`p.name`/`p.address` správně naplní do `pickup-summary` a skrytých inputů.
- **Otevřená otázka:** ověřit skutečný tvar `e.detail` (pole `address.street/city/zipCode` použité v `shippingSelector.ts` řádek 99) - pokud se liší od očekávání, opravit `openPplWidget()` v `website/src/lib/client/shippingSelector.ts`.
- Dokončit objednávku, ověřit že `order_shipments.pickup_point_id/name/address` v DB odpovídá reálnému vybranému bodu.

### Krok 4 - Doplnit server-side validaci PPL pickup-pointu (nová práce, malý rozsah)

Nový soubor nebo rozšíření `website/src/lib/integrations/shipping/widgetValidate.ts`:

```ts
export async function validatePplPickupPoint(code: string): Promise<boolean> {
  if (!import.meta.env.PPL_CLIENT_ID || !import.meta.env.PPL_CLIENT_SECRET) return false;
  const token = await getAccessToken(); // export/reuse z ppl.ts
  const baseUrl = import.meta.env.PPL_API_BASE_URL ?? "https://api.dhl.com/ecs/ppl/myapi2";
  const params = new URLSearchParams({ CountryCode: "CZ", AccessPointCode: code, Limit: "1", Offset: "0" });
  const res = await fetch(`${baseUrl}/accessPoint?${params}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return false;
  const data = await res.json();
  return Array.isArray(data?.items ?? data) && (data.items ?? data).length > 0;
}
```

Přesný tvar odpovědi (obálka `items[]` vs. přímé pole) je třeba ověřit proti reálnému CPL API (dokumentace to jasně neuvedla) - stejná opatrnost jako existující komentáře v `ppl.ts` ("verify against ... once real credentials are available").

Úpravy:
- `website/src/lib/integrations/shipping/ppl.ts`: exportovat `getAccessToken` (dnes modulově privátní), aby ji šlo sdílet s validační funkcí bez duplikace OAuth logiky (dodržuje pravidlo "Never duplicate logic").
- `website/src/pages/shop/checkout.astro` a `website/src/pages/eshop-[partySlug]/checkout.astro`: před uložením `order_shipments` zavolat `validatePplPickupPoint(pickupPointId)` (pro `provider === "ppl"` a `delivery_type === "pickup"`), obdobně `validatePacketaPickupPoint` pro Packeta (ta existuje, ale dnes se nikde nevolá - stejná oprava patří k oběma dopravcům, i když zadání mluví jen o PPL; doporučuji opravit oba najednou, protože jde o identickou mezeru a checkout kód je sdílený).
- Pokud validace selže: nezablokovat celou objednávku tvrdě (zákazník by přišel o zaplacenou objednávku uprostřed Stripe/PayU flow), ale zalogovat/označit `order_shipments.error_message` a nechat admina řešit ručně při bookingu - přesná chybová strategie je designové rozhodnutí pro implementační session, ne pro tento plán.

**Poznámka k rozsahu:** Tento krok vyžaduje CPL API credentials (`PPL_CLIENT_ID`/`PPL_CLIENT_SECRET`), NE jen widget klíč. Pokud Jan nebude mít CPL API účet hned, jde tento krok odložit - výběr reálné pobočky (hlavní požadavek zadání) funguje i bez něj, jen bez server-side ověření (stejné riziko, jaké má dnes Packeta).

### Krok 5 - E2E testy (doplnění, ne nahrazení stávajících)

- Stávající `31-shipping-providers.spec.ts` a `32-packeta-verification.spec.ts` zůstávají beze změny - testují mock cestu, což je správně (žádný spolehlivý sandbox pro widget v CI).
- Nový, malý test (nebo rozšíření `31-...spec.ts`) pro **rozhodovací logiku** `hasRealWidget` v `ShippingProviderSelector.astro`: nastavit `PUBLIC_PPL_WIDGET_API_KEY` na fake hodnotu v testovacím `.env`, ověřit že se vykreslí `[data-open-ppl-widget]` tlačítko místo `<select>` (bez skutečného kliknutí na něj - to by šlo proti živému ppl.cz). Ověří jen že aplikace kód správně přepíná větve, ne že widget samotný funguje (to zůstává manuální krok 3).
- Pokud se implementuje Krok 4 (server-side validace), přidat unit/integrační test pro `validatePplPickupPoint` s mockovaným `fetch`.

### Soubory k úpravě (shrnutí)

| Soubor | Změna |
|---|---|
| `.env.development` (mimo git) | doplnit `PUBLIC_PPL_WIDGET_API_KEY` |
| `.env.production` (mimo git) | doplnit `PUBLIC_PPL_WIDGET_API_KEY` (až bude produkční klíč) |
| `website/src/lib/integrations/shipping/ppl.ts` | exportovat `getAccessToken` |
| `website/src/lib/integrations/shipping/widgetValidate.ts` | přidat `validatePplPickupPoint` |
| `website/src/pages/shop/checkout.astro` | zavolat validaci před uložením `order_shipments` (PPL i Packeta) |
| `website/src/pages/eshop-[partySlug]/checkout.astro` | stejná úprava (duplicitní route, stejný vzor jako `shop/checkout.astro` v repu dnes) |
| `website/src/lib/client/shippingSelector.ts` | případná oprava `openPplWidget()` podle reálného tvaru `e.detail` zjištěného v Kroku 3 |
| `website/tests/e2e/31-shipping-providers.spec.ts` | doplnit test na `hasRealWidget` rozhodovací logiku |

### Co se NEMĚNÍ (záměrně)

- DB schéma (`order_shipments`, `shipping_provider_configs`) - beze změny, `pickup_point_id/name/address` jako `TEXT` stačí.
- `ShippingProviderSelector.astro` UI markup - beze změny, `hasRealWidget` větev už existuje.
- i18n klíče - beze změny, vše existuje.
- `website/src/lib/integrations/shipping/mock.ts`, `pplHelpers.ts`, `index.ts` - beze změny.

### Odhad práce

- Krok 1 (získání PPL účtu/klíče): mimo vývojářský čas, závisí na PPL (dny až týdny, mimo naši kontrolu).
- Krok 2 (env var): minuty.
- Krok 3 (ruční ověření widgetu v prohlížeči): 1-2 hodiny (včetně případné opravy `openPplWidget()` podle reálného API tvaru).
- Krok 4 (server-side validace PPL + doplnění chybějícího volání pro Packetu): 0.5-1 den (implementace + testy), podmíněno získáním CPL API credentials.
- Krok 5 (e2e test rozhodovací logiky): 1-2 hodiny.

Celkem vývojářský čas (bez čekání na PPL): cca **1-2 dny**, z čehož naprostá většina je Krok 4 (validace) - Krok 2+3 (samotné zprovoznění mapy) je otázka hodin, jakmile bude klíč k dispozici.

### Otevřené otázky pro Jana

1. Kdo založí PPL obchodní účet a vygeneruje widget klíč (`klient.ppl.cz/widgetadmin`)? Agent to nemůže udělat sám (vyžaduje IČO firmy, přihlášení, případně lidský kontakt s PPL obchodním zástupcem).
2. Chceme řešit i CPL API credentials (`PPL_CLIENT_ID`/`SECRET`) hned, nebo jen widget klíč pro výběr pobočky (a nechat booking/validaci v mock/nevalidovaném stavu o něco déle)? Zadání mluví jen o výběru pobočky (mapě), booking je samostatná, už fungující (mock) vrstva z dřívějška.
3. Má se oprava "Packeta validace se nikde nevolá" udělat současně s PPL (stejná mezera, sdílený checkout kód), nebo je to mimo scope tohoto úkolu a má jít jako samostatný bug-fix požadavek?
4. Jaká má být přesná chybová strategie, pokud server-side validace pickup-pointu selže po zaplacení (Krok 4)? Tvrdě zablokovat objednávku, nebo jen označit k ruční kontrole administrátorem?
5. Je nutné mít oddělené widget klíče pro dev a produkční doménu (kvůli doménovému whitelistu ve widget adminu), nebo lze jeden klíč použít na obě? Nešlo ověřit bez PPL účtu.

---

## Poznámka k interpretaci zadání

"Míčková data" v původním zadání interpretuji jako překlep za "mocková data" (mock data) - potvrzeno nálezem `MOCK_POINTS` konstanty v kódu, která přesně odpovídá popisu "pouze na výběr" pro PPL delivery-to-box. Tato interpretace je jistá (ne jen nejrozumnější hádka) - kód i chybová hláška v UI (`t.shop.choosePickupPoint` nad `<select>` s `MOCK-PPL-*` hodnotami) přesně sedí na popis problému.
