---
title: Domény
description: Připojte a ověřte vlastní doménu pro svůj obchod pomocí DNS TXT záznamu
---

Stránka Domény vám umožňuje připojit vlastní doménu (např. `kytkazbeskyd.cz`) k vašemu obchodu a dokázat, že ji vlastníte, pomocí DNS TXT záznamu.
Dokud nepřipojíte vlastní doménu, váš obchod běží na platformní cestě `/eshop-{slug}`.
Je to jedna záložka v sadě [Nastavení obchodu](/docs/admin/settings-branding).

## Požadované oprávnění

| Bit oprávnění | Název | Kdo ho má výchozí |
|---|---|---|
| 1024 | MANAGE_SETTINGS | Vlastník, Administrátor, Administrátor obchodu (s tímto bitem) |

Bez `MANAGE_SETTINGS` vás systém přesměruje na `/admin`.

## Přidávání a ověřování domény (`/admin/settings/domains`)

### Jak to udělat

1. Zadejte doménu (je v malých písmech a bez přebytečných znaků) a klikněte na **Přidat doménu**.
   Vytvoří se řádek `store_domains` s náhodným `verification_token` a stavem **Očekává**.
2. U vašeho DNS poskytovatele vytvořte TXT záznam, který vám stránka ukazuje:
   `TXT {VERIFICATION_SUBDOMAIN}.{your-domain} = {verification_token}`.
3. Jakmile se DNS rozšíří, klikněte na **Ověřit**.
   Server provede živé vyhledávání TXT (`verifyDomainTxtRecord`); při shodě se doména přepne na **Ověřeno**, jinak získáte tip k ověření a zkuste to znovu.
4. Pro odpojení domény klikněte na **Odstranit** (s dialogem `confirm()`).

### Sloupce tabulky

| Sloupec | Popis |
|---|---|
| Doména | Monospaced název domény. |
| Stav | Zelené "Ověřeno" nebo jantarové "Očekává". Řádky ve stavu Očekává také vypisují přesný TXT záznam k přidání. |
| Přidáno | Datum vytvoření. |
| Akce | **Ověřit** (pouze při čekání) a **Odstranit**. |

Prázdný seznam zobrazuje centrový řádek "žádné domény".

## Data a úložiště (cloud)

- **Tabulka:** `store_domains` (`party_id`, `domain`, `verification_token`, `verified`, `created_at`).
- **Služby:** `fetchStoreDomains`, `getStoreDomain`, `addStoreDomain`, `verifyStoreDomain`, `removeStoreDomain` (`storeConfigService`).
- **Pomocné funkce:** `verifyDomainTxtRecord`, `VERIFICATION_SUBDOMAIN` z `domainVerification`.
- **Komponenta:** `SettingsTabs`.
- Omezeno na `ctx.partyId`.

## Související stránky

- [Vzhled značky](/docs/admin/settings-branding) - vaše identita značky, kterou bude vlastní doména předstírat
- [Architektura s více nájemníky](/docs/architecture/multi-tenancy) - jak domény a cesty `/eshop-{slug}` vedou k správné organizaci
