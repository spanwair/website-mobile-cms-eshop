---
title: Blog
description: Pište, plánujte a publikujte blogové příspěvky s obsahem v markdownu nebo HTML, vybranými obrázky a SEO poli.
---

Blog spravuje články, které se zobrazují na `/blog/{slug}` v vašem obchodě a v sekci domovské stránky `blog_preview`, pokud je tato sekce povolena v [Rozložení domovské stránky](/docs/admin/settings-layout).
Nachází se pod kartou **Blog** v CMS (sdílenou s [Navigací](/docs/admin/cms-navigation), [Stránkami](/docs/admin/cms-pages), [Týmem](/docs/admin/cms-team), [FAQ](/docs/admin/cms-faq) a [Právními stránkami](/docs/admin/cms-legal)).

## Požadováno oprávnění

| Bit oprávnění | Název | Kdo ho má výchozí |
|---|---|---|
| 2048 | MANAGE_CMS | Vlastník, Administrátor, Eshop Administrátor (s tímto bitem) |

Bez `MANAGE_CMS` vás systém přesměruje na `/admin`.
Eshop administrátor bez organizace je poslán na `/admin/setup` (vlastník: `/admin/parties/new`).

## Seznam příspěvků (`/admin/cms/blog`)

Tabulka všech příspěvků pro organizaci, s počtem a tlačítkem **Nový příspěvek**.

| Sloupec | Popis |
|---|---|
| Název | Název příspěvku, vtučně. |
| Slug | Zobrazuje se jako jeho živý cesty `/blog/{slug}`. |
| Stav | Odznak: zelené „Publikováno“ nebo šedé „Návrh“. |
| Akce | **Upravit** a **Smazat** (s dialogem `confirm()`). |

Prázdný seznam zobrazuje centrovany řádek „žádné příspěvky“.

## Vytváření příspěvku (`/admin/cms/blog/new`)

### Odkaz na pole

| Pole | Sloupec | Poznámky |
|---|---|---|
| Title | `blog_posts.title` | Požadováno. |
| Slug | `blog_posts.slug` | Automaticky navrhováno z názvu pomocí komponenty `SlugInput`; vyřešeno pomocí `resolveSlug`. |
| Excerpt | `blog_posts.excerpt` | Krátký úvodní text (textové pole 2 řádky), používá se v náhledech. |
| Content | `blog_posts.content` | Tělo článku (textové pole 10 řádků). |
| Content format | `blog_posts.content_format` | `markdown` (výchozí) nebo `html` - jak se tělo vykreslí v obchodě. |
| Status | `blog_posts.status` | `draft` nebo `published`. |
| Featured image | `blog_posts.featured_image_url` | Vybráno pomocí `ImagePicker` z médiální knihovny obchodu [mediální knihovna](/docs/admin/settings-content). |
| Author | `blog_posts.author_name` | Volný text, např. „Natálie Ruszová“. |
| SEO title | `blog_posts.seo_title` | Přepíše `<title>` pro vyhledávače. |
| SEO description | `blog_posts.seo_description` | Meta popis. |

Když nastavíte stav na **publikováno**, `published_at` je zalepito aktuálním časem; přepnutí zpět na návrh ho vymaže.
Po uložení se dostanete na stránku úpravy příspěvku.

Kytka z Beskyd posílá dva příspěvky jako příklad: "Jak vybrat velikost věnce na dveře" a "Péče o sušené květiny".

## Upravování příspěvku (`/admin/cms/blog/{id}`)

Stejný formulář, předvyplněný.
Oddělené červené tlačítko **Smazat** (s dialogem `confirm()`) odstraní příspěvek.

## Data a úložiště (cloud)

- **Tabulka:** `blog_posts` (`party_id`, `title`, `slug`, `excerpt`, `content`, `content_format`, `featured_image_url`, `author_name`, `status`, `published_at`, `seo_title`, `seo_description`).
- **Služby:** `fetchBlogPosts`, `fetchBlogPost`, `createBlogPost`, `updateBlogPost`, `deleteBlogPost` (`blogService`); `fetchStoreMedia` (`storeMediaService`) pro výběr obrázku.
- **Komponenty:** `SlugInput`, `ImagePicker`, `CmsTabs`.
- Omezeno na `ctx.partyId`.

## Související stránky

- [Rozložení domovské stránky](/docs/admin/settings-layout) - povolte sekci `blog_preview` k zobrazení příspěvků na domovské stránce
- [Obsah domovské stránky](/docs/admin/settings-content) - mediální knihovna, ze které vybírá vybraný obrázek
- [Stránky](/docs/admin/cms-pages) - statické stránky s obsahem, nedátované souroznaky blogových příspěvků
