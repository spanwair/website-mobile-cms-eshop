---
title: Architektura s více nájemci
description: Jak funguje izolace dat organizace a co musí vývojáři eshopu vědět při budování integrací.
---

Každá organizace, která používá toto CMS, je **nájemce** (tenant) - zcela izolovaná od všech ostatních nájemců na úrovni databáze. Tato stránka vysvětluje, jak je tato izolace vynucována a co musíte dělat (a co nikdy nesmíte dělat) při budování vlastního eshopu nad API.

## Co je nájemce

Každá organizace se nazývá **strana** (party) a má unikátní `party_id` (UUID). Každý kus obchodních dat nese toto ID jako cizí klíč:

| Data | Sloupec |
|---|---|
| Produkty, kategorie, značky | `party_id` |
| Objednávky, žádosti o vrácení | `party_id` |
| Zákazníci, adresy | `party_id` |
| Položky skladových zásob, pohyby zásob | `party_id` |
| Ceníky, pravidla pro slevy, kupóny | `party_id` |
| Role, protokoly auditu | `party_id` |

Vaše `party_id` je viditelná v panelu administrátora na **[Administrátor → Organizace](/docs/admin/parties)**.

## Tři vrstvy vynucování

### Vrstva 1 - Bezpečnost na úrovni řádku (databáze)

Každá tabulka má zapnutou RLS (Row Level Security). Tři funkce Postgres omezují přístup:

- `user_has_permission(auth.uid(), party_id, permission_bit)` - kontroluje, zda má role volajícího v *této konkrétní straně* nastavený požadovaný bit oprávnění
- `is_admin_of(party_id)` - kontroluje, zda je volající členem konkrétní strany (ne jen libovolné strany)
- `is_owner()` - vrací pravdu pro globální roli Vlastník (8); vlastníci obcházejí všechny omezení strany

Tyto funkce se spouštějí při každém dotazu - i při přímých volání API - takže nelze obejít izolaci pomocí klíče JWT `anon` nebo uživatele.

### Vrstva 2 - Spouštěče integrity mezi stranami

Databázové spouštěče na operace INSERT a UPDATE vyvolají výjimku, pokud jsou smíšany záznamy z různých stran. Žádný aplikační kód nemůže to přepsat.

| Spouštěč | Co kontroluje |
|---|---|
| `check_order_item_party` | Produkt položky objednávky musí patřit k straně objednávky |
| `check_inventory_party` | Produkt položky skladových zásob musí patřit ke stejné straně jako záznam o zásobách |
| `check_stock_movement_party` | Položka skladových zásob pohybu musí odpovídat straně pohybu |
| `check_return_party` | `party_id` žádosti o vrácení musí odpovídat `party_id` její objednávky |
| `check_price_list_item_party` | Produkt položky ceníku musí patřit ke stejné straně jako ceník |
| `check_loyalty_party` | Zákazník transakce loajality musí patřit ke stejné straně |

Tyto spouštěče zachycují to, co RLS nemůže: případy, kdy uživatel má právo na zápis do dvou stran a pokouší se vytvořit propojení mezi stranami.

### Vrstva 3 - Aplikativní vrstva

Panel administrátora vynucuje rozsah strany na úrovni požadavku:

- Každá stránka administrátora volá `requireAdminCtx()`, která čte cookie `activePartyId`
- To cookie je ověřeno proti stranám, ke kterým uživatel skutečně má přístup, než je přijato
- Všechny servisní funkce přijímají `partyId` jako explicitní argument a předávají ho jako filtr při každém dotazu

## Kritické pravidla pro integrace eshopu

### Nikdy nepoužívejte klíč `service_role`

Klíč role služby **obejde všechny politiky RLS**. Pokud jej použijete ve svém frontendu eshopu nebo v jakémkoli kódu, který zpracovává nedůvěryhodný vstup, data každého nájemce budou vystavena všem ostatním nájemcům.

```
# ŠPATNÉ - odhaluje data všech nájemců
Authorization: Bearer <service_role_key>

# SPRÁVNÉ - RLS automaticky omezuje data
apikey: <anon_key>
Authorization: Bearer <user_jwt>
```

### Vždy filtrovejte veřejné koncové body podle `party_id`

Veřejné koncové body pro produkty a kategorie jsou čitelné pro kohokoli - **bez filtru strany získáte všechny aktivní produkty ze všech organizací**.

```
# ŠPATNÉ - vrací produkty ze všech orgánizací na platformě
GET /rest/v1/products?status=eq.active

# SPRÁVNÉ - vrací pouze produkty vaší organizace
GET /rest/v1/products?party_id=eq.YOUR_PARTY_ID&status=eq.active&is_visible=eq.true
```

Podrobný průvodce filtrováním najděte v [Přehledu API](/docs/api/overview).

## Co je veřejně čitelné (není vyžadováno ověření)

Tyto koncové body používají pouze klíč `anon` - není vyžadováno přihlášení uživatele. Vždy přidejte `?party_id=eq.{your_party_id}` pro omezení na vaši organizaci.

| Tabulka | Veřejný filtr |
|---|---|
| `products` | `status=eq.active` a `is_visible=eq.true` |
| `categories` | `is_visible=eq.true` |
| `product_images` | žádný (všechny obrázky pro všechny strany jsou veřejné - určeno pro CDN) |
| `product_categories` | žádný |
| `product_tags` | žádný |
| `product_variants` | `status=eq.active` |
| `brands` | `status=eq.active` |
| `product_reviews` | `status=eq.approved` |

## Co vyžaduje ověření

| Data | Požadavek |
|---|---|
| Košík, seznam přání | JWT uživatele (automaticky omezeno RLS pro ovězeného uživatele) |
| Objednávky (z pohledu zákazníka) | JWT uživatele |
| Administrátorské operace | JWT uživatele + příslušný bit oprávnění pro danou stranu |

## Rozsah role administrátora (důležitá poznámka)

Globální role **Administrátor** (4) může číst a zapisovat katalogová data (produkty, kategorie, značky) pro **všechny strany** - je to záměrné pro platformní administrátory, kteří spravují více organizací. Vlastní role **Administrátora eshopu** jsou vždy omezeny na stranu a nemohou překročit tuto hranici.

Pokud spravujete platformu, kde musí být každá organizace zcela izolována i od platformních administrátorů, přiřaďte všem manažerům role Administrátora eshopu s vlastními rolemi namísto globálních administrátorů.

## Související

- [Přehled API](/docs/api/overview) - jak připojit svůj eshop k API
- [Hierarchie rolí](/docs/users/roles) - Vlastník, Administrátor, Administrátor eshopu a jejich rozsahy
- [Systém oprávnění](/docs/users/permissions) - které bity oprávnění kontrolují které funkce
- [Nastavení prostředí](/docs/getting-started/environment) - kde najít svůj referenční projekt, klíč anon a `party_id`
