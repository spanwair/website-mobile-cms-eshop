---
title: Organizace
description: Vytvářejte, upravujte, schvalujte a obsazujte organizace (strany), včetně režimu prodejce, pravidel stavu a procesu zveřejňování členů
---

**Organizace** (tzv. „strana“ v databázi) je nejvyšší kontejner pro data obchodu.
Produkty, kategorie, objednávky, zákazníci, skladové zásoby, ceny a obsah CMS patří do přesně jedné organizace.
Tímto způsobem platforma udržuje více e-shopů, jako je [Kytka z Beskyd](/docs/en/admin/dashboard) a jakýkoli jiný nájemce, zcela izolované od sebe.

## Požadované oprávnění

| Akce | Požadavek |
|---|---|
| Zobrazení seznamu organizací | MANAGE_USERS (2) |
| Otevření stránky podrobností organizace | MANAGE_USERS (2) **nebo** MANAGE_AUDIT (4096) |
| Úprava informací a stavu organizace | MANAGE_AUDIT (4096) |
| Zveřejnění nebo odstranění členů | MANAGE_USERS (2) |
| Vytvoření nové organizace | Role administrátora nebo vlastníka (ne bit oprávnění) |
| Schválení čekající organizace nebo nastavení stavu `closed` | Pouze vlastník |

Pokud vám chybí potřebný bit, stránka vás přesměruje na `/admin`.
Na stránce podrobností, pokud nemáte ani MANAGE_USERS ani MANAGE_AUDIT, budete přesměrováni na `/admin`.
Nenávladatel, který se pokusí otevřít stranu, ke které nepatří, je vrácen na `/admin/parties`.

## Seznam organizací (`/admin/parties`)

Panel nástrojů zobrazuje počet organizací a tlačítko **Nová organizace**, které je viditelné pouze pro administrátory a vlastníky (role >= ADMIN).
Vlastníci vidí všechny organizace v systému; administrátoři a administrátoři e-shopů vidí pouze strany, na které jsou přiděleni.

| Sloupec | Popis |
|---|---|
| Název | Zobrazený název organizace (tučné písmo) |
| Slug | Identifikátor bezpečný pro URL, monospaced, unikátní v celém systému |
| Společnost | Název právní společnosti (`company_name`) nebo pomlčka |
| Režim prodejce | Odznak: **Vlastní společnost** (neutrální) nebo **Provize** (zelený) |
| Stav | Barvený odznak: aktivní, neaktivní, zavřený nebo čekající na schválení (hnědý) |
| Vytvořeno | Datum vytvoření |
| Akce | **Zobrazit** otevře stránku podrobností |

Pokud nejsou žádné organizace, je zobrazen řádek s prázdným stavem uprostřed.

## Vytváření nové organizace (`/admin/parties/new`)

Pouze administrátoři a vlastníci dosáhnou této stránky; jakýkoli uživatel pod úrovní administrátora je přesměrován na `/admin/parties`.
Pokud je otevřena s parametrem `?onboarding=1` (z [onboardingového průvodce](/docs/en/admin/onboarding)), objeví se úvodní banner a úspěšné přesměrování předá tento flag do tutoriálu.

### Máte IČO?

Formulář se otevře s přepínacím tlačítkem, **has_ico** (ano / ne), které přepíná mezi dvěma panely polí a rozhoduje o režimu prodejce organizace.

**Ano - mám číslo společnosti (režim vlastní společnosti):**

| Pole | Požadováno | Poznámky |
|---|---|---|
| Název společnosti | Ne | Má automatické vyplnění ARES: zadání názvu zobrazí živé návrhy z českého obchodního rejstříku |
| IČO | Ano (v tomto panelu) | 8č číselné číslo společnosti; při ztrátě fokusu volá `/api/ares` pro automatické vyplnění názvu a DPH |
| Číslo DPH | Ne | Automaticky vyplněno z ARES, pokud je k dispozici |
| E-mail pro fakturaci | Ne | E-mail pro oznámení fakturace |

**Ne - nemám číslo společnosti (režim provize Smalljobs):**

