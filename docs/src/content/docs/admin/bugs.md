---
title: Nahlášené chyby
description: Schránka pro hlášení chyb vlastníka platformy, zaslaná z plovoucího widgetu na každé administrátorské stránce, včetně volitelného snímku obrazovky a nahrávky obrazovky
---

Každá stránka `/admin/*` zobrazuje v levém dolním rohu plovoucí tlačítko pro nahlášení chyby.
Jakýkoli uživatel s administrátorským přístupem (eshop administrátor, administrátor nebo vlastník) jej může otevřít, popsat, co se stalo, a volitelně přiložit snímek obrazovky a/nebo krátkou nahrávku obrazovky - vše zachycené pouze pomocí API prohlížeče (`getDisplayMedia` / `MediaRecorder`), bez jakéhokoli lokálního nástroje nebo desktopového softwaru.
Odeslaná hlášení může číst pouze vlastník platformy.

## Požadované oprávnění

Nahlášení chyby nevyžaduje žádný bit oprávnění - widget je vložen do `CmsLayout` a zobrazuje se pro každou administrátorskou roli, stejně jako vždy viditelná položka Oznámení.

**Čtení** hlášení je jiné: `/admin/bugs` a jeho položka v bočním panelu jsou **dostupné pouze pro vlastníka**, ohraničené přímo pomocí `ctx.isOwner` (stejný předpoklad jako u [Dopravy](/docs/admin/settings-shipping)), nikoli bitem oprávnění `MANAGE_*` - nahlášené chyby a jejich snímky/videa mohou obsahovat citlivá data z jakékoli organizace, takže žádné oprávnění na úrovni strany nemůže k nim udělit přístup. Jakýkoli uživatel, který není vlastník a přejde přímo na `/admin/bugs`, je přesměrován na `/admin`.

## Widget (na každé administrátorské stránce)

Kliknutím na tlačítko 🐛 otevřete malý panel ukotvený k tlačítku, bez pozadí - nesmí blokovat zbytek obrazovky, zatímco se uživatel stále dívá na to, co popisuje. Panel má tři nezávislé, **zcela volitelné** vstupy:

| Vstup | Jak je zachycen |
|---|---|
| Popis | Obyčejné textové pole. |
| Snímek obrazovky | `navigator.mediaDevices.getDisplayMedia({ video: true })` vyvolá nativní výběr obrazovky/okna/karty prohlížeče, jeden snímek je vykreslen do plátna (canvas) a stream zachycení je okamžitě zastaven. |
| Nahrávka obrazovky | Stejný výběr pomocí `getDisplayMedia`, ale stream je přiveden do `MediaRecorder`, dokud uživatel neklikne na Zastavit (nebo neukončí sdílení pomocí vlastního ovládacího prvku prohlížeče "Zastavit sdílení"). |

Žádné pole není povinné - tlačítko Nahlásit lze kliknout se všemi třemi poli prázdnými.
Odeslání pošle `FormData` na `POST /api/admin/bug-reports` s jakýmikoli vyplněnými poli, plus `pageUrl` (`location.href`) a `userAgent`, automaticky shromážděnými.

### Záludnost s odstraněním kodeku

`MediaRecorder.mimeType` hlásí typ kvalifikovaný kodekem, jako `video/webm;codecs=vp9`, který nikdy neodpovídá jednoduché položce `allowed_mime_types` úložného kontejneru (`video/webm`) a je odmítnut s chybou `InvalidMimeType`. `uploadBugReportMedia` (`shared/services/bugReportService.ts`) před nahráním odstraní vše za `;` - mějte to na paměti, pokud se někdy změní seznam povolených typů nebo výběr mime typu rekordéru.

## Seznam nahlášených chyb (`/admin/bugs`, pouze pro vlastníka)

Jednoduchá tabulka: časové razítko, e-mail nahlašujícího, název organizace (pokud měl nahlašující aktivní stranu), popis, stránka, na které se nacházel, odkazy na snímek obrazovky/video (pokud existují), a přepínač stavu otevřeno/vyřešeno.

Stav je jednoduché dvoustavové pole (`open` / `resolved`) aktualizované pomocí formuláře `POST` na stejné stránce, bez zapojení API route.

## Data a úložiště (cloud)

- **Tabulka:** `bug_reports` - `reporter_id`, `reporter_email` (denormalizováno, aby řádek dával smysl i po pozdějším smazání profilu), `party_id`, `page_url`, `description`, `screenshot_path`, `video_path`, `user_agent`, `status`, `created_at`.
- **Kontejner:** `bug-reports`, **soukromý** (`public = false`). Média se vždy překládají pouze na podepsanou URL s platností 1 hodiny (`getBugReportMediaUrl`), generovanou na straně serveru na `/admin/bugs`, nikdy ne na veřejný odkaz `getPublicUrl()`. Nepodepsaný přímý požadavek na objekt vrátí chybu 400.
- **RLS:** INSERT je povolen jakémukoli přihlášenému uživateli s `can_access_admin()` (role ≥ eshop administrátor), kde `reporter_id = auth.uid()`; SELECT/UPDATE jsou omezeny na `is_owner()`.
- **Záludnost RLS na zápisové cestě:** `createBugReport` záměrně **nepřipojuje** `.select()` za `.insert()`. Supabase `insert().select()` vyžaduje, aby řádek splňoval i SELECT politiku tabulky, aby ho bylo možné vrátit - jelikož SELECT je zde pouze pro vlastníka, připojení `.select()` způsobilo, že vložení u každého nahlašujícího, který není vlastník, selhalo s chybou "new row violates row-level security policy", přestože samotná INSERT politika byla splněna. Pouze vložení bez návratové hodnoty se této implicitní kontrole čtení zpět zcela vyhýbá.
- **Služby:** `createBugReport`, `fetchBugReports`, `updateBugReportStatus`, `getBugReportMediaUrl` (`shared/services/bugReportService.ts`).
- **Komponenty:** `BugReportWidget.astro` (vložen nepodmíněně v `CmsLayout.astro`) + `website/src/lib/bugReportWidget.ts` pro logiku zachycení a odeslání.

## Související stránky

- [Doprava](/docs/admin/settings-shipping) - další administrátorská plocha na úrovni celé platformy, dostupná pouze pro vlastníka, ohraničená přímo pomocí `ctx.isOwner` namísto bitu oprávnění
- [Oznámení](/docs/admin/notifications) - další položka bočního panelu vždy viditelná pro každou roli (`perm: 0`)
