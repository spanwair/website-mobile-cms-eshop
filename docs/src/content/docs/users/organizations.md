---
title: Organizace (Strany)
description: Jak fungují organizace a proč je vše pro ně definováno.
---

## Co je „Strana“?

V databázi jsou organizace nazývány **strany**. Každý kus dat - produkty, objednávky, zákazníci, kategorie - patří přesně jedné straně.

To znamená:
- **Administrátor Společnosti A** vidí pouze produkty Společnosti A
- **Administrátor Společnosti B** vidí pouze data Společnosti B
- Více společností může fungovat nezávisle na stejné platformě

## Co patří do organizace

| Typ dat | Připojeno k straně? |
|-----------|-----------------|
| Produkty | ✅ Ano |
| Kategorie | ✅ Ano |
| Objednávky | ✅ Ano |
| Zákazníci | ✅ Ano |
| Skladové zásoby | ✅ Ano |
| Pravidla pro slevy a kupóny | ✅ Ano |
| Sklady | ✅ Ano |
| Role (vlastní) | ✅ Ano |
| Uživatelské účty (profily) | ❌ Ne - uživatelé patří do Supabase Auth |
| Příslušnost k straně | ✅ Pomocí tabulky `user_party_roles` |

## Pole strany

Když vytvoříte organizaci, vyplníte:

| Pole | Požadované | Popis |
|-------|----------|-------------|
| Název | ✅ | Zobrazovaný název (např. „Můj obchod s.r.o.“) |
| Slug | ✅ | Identifikátor bezpečný pro URL (automaticky navrhovaný z názvu) |
| Název společnosti | | Právní název |
| IČ DPH | | Pro fakturaci |
| E-mail pro fakturaci | | Kam jsou faktury zasílány |
| URL loga | | Logo značky |

## Připojení k organizaci

Uživatel bez organizace nemůže nic spravovat - vidí stránku nastavení, která ho vyzve k kontaktu s Vlastníkem. Vlastník nebo Administrátor přidá uživatele do organizace přes **Administrátor → Strany → [Organizace] → Pozvat člena**.

Když někoho pozvete:
1. Vyberte jeho účet z rozbalovací nabídky
2. Vyberte, jakou vlastní roli dostane v rámci strany
3. Klikněte na **Pozvat**

Okamžitě jsou přidáni a mohou se přihlásit do administrace.

## Odstraňování členů

Na stránce podrobností strany má každý řádek člena tlačítko **Odstranit** (s potvrzením). Odstranění uživatele ze strany znamená, že ztratí přístup k datům této strany, ale jeho účet zůstane.

## Role „Super Administrátor“

Každá strana automaticky získá systémovou **role Super Administrátor** (vytvořenou spouštěčem databáze při vytvoření strany). Tato role má všechna oprávnění (bitmaska `32767`) a nemůže být smazána.

První administrátor strany je této roli automaticky přidělen.