| Pole | Požadováno | Poznámky |
|---|---|---|
| Plné právní jméno | Ano | Jedinec prodávající pod dohodou provize platformy |
| Adresa 1 | Ano | Ulice |
| Město | Ano | |
| PSČ | Ano | |
| Bankovní účet | Ano | Kam jsou posílány čisté výplaty |
| Poznámka k osobnímu ID | Ne | Volitelná poznámka volného textu |
| Akceptace podmínek provize | Ano | Zaškrtávací políčko; plná dohoda o provizi je zobrazena v rozbalovacím boxu |

Oba panely také sdílejí, v horní části, **Název** (požadováno) a **Slug** (automaticky navrhovaný z názvu), a v dolní části dvě povinná právní zaškrtávací políčka platformy:

- **Akceptuji zásady ochrany osobních údajů** (požadováno)
- **Akceptuji podmínky platformy** (požadováno)

### Co se stane při odeslání

Validace probíhá na serveru:

- Název a slug musí být přítomny.
- Oba zaškrtávací políčka pro zásady ochrany osobních údajů a podmínky musí být zaškrtnuta, jinak získáte chybu „právně vyžadováno“.
- V režimu vlastní společnosti je vyžadováno IČO.
- V režimu provize jsou vyžadovány všechna právní jména, adresa, město, PSČ, bankovní účet a zaškrtávací políčko pro provizi.

Po úspěchu je organizace vytvořena pomocí `createParty`:

- `seller_mode` je nastaven na `own_company` (má IČO) nebo `smalljobs_commission` (bez IČO).
- **Každá nová organizace začíná stavem `pending_approval`** a zůstává skryta před veřejným obchodem, dokto ji vlastník neaktivuje.
  Toto je vynuceno spouštěčem databáze `enforce_party_approval_transition`, takže pouze vlastník může stranu přesunout do stavu `active`.
- `terms_accepted_at` a `terms_version` jsou zaznamenány (aktuální verze podmínek platformy).
- V režimu provize je také zaznamenána dohoda o provizi pomocí `acceptCommissionaireAgreement`.

