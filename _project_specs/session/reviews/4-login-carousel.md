# Bod 4 - Login page carousel

Branch: `feat/login-carousel` (base `master`)
Worktree: `.claude/worktrees/login-carousel`

## Analýza

Login stránka je `website/src/pages/login.astro` (jeden Astro soubor, SSR,
žádný framework island - vanilla `<script>` bloky pro Supabase auth logiku).
Layout je split-screen: `.auth-shell` je CSS grid `1fr 1fr`, levá polovina
`.auth-illustration` (tmavé pozadí + `<canvas id="auth-scene">`), pravá
polovina `.auth-panel` s přihlašovacím/registračním formulářem.

Animace v `.auth-illustration` je `mountAccentScene()` z
`website/src/components/landing/three/aiScene.ts` - plná three.js scéna
(WebGL grid města s "AI" akcentem), vykreslovaná do canvasu. Ověřeno
grepem, že `mountAccentScene`/`aiScene.ts` se mimo `login.astro` nikde
jinde nepoužívá, takže je bezpečné ji na loginu nahradit beze změny jiných
stránek (soubor `aiScene.ts` zůstává na disku - `fulfillmentScene.ts` a
sdílené actors v tom samém adresáři jsou pořád používané jinde, takže
mazat celý `three/` adresář nedává smysl a nebyl by to "drobný zásah").

Na mobilu (`max-width: 760px`) se `.auth-illustration` úplně skryje
(`display: none`) - tj. carousel poběží jen na desktopu, což přesně
odpovídá zadání "beze změny mobilního view".

Formulář (`#signin-form`, `#signup-form`, `#si-email`, `#si-password`,
`#signin-btn`, ...) a auth JS logika (magic link / heslo / Google OAuth)
zůstávají netknuté - Playwright test `01-auth.spec.ts` cílí přesně na tato
ID.

**Zdroj obrázků:** V repu už existuje `website/public/img/` s hotovými
e-shop tematickými fotkami (stejný styl jako zbytek webu, používané jako
hero obrázky na `/templates`, `/about`, `/contact`, atd. - tedy už
schválené/licencované pro použití na tomto webu). Vybráno 5 relevantních:

- `hero-eshop.jpg` (1600x1068) - hero e-shop scéna, použita i na homepage Hero
- `product-shoes.jpg` (1200x800) - produktová fotka
- `product-watch.jpg` (800x581) - produktová fotka
- `product-headphones.jpg` (1200x800) - produktová fotka
- `template-store.jpg` (1200x800) - e-shop template náhled

Žádné nové assety nebylo nutné stahovat/generovat, což je v duchu "nedělej
mnoho změn" a nulového rizika ohledně licencí (soubory jsou už v repu a
používané jinde na produkčních stránkách).

## Implementační plán

1. Nová vanilla JS/CSS carousel komponenta přímo v `login.astro` (žádný
   framework island, žádná nová závislost - shoduje se s tím, jak je
   zbytek stránky psaný jako plain Astro + `<script>`).
2. `.auth-illustration` dostane `<div class="auth-carousel">` s 5×
   `<img class="auth-carousel-slide">` (absolutně pozicované přes sebe,
   `opacity` fade přechod) místo `<canvas id="auth-scene">`.
3. Malý vanilla JS blok (nahradí `mountAccentScene` import): `setInterval`
   co 4.5 s přepne aktivní slide (`classList` toggle `.is-active`), CSS
   `transition: opacity` udělá fade. Respektuje
   `prefers-reduced-motion: reduce` (zastaví auto-advance, pouze první
   snímek).
4. Overlay gradient přes obrázky (tmavý spodní gradient) kvůli čitelnosti
   loga/textu nad fotkami - zachovává tmavý branding vzhled současné
   `.auth-illustration` (dřív tmavé pozadí + 3D scéna, teď fotky + overlay).
