---
title: Pokrytí testy
description: Co je testováno a co ne.
---

## Aktuální pokrytí (149 testů, 100 % úspěšných)

### Autentizace (01-auth)
- ✅ Přihlášení administrátora s platnými údaji
- ✅ Nesprávné heslo zobrazuje chybovou zprávu
- ✅ Neexistující e-mail zobrazuje chybovou zprávu
- ✅ Neověřený přístup k /admin přesměruje na /login
- ✅ Neověřený přístup k /admin/products přesměruje
- ✅ Neověřený přístup k /admin/orders přesměruje
- ✅ Role USER (1) je zablokována z /admin
- ✅ ESHOP_ADMIN může přistupovat k /admin
- ✅ Přihlašovací relace je zachována při navigaci

### Organizace / Strany (02-parties)
- ✅ Seznam stran se načte a zobrazí zadaná organizace
- ✅ Vytvoření nové strany se všemi poli
- ✅ Vytvoření nové strany pouze s povinnými poli
- ✅ Duplikovaný slug zobrazuje chybu formuláře
- ✅ Prázdné jméno spouští validaci prohlížeče
- ✅ Stránka detailu strany se načte se všemi poli
- ✅ Pozvánka členovi do strany
- ✅ Duplikovaná pozvánka zobrazuje chybu
- ✅ Odstranění člena s potvrzením
- ✅ Viditelný je aktivní odznak
- ✅ Počet stran se aktualizuje v liště nástrojů
- ✅ Smazání druhé strany

### Kategorie (03-categories)
- ✅ Načítá se seznam kategorií
- ✅ Vytvoření kořenové kategorie
- ✅ Vytvoření dceřiné kategorie (výběr rodiče)
- ✅ Vytvoření kategorie s ikonou a sort_order
- ✅ Strom kategorií zobrazuje hierarchii
- ✅ Úprava názvu kategorie
- ✅ Přepínání viditelnosti
- ✅ Duplikovaný slug zobrazuje chybu formuláře
- ✅ Smazání listové kategorie
- ✅ Smazání kořenové kategorie

### Produkty (04-products)
- ✅ Načítá se seznam produktů
- ✅ Vyhledávání podle názvu
- ✅ Filtrování podle stavu (aktivní / návrh)
- ✅ Vytvoření produktu v návrhu
- ✅ Vytvoření aktivního produktu s vyznačením
- ✅ Detail produktu předvyplňuje hodnoty
- ✅ Úprava názvu a ceny produktu
- ✅ Změna stavu z návrh→aktivní
- ✅ Změna stavu z aktivní→neaktivní
- ✅ Duplikovaný slug zobrazuje chybu formuláře
- ✅ Funguje stránka detailu produktu s danými
- ✅ Formátování cen v seznamu
- ✅ (+ 4 další)

### Objednávky (05-orders) - 12 testů
- ✅ Celý životní cyklus stavu (předběžný→potvrzený→zpracování→odeslaný→doručený)
- ✅ Filtrování záložkami stavu
- ✅ Stránka detailu objednávky
- ✅ Odkaz na zákazníka z objednávky
- ✅ Uložení čísla sledování

### Zákazníci (06-customers) - 8 testů
- ✅ Seznam, vyhledávání, detail, úprava
- ✅ Historie objednávek na stránce zákazníka
- ✅ Přepínání stavu aktivní

### Ceny (07-pricing) - 12 testů
- ✅ Pravidlo slevy viditelné s odznakem
- ✅ Navigace záložkami kupónů
- ✅ Kupón SEED10 zobrazuje aktivní + 0 použití
- ✅ Vytvoření kupónu PROMO20
- ✅ Chyba duplicitního kódu kupónu

### Skladové zásoby (08-inventory) - 10 testů
- ✅ Zadaný položka zobrazuje množství=50
- ✅ Úpravy zásob (nákup +20, poškození -5, vrácení +3)
- ✅ Scénář nízkých zásob (poškození -60 → množství=8 < prah=10)
- ✅ Zobrazí se odznak nízkého zásobování
- ✅ Filtr nízkých zásob zobrazuje položku

### Uživatelé a role (09-users-roles) - 14 testů
- ✅ Seznam uživatelů se všemi testovacími účty
- ✅ Odznak vlastníka (červený)
- ✅ Indikátor "Vy" na vlastní řádku
- ✅ Formulář změny role u jiných uživatelů
- ✅ Změna role uživatele, zvrácení po testu
- ✅ Viditelná systémová role Super Administrátora
- ✅ Systémová role nemá tlačítko pro smazání
- ✅ Vytvoření vlastní role s oprávněními
- ✅ Zobrazené odznaky oprávnění
- ✅ Smazání vlastní role

### Protokol auditu a oznámení (10-audit) - 10 testů
- ✅ Načítá se stránka protokolu auditu
- ✅ Filtrování pomocí rozbalovací nabídky tabulky
- ✅ Viditelný celkový počet
- ✅ Načítá se stránka oznámení
- ✅ Viditelné zadané oznámení
- ✅ Odznak nepřečtené

### Nástěnka (11-dashboard) - 8 testů
- ✅ Viditelné 6 karet KPI s hodnotami
- ✅ Navigace v bočním panelu
- ✅ Navigace na produkty z bočního panelu
- ✅ Navigace na objednávky z bočního panelu

### Kontrola přístupu (12-access-control) - 9 testů
- ✅ Neověřený uživatel nemůže přistupovat k /admin, /admin/users, /admin/inventory
- ✅ Role USER (1) je zablokována z /admin
- ✅ ESHOP_ADMIN může přistupovat k /admin, /admin/products, /admin/orders
- ✅ Boční panel zobrazuje správné odkazy pro roli

### Nové funkce (13-new-features) - 17 testů
- ✅ Zobrazeny zaškrtávací políčka kategorií na stránce úpravy produktu
- ✅ Přiřazení kategorie k produktu, ověření trvalosti po obnovení
- ✅ Odstranění kategorie, ověření vymazání po obnovení
- ✅ Viditelný je formulář pro nahrávání obrázků
- ✅ Nahrání obrázku produktu (skutečné nahrávání souboru)
- ✅ Nahraný obrázek se objeví v galerii
- ✅ První obrázek má tlačítko Nastavit jako primární (neje primární výchozí)
- ✅ Nastavit obrázek jako primární → objeví se odznak, tlačítko Nastavit jako primární zmizí
- ✅ Smazání obrázku → počet v galerii klesá
- ✅ Po smazání posledního obrázku → mřížka je skryta, formulář pro nahrávání je stále přítomen
- ✅ OWNER (role=8) vidí všechny uživatele v administraci
- ✅ ESHOP_ADMIN nevidí OWNER v seznamu uživatelů
- ✅ ESHOP_ADMIN vidí svůj vlastní účet
- ✅ ESHOP_ADMIN nevidí USER mimo svou organizaci

## Neotestováno (budoucnost)

- Zrušení objednávky
- Ceny pro skupinu zákazníků
- Toky mobilní aplikace
- Omezení rychlosti API
- Paginační stránkování velkých datových sad
