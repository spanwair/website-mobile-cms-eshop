-- Production-ready Terms & Conditions ("Obchodní podmínky") and Privacy Policy
-- ("Ochrana osobních údajů") for the "Repasado" demo storefront (refurbished-phone e-shop).
--
-- Drafted against current Czech law: zákon č. 89/2012 Sb. (občanský zákoník, incl. the
-- 2023 "modernizační novela" that replaced the old "záruka" concept with "právo z vadného
-- plnění"), zákon č. 634/1992 Sb. o ochraně spotřebitele, zákon č. 480/2004 Sb. o některých
-- službách informační společnosti, nařízení vlády č. 363/2013 Sb. (vzorové poučení a
-- formulář pro odstoupení od smlouvy), Nařízení EP a Rady (EU) 2016/679 (GDPR) and
-- zákon č. 110/2019 Sb. o zpracování osobních údajů. All company identifiers (IČO/DIČ/OR
-- vložka) are fictional and derived from the existing demo seed data — this is placeholder
-- copy for a fictional company, not advice for any real business, and does not replace a
-- lawyer's review before real-world use.
--
-- Safe to re-run: always overwrites the two pages' body/seo fields to the latest version
-- below (this intentionally replaces the earlier placeholder draft from
-- demo_store_legal_footer.sql). Apply with:
--   PGPASSWORD=postgres psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/seed/demo_store_legal_content_v2.sql

\set party_id 'a0000000-0000-0000-0000-000000000001'

UPDATE content_pages SET
  seo_title = 'Obchodní podmínky | Repasado',
  seo_description = 'Obchodní podmínky e-shopu Repasado s.r.o. — nákup, platba, doprava, reklamace a odstoupení od smlouvy do 14 dnů.',
  body = $body$## Obchodní podmínky

Těmito obchodními podmínkami (dále jen „**obchodní podmínky**") se řídí veškeré smluvní vztahy
vznikající mezi společností **Repasado s.r.o.** jako prodávajícím a zákazníky internetového
obchodu umístěného na webové stránce **www.repasado.cz** (dále jen „**e-shop**") jako kupujícími.

**Prodávající:**

- Obchodní firma: Repasado s.r.o.
- Sídlo: Karlova 15, 110 00 Praha 1, Česká republika
- IČO: 19283746
- DIČ: CZ19283746
- Zapsaná v obchodním rejstříku vedeném Městským soudem v Praze, oddíl C, vložka 398217
- E-mail: podpora@repasado.cz
- Telefon: +420 222 333 444
- Provozní doba zákaznické podpory: Po–Pá 9:00–18:00

Prodávající je plátcem DPH. Orgánem dozoru nad dodržováním povinností podle zákona
č. 634/1992 Sb., o ochraně spotřebitele, je **Česká obchodní inspekce** (Štěpánská 567/15,
120 00 Praha 2, www.coi.cz).

### 1. Úvodní ustanovení

1.1. Tyto obchodní podmínky upravují v souladu s § 1751 odst. 1 zákona č. 89/2012 Sb.,
občanský zákoník (dále jen „**občanský zákoník**"), vzájemná práva a povinnosti smluvních
stran vzniklé v souvislosti nebo na základě kupní smlouvy uzavírané mezi prodávajícím a
jinou fyzickou či právnickou osobou (dále jen „**kupující**") prostřednictvím e-shopu.

1.2. Je-li kupujícím spotřebitel ve smyslu § 419 občanského zákoníku (fyzická osoba, která
mimo rámec své podnikatelské činnosti nebo mimo rámec samostatného výkonu svého povolání
uzavírá smlouvu s prodávajícím nebo s ním jinak jedná), řídí se vztah mezi ním a prodávajícím
těmito obchodními podmínkami, občanským zákoníkem a zákonem č. 634/1992 Sb., o ochraně
spotřebitele (dále jen „**zákon o ochraně spotřebitele**"). Ustanovení odchylná od obchodních
podmínek je možné sjednat v kupní smlouvě; odchylná ujednání v kupní smlouvě mají přednost
před ustanoveními obchodních podmínek.

1.3. Je-li kupujícím podnikatel jednající v rámci své podnikatelské činnosti, neuplatní se
na takový vztah ustanovení na ochranu spotřebitele (zejména čl. 6, 7 a 10 těchto podmínek) a
odpovědnost za vady se řídí obecnou úpravou kupní smlouvy dle § 2079 a násl. občanského
zákoníku.

1.4. Znění obchodních podmínek může prodávající měnit či doplňovat. Tímto ustanovením nejsou
dotčena práva a povinnosti vzniklá po dobu účinnosti předchozího znění obchodních podmínek.
Pro konkrétní kupní smlouvu je vždy rozhodné znění obchodních podmínek platné a účinné v
okamžiku odeslání objednávky.

### 2. Uživatelský účet a uzavření kupní smlouvy

2.1. Na základě registrace kupujícího provedené na e-shopu může kupující přistupovat do
svého uživatelského účtu. Objednávat zboží lze i bez registrace, přímo z rozhraní e-shopu.

2.2. Veškerá prezentace zboží umístěná v e-shopu je informativního charakteru a prodávající
není povinen uzavřít kupní smlouvu ohledně tohoto zboží — ustanovení § 1732 odst. 2
občanského zákoníku se nepoužije. Nabídka zboží a jeho cena zůstávají v platnosti po dobu,
kdy jsou zobrazovány v e-shopu.

2.3. Pro objednání zboží vyplní kupující objednávkový formulář, který obsahuje zejména
informace o objednávaném zboží, způsobu úhrady kupní ceny, požadovaném způsobu doručení a
nákladech spojených s dodáním zboží (dále společně jen jako „**objednávka**"). Před zasláním
objednávky je kupujícímu umožněno zkontrolovat a měnit údaje, které do objednávky vložil, a
to i s ohledem na možnost kupujícího zjišťovat a opravovat chyby vzniklé při zadávání dat do
objednávky. Objednávku odešle kupující prodávajícímu kliknutím na tlačítko „Objednat s
povinností platby". Údaje uvedené v objednávce jsou prodávajícím považovány za správné.

2.4. Odesláním objednávky kupující stvrzuje, že se seznámil s těmito obchodními podmínkami a
že s nimi souhlasí.

2.5. Neprodleně po obdržení objednávky zašle prodávající kupujícímu potvrzení o obdržení
objednávky na e-mailovou adresu uvedenou v objednávce; toto potvrzení se nepovažuje za
uzavření smlouvy. Kupní smlouva je uzavřena až okamžikem, kdy prodávající kupujícímu zašle
samostatné potvrzení o přijetí (akceptaci) objednávky na uvedenou e-mailovou adresu.

2.6. Prodávající je vždy oprávněn v závislosti na charakteru objednávky (množství zboží,
výše kupní ceny, předpokládané náklady na dopravu, dostupnost skladem) požádat kupujícího o
dodatečné potvrzení objednávky (například písemně či telefonicky), nebo objednávku odmítnout.
Prodávající si dále vyhrazuje právo objednávku odmítnout, pokud se objednané zboží již
neprodává, není skladem, nebo pokud v důsledku zjevné technické chyby byla u zboží zobrazena
zcela zjevně chybná cena; o takové skutečnosti bude kupující bez zbytečného odkladu
informován.

2.7. Kupující souhlasí s použitím komunikačních prostředků na dálku při uzavírání kupní
smlouvy. Náklady vzniklé kupujícímu při použití komunikačních prostředků na dálku v
souvislosti s uzavřením kupní smlouvy (náklady na internetové připojení, náklady na
telefonní hovory) si hradí kupující sám.

2.8. Smlouva je uzavírána v českém jazyce a je prodávajícím archivována v elektronické
podobě po dobu nejméně 5 let od jejího uzavření za účelem jejího úspěšného splnění a není
přístupná třetím nepřidruženým stranám; kupující ji obdrží e-mailem v podobě potvrzení
objednávky a daňového dokladu.

### 3. Specifika prodeje repasovaného (použitého) zboží

3.1. Prodávající se specializuje na prodej **repasovaného (použitého) elektronického
zařízení** — zejména telefonů, tabletů a příslušenství. Kupující bere na vědomí, že se
nejedná o nové zboží v originálním výrobním balení a že u zboží mohou být přítomny drobné
kosmetické stopy předchozího používání odpovídající deklarovanému stavu.

3.2. Každý kus zboží je před nabídkou k prodeji funkčně otestován a zařazen do jedné z
kategorií stavu (Nové, Zánovní, A, B, C), jejichž definice je uvedena u konkrétního produktu
a podrobně popsána na stránce „Pečlivě testováno". Popis stavu zboží u konkrétního produktu
má přednost před obecnou definicí kategorie.

3.3. Kapacita baterie u repasovaných telefonů je garantována na minimálně 80 % původní
výrobní kapacity, není-li u konkrétního produktu uvedeno jinak. Nižší naměřená kapacita v
tomto rozmezí se nepovažuje za vadu zboží.

3.4. Prodávající prohlašuje, že veškeré nabízené zboží je originálním výrobkem příslušné
značky a že u každého kusu bylo před nákupem ověřeno sériové číslo/IMEI, mimo jiné za účelem
vyloučení odcizeného nebo blokovaného zařízení (podrobněji viz stránka „Záruka originality").

3.5. Není-li u zboží výslovně uvedeno jinak, dodává se bez originálního příslušenství
výrobce (nabíječka, sluchátka, krabička); rozsah dodávaného příslušenství je vždy uveden v
popisu produktu.

### 4. Cena zboží a platební podmínky

4.1. Ceny zboží uvedené v e-shopu jsou platné v okamžiku odeslání objednávky, jsou uvedeny
včetně daně z přidané hodnoty a všech souvisejících poplatků, s výjimkou nákladů na dopravu a
způsob platby, které jsou uvedeny samostatně v průběhu tvorby objednávky a v jejím shrnutí.

4.2. Kupní cenu a případné náklady spojené s dodáním zboží dle kupní smlouvy může kupující
uhradit prodávajícímu následujícími způsoby:

- platební kartou online (Visa, Mastercard) prostřednictvím zabezpečené platební brány,
- prostřednictvím Google Pay nebo Apple Pay,
- bankovním převodem na základě zálohové faktury vystavené prodávajícím,
- v hotovosti nebo kartou na dobírku při převzetí zásilky od dopravce,
- na splátky prostřednictvím spotřebitelského úvěru poskytovaného partnerskou nebankovní
  společností (Home Credit); poskytnutí úvěru podléhá samostatnému posouzení úvěruschopnosti
  kupujícího ze strany poskytovatele úvěru a řídí se jeho vlastními obchodními podmínkami,
- v hotovosti nebo kartou při osobním odběru na prodejně.

4.3. Společně s kupní cenou je kupující povinen zaplatit prodávajícímu také náklady spojené s
balením a dodáním zboží ve smluvené výši. Není-li uvedeno výslovně jinak, rozumí se dále
kupní cenou i tyto náklady.

4.4. V případě platby na dobírku je kupní cena splatná při převzetí zboží. V případě
bezhotovostní platby předem je kupní cena splatná do 5 dnů od uzavření kupní smlouvy; závazek
kupujícího uhradit cenu je splněn okamžikem připsání příslušné částky na bankovní účet
prodávajícího.

4.5. Vlastnické právo ke zboží přechází na kupujícího teprve úplným zaplacením kupní ceny.

4.6. Prodávající vystaví kupujícímu daňový doklad – fakturu, který slouží zároveň jako
dodací list a je zaslán v elektronické podobě na e-mailovou adresu kupujícího.

4.7. Je-li to v obchodním styku obvyklé nebo je-li tak stanoveno obecně závaznými právními
předpisy, vystaví prodávající ohledně plateb prováděných na základě kupní smlouvy kupujícímu
daňový doklad. Prodávající je plátcem daně z přidané hodnoty.

### 5. Dodací podmínky

5.1. Zboží je dodáváno níže uvedenými způsoby, jejichž podrobný přehled včetně orientačních
lhůt je uveden na stránce „Platba a doprava":

- přepravní službou Zásilkovna (výdejní místo nebo Z-box),
- kurýrní službou PPL,
- kurýrní službou GLS,
- Českou poštou,
- osobním odběrem na prodejně prodávajícího na adrese Karlova 15, 110 00 Praha 1.

5.2. Je-li prodávající podle kupní smlouvy povinen dodat zboží na místo určené kupujícím v
objednávce, je kupující povinen převzít zboží při dodání. V případě, že je z důvodů na straně
kupujícího nutno zboží doručovat opakovaně nebo jiným způsobem, než bylo uvedeno v
objednávce, je kupující povinen uhradit náklady spojené s opakovaným doručováním zboží,
resp. náklady spojené s jiným způsobem doručení.

5.3. Při převzetí zboží od přepravce je kupující povinen zkontrolovat neporušenost obalu
zboží a v případě jakýchkoliv závad toto neprodleně oznámit přepravci. V případě shledání
porušení obalu svědčícího o neoprávněném vniknutí do zásilky nemusí kupující zásilku od
přepravce převzít.

5.4. Nebezpečí škody na zboží přechází na kupujícího spotřebitele okamžikem převzetí zboží
kupujícím nebo jím pověřenou osobou. Je-li kupujícím podnikatel, přechází nebezpečí škody na
zboží okamžikem předání zboží prvnímu dopravci k přepravě.

### 6. Odpovědnost za vady (reklamace)

6.1. Práva a povinnosti smluvních stran ohledně práv z vadného plnění se řídí příslušnými
obecně závaznými právními předpisy, zejména § 2099 a násl. a § 2158 a násl. občanského
zákoníku.

6.2. Prodávající odpovídá kupujícímu spotřebiteli za to, že zboží při převzetí nemá vady a
že se vady nevyskytnou v době **24 měsíců** od převzetí zboží. To neplatí u vad, na které byl
kupující výslovně upozorněn před uzavřením smlouvy (např. konkrétní kosmetická vada popsaná v
popisu produktu odpovídající deklarovanému stavu B nebo C) — na takové vady se odpovědnost
prodávajícího nevztahuje.

6.3. Práva z vadného plnění uplatňuje kupující u prodávajícího postupem a v rozsahu
podrobně popsaným v samostatném dokumentu „**Reklamační řád**", který je nedílnou součástí
těchto obchodních podmínek.

6.4. Práva z vadného plnění se nevztahují na běžné opotřebení zboží způsobené jeho obvyklým
užíváním, ani na vady vzniklé neodborným zásahem, mechanickým poškozením, pádem, kontaktem s
kapalinou nebo používáním v rozporu s návodem k obsluze.

### 7. Odstoupení od smlouvy (spotřebitel)

7.1. Kupující, který je spotřebitelem a uzavřel kupní smlouvu distančním způsobem
(prostřednictvím e-shopu) nebo mimo obchodní prostory prodávajícího, má v souladu s § 1829
odst. 1 občanského zákoníku právo od kupní smlouvy odstoupit, a to do **14 dnů** ode dne
převzetí zboží, bez udání důvodu a bez jakékoliv sankce.

7.2. Pro účely uplatnění práva na odstoupení od smlouvy musí kupující o svém odstoupení od
kupní smlouvy informovat prodávajícího formou jednostranného právního jednání (například
dopisem zaslaným prostřednictvím provozovatele poštovních služeb, nebo e-mailem na adresu
podpora@repasado.cz). Kupující může použít vzorový formulář pro odstoupení od smlouvy uvedený
níže, není to však jeho povinností.

7.3. Podrobný postup vrácení zboží, lhůty pro vrácení peněz a výjimky z práva na odstoupení
(zejména zboží upravené na přání kupujícího) jsou uvedeny na samostatné stránce „**Vrácení
zboží a odstoupení od smlouvy**".

7.4. V případě odstoupení od smlouvy dle tohoto článku se kupní smlouva od počátku ruší.
Zboží musí být prodávajícímu vráceno do 14 dnů od odstoupení od smlouvy. Odstoupí-li
kupující od smlouvy, nese kupující náklady spojené s navrácením zboží.

7.5. V případě odstoupení od smlouvy vrátí prodávající peněžní prostředky přijaté od
kupujícího do 14 dnů od odstoupení od smlouvy kupujícího, ne však dříve, než mu kupující
zboží předá nebo prokáže, že zboží prodávajícímu odeslal, a to stejným způsobem, jakým je
prodávající od kupujícího přijal, pokud kupující neurčí jinak.

7.6. Kupující odpovídá prodávajícímu pouze za snížení hodnoty zboží, které vzniklo v
důsledku nakládání s tímto zbožím jinak, než je nutné k tomu, aby se seznámil s povahou,
vlastnostmi a funkčností zboží (tj. obdobně, jako by mu bylo umožněno v kamenné prodejně).

> **Vzorový formulář pro odstoupení od smlouvy**
>
> (vyplňte tento formulář a zašlete jej zpět pouze v případě, že chcete odstoupit od smlouvy)
>
> Oznámení o odstoupení od smlouvy
>
> Adresát: Repasado s.r.o., Karlova 15, 110 00 Praha 1, e-mail: podpora@repasado.cz
>
> Oznamuji, že tímto odstupuji od smlouvy o nákupu tohoto zboží: .....................
>
> Datum objednání: ..................... Datum obdržení: .....................
>
> Jméno a příjmení kupujícího: .....................
>
> Adresa kupujícího: .....................
>
> Číslo objednávky / bankovní účet pro vrácení platby: .....................
>
> Podpis kupujícího (pouze pokud je tento formulář zasílán v listinné podobě): .....................
>
> Datum: .....................

### 8. Ochrana osobních údajů

Zpracování osobních údajů kupujícího se řídí samostatným dokumentem „**Ochrana osobních
údajů**", který je nedílnou součástí těchto obchodních podmínek a je dostupný v patičce
e-shopu.

### 9. Mimosoudní řešení spotřebitelských sporů (ADR)

9.1. K mimosoudnímu řešení spotřebitelských sporů z kupní smlouvy je příslušná **Česká
obchodní inspekce**, se sídlem Štěpánská 567/15, 120 00 Praha 2, IČO: 000 20 869,
internetová adresa: **https://adr.coi.cz**. Platformu pro řešení sporů on-line nacházející se
na internetové adrese **https://ec.europa.eu/consumers/odr** je možné využít při řešení sporů
mezi prodávajícím a kupujícím z kupní smlouvy uzavřené elektronickými prostředky.

9.2. Evropské spotřebitelské centrum Česká republika, se sídlem Štěpánská 567/15, 120 00
Praha 2, internetová adresa: https://www.evropskyspotrebitel.cz, je kontaktním místem podle
Nařízení Evropského parlamentu a Rady (EU) č. 524/2013.

### 10. Doručování a komunikace

10.1. Nebude-li dohodnuto jinak, veškerá korespondence související s kupní smlouvou musí být
druhé smluvní straně doručena písemně, a to elektronickou poštou, osobně nebo doporučeně
prostřednictvím provozovatele poštovních služeb.

10.2. Kupujícímu je doručováno na e-mailovou adresu uvedenou v jeho objednávce nebo
uživatelském účtu.

### 11. Závěrečná ustanovení

11.1. Pokud vztah založený kupní smlouvou obsahuje mezinárodní (zahraniční) prvek, pak
strany sjednávají, že vztah se řídí českým právem. Volbou práva podle předchozí věty není
kupující, který je spotřebitelem, zbaven ochrany, kterou mu poskytují ustanovení právního
řádu, od nichž se nelze smluvně odchýlit, a jež by se v případě neexistence volby práva jinak
použila dle ustanovení čl. 6 odst. 1 Nařízení Evropského parlamentu a Rady (ES) č. 593/2008.

11.2. Je-li některé ustanovení obchodních podmínek neplatné nebo neúčinné, nebo se takovým
stane, namísto neplatných ustanovení nastoupí ustanovení, jehož smysl se neplatnému
ustanovení co nejvíce přibližuje. Neplatností nebo neúčinností jednoho ustanovení není
dotčena platnost ostatních ustanovení.

11.3. Kupní smlouva včetně obchodních podmínek je archivována prodávajícím v elektronické
podobě a není veřejně přístupná.

11.4. Znění těchto obchodních podmínek je účinné od 1. srpna 2026. Prodávající si vyhrazuje
právo na změnu těchto obchodních podmínek. Tímto ustanovením nejsou dotčena práva a
povinnosti vzniklá po dobu účinnosti předchozího znění obchodních podmínek.

**Kontaktní údaje prodávajícího:** Repasado s.r.o., Karlova 15, 110 00 Praha 1,
e-mail: podpora@repasado.cz, telefon: +420 222 333 444.
$body$
WHERE party_id = :'party_id' AND slug = 'obchodni-podminky';


UPDATE content_pages SET
  seo_title = 'Ochrana osobních údajů | Repasado',
  seo_description = 'Zásady zpracování osobních údajů e-shopu Repasado s.r.o. v souladu s GDPR — jaké údaje zpracováváme, proč, jak dlouho a jaká máte práva.',
  body = $body$## Ochrana osobních údajů

Ochrana Vašich osobních údajů je pro nás důležitá. Tyto zásady popisují, jak společnost
**Repasado s.r.o.** zpracovává osobní údaje v souvislosti s provozem internetového obchodu
**www.repasado.cz**, v souladu s Nařízením Evropského parlamentu a Rady (EU) 2016/679, o
ochraně fyzických osob v souvislosti se zpracováním osobních údajů (dále jen „**GDPR**"), a
zákonem č. 110/2019 Sb., o zpracování osobních údajů.

### 1. Kdo je správcem Vašich osobních údajů

Správcem osobních údajů je **Repasado s.r.o.**, IČO: 19283746, se sídlem Karlova 15,
110 00 Praha 1, zapsaná v obchodním rejstříku vedeném Městským soudem v Praze, oddíl C,
vložka 398217 (dále jen „**správce**" nebo „**my**").

Ve věcech ochrany osobních údajů nás můžete kontaktovat na e-mailu **podpora@repasado.cz**
nebo písemně na výše uvedené adrese sídla. Vzhledem k rozsahu a povaze zpracování jsme
neměli povinnost jmenovat pověřence pro ochranu osobních údajů (DPO); Vaše žádosti
vyřizujeme přímo my jako správce.

### 2. Jaké osobní údaje zpracováváme

- **Identifikační a kontaktní údaje** — jméno, příjmení, fakturační a doručovací adresa,
  e-mailová adresa, telefonní číslo.
- **Údaje o objednávkách a transakcích** — historie objednávek, obsah nákupního košíku,
  zakoupené zboží, způsob a stav platby, reklamace a jejich vyřízení.
- **Údaje o uživatelském účtu** — přihlašovací e-mail, zabezpečeně uložený (hashovaný) otisk
  hesla, historie přihlášení.
- **Údaje pro výkup zařízení** — pokud nám prodáváte použité zařízení (výkup), zpracováváme
  identifikační údaje z průkazu totožnosti (jméno, příjmení, číslo dokladu) a sériové
  číslo/IMEI vykupovaného zařízení. Toto zpracování je nezbytné ke splnění naší zákonné
  povinnosti evidovat prodejce použitého zboží podle živnostenského zákona (vázaná živnost
  „Výkup, zpracování, prodej nebo jiné nakládání s použitým zbožím") a slouží k prevenci
  obchodu s odcizeným zbožím.
- **Technické a provozní údaje** — IP adresa, typ a verze prohlížeče, identifikátory
  souborů cookie a obdobných technologií (podrobně viz „Zásady používání cookies").
- **Marketingové údaje** — e-mailová adresa a údaje o interakci s obchodními sděleními,
  pokud jste udělili souhlas se zasíláním newsletteru.

Osobní údaje získáváme přímo od Vás — vyplněním objednávkového formuláře, registrací
uživatelského účtu, komunikací se zákaznickou podporou nebo přihlášením k odběru novinek.

### 3. Účely a právní základ zpracování

- **Vyřízení objednávky, dodání zboží, fakturace** — plnění kupní smlouvy (čl. 6 odst. 1
  písm. b) GDPR).
- **Vedení uživatelského účtu** — plnění smlouvy / oprávněný zájem (čl. 6 odst. 1 písm. b),
  f) GDPR).
- **Vyřízení reklamace a odstoupení od smlouvy** — plnění smlouvy a zákonné povinnosti
  (čl. 6 odst. 1 písm. b), c) GDPR).
- **Vedení účetnictví a daňové evidence** — plnění právní povinnosti (čl. 6 odst. 1 písm. c)
  GDPR).
- **Evidence výkupu použitého zboží** — plnění právní povinnosti dle živnostenského zákona
  (čl. 6 odst. 1 písm. c) GDPR).
- **Vymáhání pohledávek, prevence podvodů, ochrana práv správce** — oprávněný zájem správce
  (čl. 6 odst. 1 písm. f) GDPR).
- **Zasílání newsletteru a obchodních sdělení** — souhlas subjektu údajů (čl. 6 odst. 1
  písm. a) GDPR); u stávajících zákazníků obdobné nabídky vlastního zboží dle § 7 odst. 3
  zákona č. 480/2004 Sb. na základě oprávněného zájmu, s možností kdykoliv odmítnout.
- **Analytické a marketingové cookies** — souhlas subjektu údajů udělený v cookie liště
  (čl. 6 odst. 1 písm. a) GDPR).

Osobní údaje nejsou využívány k žádnému rozhodování, které by mělo vůči Vám právní účinky
nebo se Vás obdobným způsobem významně dotýkalo (nedochází k automatizovanému rozhodování
ani profilování ve smyslu čl. 22 GDPR).

### 4. Doba uchování osobních údajů

- Údaje o objednávkách a účetní a daňové doklady uchováváme po dobu **10 let** od konce
  zdaňovacího období, ve kterém se plnění uskutečnilo, v souladu se zákonem č. 235/2004 Sb.,
  o dani z přidané hodnoty, a zákonem č. 563/1991 Sb., o účetnictví.
- Údaje spojené s uživatelským účtem uchováváme po dobu jeho existence a dále po dobu 3 let
  od poslední aktivity, poté je účet spolu s údaji anonymizován nebo smazán.
- Údaje pro účely evidence výkupu použitého zboží uchováváme po dobu stanovenou příslušným
  právním předpisem, nejméně však po dobu 5 let.
- Osobní údaje zpracovávané na základě souhlasu (newsletter, marketingové cookies)
  zpracováváme do odvolání souhlasu, nejdéle však po dobu 3 let od udělení, pokud jej
  předtím neobnovíte.
- Po uplynutí příslušné doby uchování jsou osobní údaje bezpečně vymazány nebo anonymizovány.

### 5. Komu osobní údaje předáváme

Osobní údaje předáváme třetím osobám pouze v rozsahu nezbytném pro splnění účelu, pro který
byly shromážděny, a to zejména:

- **přepravcům** zajišťujícím doručení zásilky (Zásilkovna, PPL, GLS, Česká pošta) — jméno,
  adresa, telefon, e-mail,
- **poskytovateli platební brány** zajišťujícímu zpracování online plateb kartou, Google Pay
  a Apple Pay — údaje nezbytné k autorizaci platby; údaje o platební kartě zpracovává
  výhradně poskytovatel platební brány, nikoliv správce,
- **poskytovateli spotřebitelského financování** (Home Credit) v případě, že si zvolíte
  platbu na splátky — v tomto případě poskytovatel úvěru zpracovává Vaše údaje jako
  samostatný správce dle vlastních zásad ochrany osobních údajů,
- **poskytovateli účetních a daňových služeb** za účelem plnění zákonných povinností
  správce,
- **poskytovateli IT infrastruktury a hostingu** zajišťujícímu provoz e-shopu a databáze,
- **poskytovateli nástroje pro e-mailový marketing**, pokud jste udělili souhlas se
  zasíláním newsletteru,
- orgánům veřejné moci, pokud nám to ukládá právní předpis.

Se všemi zpracovateli máme uzavřenu smlouvu o zpracování osobních údajů dle čl. 28 GDPR,
která jim ukládá zajistit alespoň takovou úroveň ochrany osobních údajů, jako je stanovena
tímto dokumentem a GDPR. Osobní údaje neprodáváme třetím stranám za marketingovými účely.

### 6. Předávání osobních údajů do třetích zemí

Osobní údaje zpracováváme primárně na serverech umístěných v Evropské unii. Pokud v rámci
analytických nebo marketingových nástrojů dochází k předání údajů (typicky anonymizovaných
či pseudonymizovaných identifikátorů cookie) poskytovatelům se sídlem mimo EU/EHP, děje se
tak výhradně na základě Vašeho souhlasu uděleného v cookie liště a za podmínek zajišťujících
odpovídající úroveň ochrany (standardní smluvní doložky schválené Evropskou komisí dle
čl. 46 GDPR). Bez Vašeho souhlasu k takovému předání nedochází.

### 7. Zabezpečení osobních údajů

Přijali jsme vhodná technická a organizační opatření k zabezpečení osobních údajů
odpovídající současnému stavu techniky, zejména: šifrovaný přenos dat (HTTPS/TLS),
zabezpečené uložení hesel pomocí jednosměrné hashovací funkce, omezení přístupu k osobním
údajům na zaměstnance a zpracovatele, kteří je nezbytně potřebují pro plnění svých úkolů, a
kteří jsou vázáni mlčenlivostí, pravidelné zálohování a řízení přístupových oprávnění v
databázovém systému.

### 8. Vaše práva

V souvislosti se zpracováním osobních údajů máte podle GDPR následující práva:

- **právo na přístup** k osobním údajům (čl. 15 GDPR) — získat potvrzení, zda a jaké údaje
  o Vás zpracováváme, a jejich kopii,
- **právo na opravu** nepřesných osobních údajů (čl. 16 GDPR),
- **právo na výmaz** („právo být zapomenut"), pokud pominul účel zpracování nebo je
  zpracování protiprávní (čl. 17 GDPR),
- **právo na omezení zpracování** (čl. 18 GDPR),
- **právo na přenositelnost údajů** zpracovávaných na základě souhlasu nebo smlouvy
  automatizovaně, ve strukturovaném a strojově čitelném formátu (čl. 20 GDPR),
- **právo vznést námitku** proti zpracování na základě oprávněného zájmu, včetně přímého
  marketingu (čl. 21 GDPR),
- **právo kdykoliv odvolat souhlas** se zpracováním, aniž je tím dotčena zákonnost
  zpracování založená na souhlasu uděleném před jeho odvoláním,
- **právo podat stížnost** u dozorového úřadu, kterým je **Úřad pro ochranu osobních
  údajů**, se sídlem Pplk. Sochora 27, 170 00 Praha 7, internetová adresa: **www.uoou.cz**.

Uvedená práva můžete uplatnit zasláním žádosti na e-mail **podpora@repasado.cz**. Na Vaši
žádost odpovíme bez zbytečného odkladu, nejpozději do jednoho měsíce od jejího obdržení; tuto
lhůtu můžeme ve výjimečných případech prodloužit o další dva měsíce.

### 9. Soubory cookie

E-shop používá soubory cookie a obdobné technologie ke zajištění základní funkčnosti,
analýze návštěvnosti a případně k personalizaci reklamy. Podrobný přehled používaných
cookies, jejich účelu a možnosti nastavení souhlasu naleznete na samostatné stránce
„**Zásady používání cookies**".

### 10. Newsletter a obchodní sdělení

Přihlášením k odběru novinek nám udělujete souhlas se zasíláním obchodních sdělení na Vaši
e-mailovou adresu dle § 7 zákona č. 480/2004 Sb., o některých službách informační
společnosti. Souhlas je dobrovolný a můžete jej kdykoliv odvolat kliknutím na odkaz pro
odhlášení uvedený v každém zaslaném e-mailu, případně zasláním žádosti na
podpora@repasado.cz, aniž by to mělo vliv na vyřizování Vašich případných objednávek.

### 11. Změny těchto zásad

Tyto zásady ochrany osobních údajů můžeme čas od času aktualizovat, zejména v reakci na
změny právních předpisů nebo našich zpracovatelských postupů. Aktuální znění je vždy
dostupné na této stránce. Toto znění je účinné od **1. srpna 2026**.

**Kontakt:** Repasado s.r.o., Karlova 15, 110 00 Praha 1, e-mail: podpora@repasado.cz,
telefon: +420 222 333 444.
$body$
WHERE party_id = :'party_id' AND slug = 'ochrana-osobnich-udaju';
