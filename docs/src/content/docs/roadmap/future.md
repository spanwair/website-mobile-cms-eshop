---
title: Mapa cest
description: Co je plánováno pro budoucí verze.
---

## Blízká budoucnost (následující sprint)

### Aktivace integrací (připraveno k propojení, vyžadují se údaje)
- [ ] Propojení pokladny Stripe (`/api/checkout` + `/api/stripe/webhook` koncové body)
- [ ] Propojení odesílání e-mailů Resend při změnách stavu objednávky (potvrzení, doprava, žádost o recenzi)
- [ ] Cron úloha pro opuštěný košík (Edge Function, spouští se 1 hodinu po nastavení `abandoned_at`)
- [ ] Portál pro sebeobsluhu zákazníka (`/account`, `/account/orders`, `/account/wishlist`)

### Dokončení funkcí
- [ ] Tlačítko pro zrušení objednávky v administrátorském rozhraní
- [ ] Rozhraní pro vytváření položek skladových zásob (aktuálně vyžaduje SQL nebo API)
- [ ] Generování Sitemap.xml pro SEO

## Střednědobá budoucnost

### Platby
- [ ] Integrace Stripe pro platebami kartou
- [ ] Integrace GoPay (český trh)
- [ ] Automatické aktualizace stavu objednávky při webhooku platby

### Mobilní aplikace
- [ ] Propojení mobilních obrazovek s reálnými daty Supabase
- [ ] Procházení produktů s filtrem kategorie
- [ ] Proces košíku a pokladny
- [ ] Historie objednávek v mobilní aplikaci
- [ ] Push oznámení pro aktualizace objednávek

### Vylepšení produktů
- [ ] Varianty produktů (kombinace velikosti/barvy/materiálu)
- [ ] Hromadný import produktů z CSV
- [ ] Duplikace produktů (klonování produktu)
- [ ] Související produkty

### Funkce pro zákazníky
- [ ] Registrace zákazníka přes mobilní aplikaci
- [ ] Přihlášení zákazníka propojené s účtem uživatele
- [ ] Body loajality / odměny

## Dlouhodobá budoucnost

### Analytika
- [ ] Prodejní zprávy s grafy
- [ ] Tržby podle kategorie
- [ ] Životní hodnota zákazníka
- [ ] Otočnost skladových zásob

### Multi-tenancy na škále
- [ ] Samobouzdělá tvorba organizace
- [ ] Fakturace na organizaci (úrovně předplatného)
- [ ] Možnost white-labelu (vlastní doména pro organizaci)

### Integrace
- [ ] Dopravní poskytovatelé (DHL, PPL, Zásilkovna)
- [ ] Export do účetního softwaru (POHODA, FAKTUROID)
- [ ] Google Shopping feed
- [ ] Integrace katalogu Facebook

### Mobilní
- [ ] Nasazení do App Store pro iOS
- [ ] Nasazení do Play Store pro Android
- [ ] Čarodírový skener pro skladové zásoby
- [ ] Offline režim pro počty zásob

## Jak přispět

Složka `_project_specs/todos/` sleduje aktivní práci:
- `active.md` - úkoly aktuálního sprintu
- `backlog.md` - schválené, ale nezačnuté
- `completed.md` - dokončená práce

Při implementaci funkce aktualizujte stránku s pokrokem v této dokumentaci, abyste відобраzili, co se změnilo.