Nový ID strany je uložen v souborku cookie `activePartyId`, takže okamžitě pracujete uvnitř ní, poté vás přesměruje na [stránku podrobností](#organization-detail-adminpartiesid).

## Podrobnosti organizace (`/admin/parties/{id}`)

Stránka podrobností je rozložena do dvou sloupců.
V horní části se objevují upozornění na úspěch a chyby, plus jakýkoli banner čekající na schválení.

### Bannery čekající na schválení

- **Vlastník**, který prohlíží organizaci ve stavu `pending_approval`, vidí banner s tlačítkem **Schválit**.
  Kliknutí na něj (po dialogu potvrzení) spustí akci `approve_party` a nastaví stav na `active`, čímž obchod získá živý stav.
- **Vytvořil (nenávladatel)** vidí banner pouze pro čtení vysvětlující, že organizace čeká na schválení vlastníka, plus odkaz do [onboardingového tutoriálu](/docs/en/admin/onboarding) při příchodu přes `?onboarding=1`.

### Levý sloupec - Informace o organizaci (vyžaduje MANAGE_AUDIT)

Upravitelný formulář s:

| Pole | Poznámky |
|---|---|
| Název | Požadováno |
| Název společnosti | |
| IČO | `company_ico` |
| Číslo DPH | `vat_number` |
| E-mail pro fakturaci | |
| Jazyk | `cs` nebo `en`; ovládá výchozí jazyk obsahu organizace |
| Slug | Upravitelný vstup pro slug |
| Stav | Podívejte se na pravidla stavu níže |
| Vytvořeno | Metainformace pouze pro čtení |

**Pravidla pro pole stavu** (zde se liší vlastník od administrátora):

- Vlastník: kompletní rozbalovací menu s možnostmi **aktivní**, **neaktivní** a **zavřený**.
  Pouze vlastník kdy vidí možnost `closed` a pouze vlastník může znovu otevřít zavřenou organizaci.
- Nenávladatel, organizace je `closed`: výběr je nahrazen pouze pro čtení zablokovanou štítkou a aktuální stav je odeslán nezměněný.
  Pokus o změnu zavřené organizace na serveru vrátí chybu `errorClosedOrg`.
- Nenávladatel, organizace je `pending_approval`: výběr je nahrazen pouze pro čtení zablokovanou štítkou.
  Nenávladatel nemůže přesunout čekající organizaci do stavu aktivní; pokus o to vrátí chybu `errorPendingApprovalOrg`.
- Jiný případ (nenávladatel, aktivní nebo neaktivní): rozbalovací menu pouze s možnostmi **aktivní** a **neaktivní**.

Ukládání spustí akci `update_party`.

### Levý sloupec - Kartička režimu prodejce

Pod formulářem informací se zobrazí kartička **Režim prodejce** (komponenta `PartySellerModeCard`), která zobrazuje aktuální režim a jeho popis.

- **Režim provize s aktivní dohodou**: zobrazuje datum účinnosti dohody a verzi akceptovaných podmínek, odkaz na [účet výplat](/docs/en/admin/payouts) a tlačítko **Zpět**.
  Zpět (po potvrzení) spustí `revoke_commission_agreement`.
- **Režim vlastní společnosti**: zobrazuje upozornění **Přepnout na provizi**.
  Rozbalení odhalí plný text dohody plus formulář (plné právní jméno, adresa 1, město, PSČ, bankovní účet, poznámka k osobnímu ID a povinné zaškrtávací políčko pro podmínky).
  Odeslání spustí `accept_commission_agreement`.

Obě akce režimu prodejce vyžadují MANAGE_AUDIT.

### Levý sloupec - Plán provize (vyžaduje MANAGE_AUDIT)

Pro organizace ve režimu vlastní společnosti karta **Plán provize** vám umožňuje přepsat poplatek platformy pro tuto jednu organizaci.
Obsahuje tři pole, která jsou výchozí prázdná (prázdné = použijte výchozí hodnotu platformy zobrazenou jako placeholder):

- **Standardní sazba** - procento účtované až do prahové hodnoty (výchozí hodnota platformy 10 %).
- **Snížená sazba** - procento účtované za celý měsíc, jakmile obrat překročí prahovou hodnotu (výchozí hodnota platformy 5 %).
- **Prahová hodnota snížené sazby** - měsíční obrat (Kč), nad kterým platí snížená sazba (výchozí hodnota platformy 29 900 Kč).

Sazby se zadávají jako procenta a ukládají jako zlomky v tabulce `parties` (`commission_rate_override`, `reduced_commission_rate_override`, `commission_threshold_override`).
Vymazání pole odstraní přepsání a vrátí se k globálnímu výchozí hodnotě.
Všechny výpočty poplatků čtou účinné hodnoty pomocí `resolveFeeSchedule()` v `shared/utils/billingFeeCalc.ts`, takže vlastní sazba platí při přípulumi výpočtu fakturačního období bez jakéhokoli změn kódu.
Upravování plánu vyžaduje MANAGE_AUDIT.

### Levý sloupec - Zveřejnit člena (vyžaduje MANAGE_USERS)

Formulář pro přidání někoho do této organizace.
Podívejte se na [úplný proces zveřejňování](/invite-flow) níže.

| Pole | Poznámky |
|---|---|
| E-mail | Požadováno |
| Role systému | Rozbalovací menu rolí, které můžete přidělit, filtrované na Eshop Admin a vyšší, ale pod Vlastníkem. Skryto, pokud nemůžete přidělit žádnou |
| Role | [Vlastní role](/docs/en/admin/roles), kterou udělíte v této straně. Vyplněno z ne-systémových rolí |

Poznámka vysvětluje chování zveřejňování a pokud nemáte žádné přidělitelné systémy role, přesměruje vás na [Uživatelé](/docs/en/admin/users).
Skript na straně klienta: když je systémová role nastavena na **admin**, rozbalovací menu role strany je skryto a není vyžadováno (administrátor získá plná oprávnění z systémové role, takže není potřeba vlastní role).
Pro **eshop_admin** se vlastní role stává vyžadovanou, pokud existují role.

### Pravý sloupec - Tabulka členů

Seznam všech členů této organizace s počtem v nadpise.

| Sloupec | Popis |
|---|---|
| Název | Zobrazený název člena (nebo „bez jména“) |
| E-mail | E-mail člena |
| Role | Jejich vlastní role v této straně, zobrazená jako odznak |
| Přidán | Datum přidání |
| (akce) | Tlačítko **Odstranit** |

**Odstranit** se zobrazí pouze tehdy, pokud máte MANAGE_USERS a řádek nepatří vám.
Spustí akci `remove` (po dialogu potvrzení), která smaže záznam `user_party_roles` tohoto uživatele pro tuto organizaci.
Odstranění člena nemazá jeho účet a neovlivňuje jeho přístup k jiným organizacím.

## Proces zveřejňování

Akce zveřejňování se rozvětvuje podle toho, zda e-mail již existuje, a podle zvolené systémové role.

- **Zveřejnění administrátorem** (`system_role` = admin): nepoužívá se vlastní role; administrátor získá plná oprávnění z systémové role.
- **Existující uživatel**: pokud je pod úrovní administrátora a již patří do jiné organizace, získáte chybu `errorUserInOtherOrg` (uživatel na úrovni e-shopu nemůže překrývat dvě organizace).
  Jinak je záznam jeho `user_party_roles` aktualizován, jeho `profiles.role` je zvýšena na zvolenou systémovou roli a oznámení e-mail uvádí všechny jeho organizace.
  Nesílá se žádný odkaz pro registraci, protože účet již existuje.
- **Nový uživatel**: je vydáno zveřejnění.
  V vývoji (`inviteUserByEmail`) Supabase GoTrue vykreslí šablonu zveřejnění do Mailpit; v produkci (`generateLink` + Resend) je odeslán stylový e-mail s odkazem na akci.
  Metainformace o zveřejnění (`pending_party_id`, `pending_role_id`, `pending_system_role`, `invited_by`) jsou vloženy, aby byl účet správně připojen, když uživatel klikne na `/auth/callback` a nastaví heslo.

Při přidělování rolí se vždy dodržuje `canAssignRole`: odeslaná systémová role je uznána pouze tehdy, pokud jste oprávněni ji přidělit.
Podívejte se na [Uživatelé](/docs/en/admin/users) pro pravidla přidělování a na [Role](/docs/en/admin/roles) pro vytváření vlastních rolí zobrazených v rozbalovacím menu zveřejňování.

## Data a úložiště (cloud)

- Tabulka `parties`: `name`, `slug`, `company_name`, `company_ico`, `vat_number`, `billing_email`, `seller_mode`, `status`, `lang`, `created_at`, `terms_accepted_at`, `terms_version`, `commission_rate_override`, `reduced_commission_rate_override`, `commission_threshold_override`.
  Spouštěč `enforce_party_approval_transition` omezuje přechod `pending_approval -> active` pouze na vlastníky.
- Tabulka `user_party_roles`: řádky členství (`user_id`, `party_id`, `role_id`) pro seznam členů, zveřejňování a odstranění.
- Tabulka `roles`: vlastní (ne-systémové) role zobrazené v rozbalovacím menu zveřejňování.
- Tabulka `profiles`: čtení/aktualizace pro `role` a `lang` zveřejněných uživatelů.
- Záznamy dohody o provizi přes `acceptCommissionaireAgreement` / `revokeCommissionaireAgreement` / `fetchCommissionaireAgreement`.
- `/api/ares` pro vyhledávání společností, `/api/switch-party` pro změnu aktivní organizace.
- E-mail přes `sendPartyInvitation`, `inviteUserByEmail` (vývoj) a `generateLink` (produkce).

## Související stránky

- [Onboarding](/docs/en/admin/onboarding) - průvodní proces, který používá samo-registrovaný administrátor k vytvoření své první organizace
- [Uživatelé](/docs/en/admin/users) - změna systémových rolí a přidělení organizací stávajících uživatelů
- [Role](/docs/en/admin/roles) - vytváření vlastních rolí nabízených v formuláři zveřejňování
- [Výplaty](/docs/en/admin/payouts) - účet odkazovaný z kartičky Režim prodejce
- [Fakturace](/docs/en/admin/billing) - přehled poplatků a výplat napříč organizacemi
- [Nastavení obchodu](/docs/en/admin/settings-branding) - vzhled značky a konfigurace pro vybranou organizaci
