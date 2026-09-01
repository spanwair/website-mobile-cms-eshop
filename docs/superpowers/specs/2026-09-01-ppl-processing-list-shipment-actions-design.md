# PPL shipment actions v seznamu objednávek + náhled štítku

## Kontext

Carrier vrstva pro PPL (a Packeta) už v repozitáři existuje a je funkční: `order_shipments` tabulka, carrier abstraction (`website/src/lib/integrations/shipping/`), business logika (`website/src/lib/shipmentActions.ts`), cron job pollující stav zásilky každých 30 minut (`supabase/migrations/20260103000076_shipment_status_cron.sql` → `website/src/pages/api/cron/refresh-shipment-statuses.ts`), a kompletní admin UI na detailu objednávky (`website/src/pages/admin/orders/[id].astro`).

Analýza PPL CPL API dokumentace (https://ppl-cpl-api.apidog.io) potvrdila, že implementace v `ppl.ts` odpovídá reálným endpointům:
- `POST /login/getAccessToken` (OAuth2 client_credentials, token 30 min)
- `POST /shipment/batch` → polling `GET /shipment/batch/{batchId}` do `importState` mimo `Accepted/InProcess`
- `GET /shipment/batch/{batchId}/label` (štítek)
- `GET /shipment?ShipmentNumbers=` (tracking)
- `POST /shipment/{shipmentNumber}/cancel` (storno)

PPL nemá webhooky — polling cronem je jediný způsob, jak se dozvědět o změně stavu. To už je implementováno správně.

**Zjištěná mezera** oproti požadavku uživatele: akce (vytvořit zásilku, obnovit stav, zrušit, stáhnout štítek) a číslo balíku existují jen na detailu objednávky (`/admin/orders/[id]`), ne přímo v seznamu `/admin/orders?status=processing`, kde admin objednávky reálně zpracovává. Náhled štítku je dnes jen syrový odkaz na stažení PDF, ne vizuální náhled.

## Rozsah

**V rozsahu:**
1. Inline shipment akce + číslo balíku přímo v tabulce `/admin/orders` (všechny status taby, ne jen processing).
2. Vizuální náhled štítku (nová stránka s `<iframe>` nad PDF) místo přímého downloadu, použitá jak ze seznamu, tak z detailu objednávky.

**Mimo rozsah:**
- Produkční PPL credentials / produkční API — pracujeme výhradně proti sandboxu (`api-sandbox.dhl.com`, `.env.development`). `.env.production` zůstává v mock režimu (`PUBLIC_SHIPPING_MOCK_MODE=true`), nesahá se na něj.
- Propojení `/admin/returns` (RMA reklamace) s `order_shipments` — jiný koncept, řešit samostatně.
- Ověření PPL `productType` kódů (`BUSS/BUSD/SBOX/SBOD`) proti `GET /codelist/product` reálného účtu — vyžaduje credentials, mimo tento spec.
- Jakékoli změny permission bitů/rolí — feature zůstává pod stávajícím `MANAGE_ORDERS` (32).

## Architektura

### A. Sdílený POST handler v `website/src/pages/admin/orders/index.astro`

Frontmatter dostane `POST` export analogický tomu v `[id].astro`, ale parametrizovaný `orderId` z form dat (list zobrazuje víc objednávek najednou, takže orderId nejde vzít z `Astro.params`):

```
requireAdminCtx + partyId + MANAGE_ORDERS guard (stejné jako dnes)
POST:
  formData -> action, orderId
  ověřit, že orderId patří do ctx.partyId (obranná kontrola před cross-party zápisem)
  switch(action):
    create_shipment  -> createShipmentForOrder(adminClient, orderId)
    refresh_shipment -> refreshShipmentStatus(adminClient, orderId)
    cancel_shipment  -> cancelShipmentForOrder(adminClient, orderId)
  redirect zpět na stejné Astro.url (zachovává ?status=&page=)
```

Žádná nová byznys logika — čistě reuse `website/src/lib/shipmentActions.ts`, které už tyto tři funkce exportuje a používá i `[id].astro` i cron.

### B. Tabulka v `index.astro`

Rozšířit select `order_shipments` o `provider_shipment_id, tracking_number, label_storage_path, error_message, is_mock` (dnes jen `order_id, provider, status`).

Sloupec **Shipment**: stávající badge `PROVIDER · status` + nový řádek s tracking number tučně (pokud existuje) + `is_mock` → malý "TEST" chip (stejná vizuální logika jako `shipmentTestMode` na detailu).

Nový sloupec **Akce zásilky** (vedle stávajícího "Detail"):
- shipment neexistuje NEBO `status IN (pending, failed)` → button „Vytvořit zásilku" (nebo „Opakovat" pro failed) — `action=create_shipment`
- `provider_shipment_id` existuje a status není terminální (`in_transit|delivered|returned|cancelled`) → ghost button „Obnovit stav" (`action=refresh_shipment`) + ghost/red button „Zrušit" (`action=cancel_shipment`)
- `label_storage_path` existuje → link „Štítek" → otevře novou preview stránku v nové záložce