5. Drobný trust-signal titulek pod logem (`t.auth.illustrationTagline` -
   nový i18n klíč, cs+en) - typický prvek e-shop loginu ("Spravujte svůj
   e-shop odkudkoli" / obdoba). Jen jedna nová i18n dvojice klíčů, aby
   změna zůstala malá.
6. Desktop "zvětšení kontextu": `.auth-shell` `max-width` z 920px na
   ~1080px a `.auth-panel`/`.auth-illustration` padding mírně navýšen na
   desktopu (`@media (min-width: 1024px)`) - beze změny mobile bloku
   (`max-width: 760px`), který zůstává 1:1.
7. Odstranit import `mountAccentScene` a `<canvas id="auth-scene">` -
   `aiScene.ts` soubor zůstává (used nowhere else already documented, ale
   mazání souboru je mimo rozsah tohoto úkolu).

## Coding plán

1. Upravit `shared/i18n/locales/en.ts` a `cs.ts` - přidat
   `auth.illustrationTagline`.
2. Upravit `website/src/pages/login.astro`:
   - nahradit `<canvas id="auth-scene">` blokem carouselu (5 `<img>` tagů,
     `/img/...jpg`, `alt=""` protože jde o čistě dekorativní pozadí vedle
     textového brandingu - a1y: `aria-hidden="true"` na wrapperu).
   - přidat tagline pod `.auth-brand`.
   - nahradit three.js `<script>` blok vanilla JS auto-advance carouselem.
   - upravit `<style>`: nový `.auth-carousel`/`.auth-carousel-slide`/
     `.auth-carousel-overlay` blok, upravit `.auth-shell` max-width a
     desktop padding v novém `@media (min-width: 1024px)` bloku, zachovat
     stávající mobile breakpoint beze změny.
3. `pnpm typecheck` ve `website/`.
4. Vizuální ověření (dev server) na desktop i mobile šířce.
5. Spustit `01-auth.spec.ts` Playwright test (pokud lze lokálně - vyžaduje
   běžící Supabase + seed data; pokud prostředí není dostupné, zapsat to
   jasně jako neověřeno).

## Implementace

Provedeno přesně dle plánu výše:

- `shared/i18n/locales/en.ts` + `cs.ts` - přidán klíč `auth.illustrationTagline`.
- `website/src/pages/login.astro`:
  - `<canvas id="auth-scene">` + three.js `mountAccentScene` import nahrazeny
    `<div id="auth-carousel">` s 5× `<img>` (`hero-eshop.jpg`,
    `template-store.jpg`, `product-shoes.jpg`, `product-headphones.jpg`,
    `product-watch.jpg`) + tmavý gradient overlay div.
  - Vanilla JS `<script>` blok: `setInterval` 4.5 s, `classList` toggle
    `.is-active` mezi slidy, `transition: opacity 1.1s` na fade přechod.
    Respektuje `prefers-reduced-motion: reduce` (auto-advance se nespustí).
  - Přidán `<p class="auth-tagline">` pod brand logem.
  - `.auth-shell` `max-width` 920px → 1080px a zvětšený padding panelů,
    ale pouze uvnitř nového `@media (min-width: 1024px)` bloku - beze
    změny existujícího `@media (max-width: 760px)` mobilního bloku.
  - Drobná oprava mimo hlavní rozsah: em dash v `<title>` nahrazen
    obyčejnou pomlčkou (dodržení globálního pravidla, soubor už byl
    otevřený k editaci).
- `aiScene.ts` a zbytek `three/` adresáře záměrně ponechán beze změny -
  `fulfillmentScene.ts` a sdílené actors v tom samém adresáři se dál
  používají jinde (homepage). Mazání nepoužívaného `aiScene.ts` by bylo
  nad rámec "drobného zásahu" a šlo mimo zadání.

## Testy

- `pnpm typecheck` (website/) - **prošlo bez chyb** (`tsc --noEmit`).
- Vizuální ověření přes `claude-in-chrome` browser tooling (dev server
  `pnpm dev` na `localhost:4321`, lokální Supabase již běžící):
  - Desktop (1512 px šířka reálného viewportu): carousel se vykresluje,
    obrázky (obchod/produkty) se automaticky střídají po ~4.5 s s fade
    přechodem, overlay gradient zajišťuje čitelnost loga/tagline, layout
    nepřetéká, split-screen vypadá jako standardní e-shop login.
  - Přepnutí sign-in ↔ sign-up (`#to-signup`/`#to-signin`) funguje beze
    změny - formulářová pole i ID zůstala netknutá.
  - Console bez chyb (`read_console_messages`, žádné JS erory).
  - **Mobilní šířka (~390-430 px) se NEPODAŘILO fyzicky ověřit screenshotem** -
    `resize_window` nástroj v tomto sandboxu neměnil skutečný viewport
    prohlížeče (window.innerWidth zůstal ~2365 px bez ohledu na
    požadovanou velikost - zřejmě omezení headless/kiosk okna v tomto
    prostředí). Mobilní chování je nicméně nízkorizikové: existující
    pravidlo `@media (max-width: 760px) { .auth-illustration { display:
    none } }` je v diffu **beze změny** - nová carousel struktura je celá
    uvnitř `.auth-illustration`, takže na mobilu zmizí přesně stejně jako
    dřív canvas se scénou. **Doporučuji Janovi rychlé ruční ověření**
    v reálném prohlížeči zúžením okna pod 760px na `/login`.
- Playwright `tests/e2e/01-auth.spec.ts` (celá sada, 9 testů) - **9/9 passed**,
  žádná regrese (test cílí na `#si-email`, `#si-password`, `#signin-btn`
  atd., která zůstala netknutá).

## Jak ručně otestovat

1. `cd website && pnpm dev`
2. Otevřít `http://localhost:4321/login`
3. Desktop: sledovat cca 15-20 s, carousel by měl automaticky střídat 5
   obrázků s jemným prolnutím; ověřit, že text/formulář vpravo je čitelný
   a nic nepřetéká za okraj karty.
4. Zúžit okno prohlížeče pod 760px (nebo DevTools responsive mode) -
   ilustrace/carousel by měla úplně zmizet, zůstane jen formulář (stejné
   chování jako před změnou).
5. Vyzkoušet přepnutí "Vytvořit účet" / "Přihlásit se" - formulář se má
   přepnout beze změny funkčnosti.
6. Reálné přihlášení (např. admin účtem ze seed dat) - mělo by proběhnout
   identicky jako dřív, žádná auth logika se neměnila.

## Rizika

- **Přístupnost carouselu**: obrázky jsou čistě dekorativní (`alt=""`,
  wrapper `aria-hidden="true"`), takže screen readery je ignorují - to je
  žádoucí, protože nenesou informační obsah odlišný od textu vedle nich.
  `prefers-reduced-motion` je respektováno (carousel se zastaví na první
  snímek).
- **Výkon**: 5 JPG obrázků (celkem ~660 KB) se načítá při vstupu na login
  - první slide `loading="eager"`, zbylé 4 `loading="lazy"`. To je o dost
    lehčí než dřívější three.js WebGL scéna (runtime JS engine + geometrie),
    takže jde spíš o zlepšení než zhoršení výkonu/TTI.
- **Mobilní view nebylo možné fyzicky odscreenshotovat** v tomto
  prostředí (viz sekce Testy) - doporučeno rychlé ruční ověření.
- Nový i18n klíč `auth.illustrationTagline` je jen v `en`/`cs` - žádné
  další jazyky v projektu nejsou, takže je to kompletní.
