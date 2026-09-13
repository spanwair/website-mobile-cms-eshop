---
title: Legal Pages
description: Checklist of standard legal and info documents, tracking which exist and linking to create or edit each
---

The Legal Pages tab is a checklist of the standard e-commerce legal and info documents a store is expected to have.
It does not store the documents itself - each one is an ordinary content page edited through [Pages](/docs/en/admin/cms-pages).
This tab simply tracks which of the standard slugs already exist and gives you a one-click way to create the missing ones.
It sits under the **Legal** tab of the CMS, alongside [Navigation](/docs/en/admin/cms-navigation), [Pages](/docs/en/admin/cms-pages), [Blog](/docs/en/admin/cms-blog), [Team](/docs/en/admin/cms-team), and [FAQ](/docs/en/admin/cms-faq).

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 2048 | MANAGE_CMS | Owner, Admin, Eshop Admin (with this bit) |

Without `MANAGE_CMS` you are redirected to `/admin`.

## The checklist (`/admin/cms/legal`)

Each row is one standard document, showing its title, a status, and an action:

| Status | Action |
|---|---|
| Created | An **Edit page** link opens the existing content page at `/admin/cms/pages/{id}`. |
| Missing | A **Create page** button opens `/admin/cms/pages/new` pre-filled with the standard slug and title. |

### The standard document set

The built-in slugs (Czech titles, since the platform ships CS-first) are:

| Slug | Title |
|---|---|
| `obchodni-podminky` | Obchodní podmínky (terms and conditions) |
| `ochrana-osobnich-udaju` | Ochrana osobních údajů (privacy) |
| `cookies` | Zásady používání cookies |
| `vraceni-zbozi` | Vrácení zboží a odstoupení od smlouvy |
| `reklamace` | Reklamační řád (complaints) |
| `platba-a-doprava` | Platba a doprava (payment and delivery) |
| `cenik-sluzeb-a-oprav` | Ceník služeb a oprav |
| `zaruka-originality` | Záruka originality |
| `peclive-testovano` | Pečlivě testováno |
| `vyhodne-ceny` | Výhodné ceny |
| `zakaznicky-servis` | Zákaznický servis |
| `kariera` | Kariéra |
| `esim` | eSIM |
| `bonusovy-program` | Bonusový program |

### The commission sale-notice document

One extra row is the commissionaire sale notice (`SMALLJOBS_SALE_NOTICE_SLUG`).
It is generated automatically the moment a party switches to `smalljobs_commission` seller mode (see [Organizations](/docs/en/admin/parties)), and is listed here so admins can still inspect it.

## Data & storage (cloud)

- **Table:** `content_pages` (the documents themselves; the same table [Pages](/docs/en/admin/cms-pages) manages).
- **Services:** `fetchContentPages` (`contentPageService`); constants `SMALLJOBS_SALE_NOTICE_SLUG`, `SMALLJOBS_SALE_NOTICE_TITLE_CS` from `legalTemplates`.
- **Component:** `CmsTabs`.
- The tab holds no data of its own - it is a coverage view over existing content pages, scoped to `ctx.partyId`.

## Related pages

- [Pages](/docs/en/admin/cms-pages) - where the legal documents are actually authored and edited
- [Footer](/docs/en/admin/settings-footer) - where you link these documents into the storefront footer columns
- [Organizations](/docs/en/admin/parties) - switching to commission mode auto-creates the sale-notice document