Tabulka: přidat `overflow-x:auto` wrapper kolem `<table class="data-table">`, aby přibylý sloupec nerozbil layout na mobilu (dnešní `.card{overflow:hidden}` by jinak štítek/akce ořízl).

### C. Nová stránka náhledu štítku

`website/src/pages/admin/orders/[id]/label.astro`:
- Guard identický s `[id].astro` (`requireAdminCtx`, `MANAGE_ORDERS`, party-scoped fetch objednávky přes `partyId`, 404/redirect pokud objednávka nepatří do party)
- Query param `?type=return` pro zpětný štítek (stejná konvence jako už existující `/api/shipping-label/[orderId]?type=return`)
- Tělo stránky: hlavička s číslem objednávky + odkaz zpět na detail, a `<iframe src="/api/shipping-label/{id}[?type=return]" style="width:100%;height:calc(100vh - 60px);border:0">` — `/api/shipping-label/[orderId].ts` beze změny, dál vrací 302 na Supabase signed URL, prohlížeč PDF vykreslí a nabídne tisk/stažení přes svůj vestavěný viewer.
- Použije se jako cíl `target="_blank"` jak z nového tlačítka „Štítek" v seznamu, tak nahradí stávající přímý odkaz „Stáhnout štítek" na detailu objednávky (`[id].astro` řádek ~203 a ~242), aby bylo chování konzistentní na obou místech.

### D. i18n

Nový klíč `shipmentPreviewLabel` (cs: "Náhled štítku", en: "Preview label") v `website/src/i18n/` (cs + en soubory). Zbytek reuse stávajících klíčů (`shipmentCreate`, `shipmentRetry`, `shipmentRefresh`, `shipmentCancel`, `shipmentTracking`, `shipmentTestMode`...).

### E. Databáze

Beze změny — `order_shipments` schema už obsahuje všechna potřebná pole. Žádná nová migrace.

### F. Sandbox guardrail

- Neměním `.env.production` ani `.env.production.example`.
- Testuji/ověřuji výhradně proti `.env.development` (`PPL_API_BASE_URL=https://api-sandbox.dhl.com/ecs/ppl/sandbox`).
- Reálné `PPL_CLIENT_ID`/`PPL_CLIENT_SECRET` doplňuje uživatel sám přímo do `.env.development` — já s nimi nepracuji ani je nevidím.
- Dokud credentials nejsou vyplněné, `getShippingProvider("ppl")` (viz `website/src/lib/integrations/shipping/index.ts:13`) automaticky spadne na `createMockProvider("ppl")` — nové tlačítka tedy fungují a jsou plně testovatelná i bez reálného sandbox účtu, jen s `is_mock=true` badge.

## Chybové stavy

- POST handler v `index.astro`: pokud `createShipmentForOrder`/`refreshShipmentStatus`/`cancelShipmentForOrder` vrátí `{ error }`, uložit chybu do `order_shipments.error_message` (to už dělají tyto funkce samy) a po redirectu ji zobrazit stejně jako dnes na detailu (badge s `shipmentError`) — na úrovni seznamu stačí, že se po refreshi zobrazí aktualizovaný `status/error` badge, není potřeba flash-message vrstva navíc.
- Cross-party zápis: POST handler musí ověřit, že `orderId` patří do `ctx.partyId`, jinak vrátit 403 — obrana proti přímému POST requestu s cizím orderId (party scoping je jinak vynucený jen přes to, že seznam objednávek už je filtrovaný podle party, ale POST endpoint musí mít vlastní kontrolu).
- `label.astro`: pokud objednávka nepatří do `ctx.partyId` nebo neexistuje → redirect na `/admin/orders` (stejný vzor jako `[id].astro`).

## Testování

- Manuální ověření v prohlížeči (dev server, mock provider): všechny stavy tlačítek v seznamu (pending → created → in_transit → delivered/cancelled), náhled štítku se otevře a PDF se vykreslí.
- Pokud existují Playwright E2E testy pokrývající `/admin/orders` (zkontrolovat `website/tests/e2e/`), doplnit/upravit je o nové sloupce a tlačítka.
- Permission checklist z `admin-permissions` skillu: ověřit, že POST handler i nová stránka respektují `MANAGE_ORDERS` (32) stejně pro owner/admin/eshop_admin, a že eshop_admin bez tohoto bitu dostane redirect na `/admin`.
