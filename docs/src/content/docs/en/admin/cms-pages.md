---
title: Content Pages
description: Create and edit storefront content pages such as About, Contact, FAQ, and made-to-order landing pages
---

Content Pages are the standalone informational pages of your storefront - About, Contact, delivery info, made-to-order details, and every legal document.
Each page renders on the live site at `/stranka/{slug}` and can be linked from your header via [Navigation](/docs/en/admin/cms-navigation) or from the footer.
This is the second tab of the Content section, alongside [Navigation](/docs/en/admin/cms-navigation), [Blog](/docs/en/admin/cms-blog), [Team](/docs/en/admin/cms-team), [FAQ](/docs/en/admin/cms-faq), and [Legal Documents](/docs/en/admin/cms-legal).

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 2048 | MANAGE_CMS | Owner, Admin, Eshop Admin (with this bit) |

Without the MANAGE_CMS bit you are redirected to `/admin`.
With no organization selected you are redirected to `/admin/parties/new` (owner) or `/admin/setup` (eshop admin).
Customers (role USER) are redirected to `/dashboard`.

## Page list (`/admin/cms/pages`)

The toolbar shows a count ("N content pages") and a **+ New page** button.
The table lists every page for the active organization, ordered by **Sort order** ascending.

| Column | Source | Notes |
|---|---|---|
| Title | `title` | Bold. |
| Slug | `slug` | Shown as the live path `/stranka/{slug}`. |
| Template | `template` | One of `default`, `about`, `contact`, `faq`. |
| Visible | `is_visible` | Shows "Visible" or "Hidden". |
| Actions | - | **Edit** and **Delete**. |

**Delete** here asks for confirmation and removes the page immediately.
When there are no pages the table shows "No content pages yet."

For Kytka z Beskyd this list holds pages such as `o-me`, `kontakt`, `vyroba-na-zakazku`, `velikosti-vencu`, `nas-tym`, `faq`, plus the legal set (`obchodni-podminky`, `ochrana-osobnich-udaju`, and so on).

## Creating a page (`/admin/cms/pages/new`)

### How to

1. Click **+ New page** in the toolbar.
2. Enter a **Title** (required). The slug auto-fills from the title until you edit it manually.
3. Adjust the **Slug** if needed (lowercase letters, numbers and hyphens only).
4. Choose a **Template**.
5. Write the **Body** and pick the matching **Body format** (Markdown or HTML).
6. Optionally fill **SEO title** and **SEO description**.
7. Optionally set **Show in footer column (key)** and a **Sort order**.
8. Leave **Visible** checked to publish immediately, or uncheck to keep it as a draft.
9. Click **Create page**. You are taken straight to the edit screen for the new page.

The **Cancel** button and the **← Back** link both return to the page list.

### Field reference

| Field | Column in `content_pages` | Required | Description |
|---|---|---|---|
| Title | `title` | Yes | Page heading, shown as the `<h1>` on the live page and used as the `<title>` fallback. |
| Slug | `slug` | Yes | URL segment; the page lives at `/stranka/{slug}`. Auto-derived from the title, editable, validated to `[a-z0-9]` with single hyphens. Must be unique within your organization. |
| Template | `template` | No | Layout variant - see the template table below. Defaults to `default`. |
| Body | `body` | No | The main content. Supports Markdown or raw HTML depending on the format. |
| Body format | `body_format` | No | `markdown` (default) or `html`. Markdown is parsed to HTML, then both paths are sanitized. |
| SEO title | `seo_title` | No | Overrides the browser/tab title and search snippet title. Falls back to Title. |
| SEO description | `seo_description` | No | Meta description for search engines. |
| Show in footer column (key) | `show_in_footer_column` | No | A footer column key (e.g. `information`). Assigns this page to a footer column so it appears in the storefront footer. Kytka's legal pages use `information`. |
| Sort order | `sort_order` | No | Integer, lower first. Controls order in the list and within a footer column. Default 0. |
| Visible | `is_visible` | No | Checked by default. The storefront only serves pages where this is true; hidden pages return 404 to visitors but stay editable here. |

### Templates

The template changes what the storefront renders in addition to the body.

| Template | Value | Extra rendering on `/stranka/{slug}` |
|---|---|---|
| Default | `default` | Just the title and body. Used for most pages, including all legal documents. |
| About (renders team grid) | `about` | Appends the active [team members](/docs/en/admin/cms-team) as a photo grid below the body. |
| Contact (renders store contact info) | `contact` | Appends the store's phone, email, and business hours from store settings. |
| FAQ (renders FAQ accordion) | `faq` | Appends your [FAQ items](/docs/en/admin/cms-faq) as an accordion below the body. |

This is important: [Team](/docs/en/admin/cms-team) members and [FAQ](/docs/en/admin/cms-faq) items are never shown on their own URL.
They only appear when a content page using the `about` (team) or `faq` (FAQ) template exists and is visible.
So to publish your team, create an About page with the `about` template; to publish your FAQ, create a page with the `faq` template.

### Body content, Markdown, and media

The body is a plain textarea (10 rows), not a WYSIWYG editor.

- With **Markdown** format you can use headings, bold, italics, lists, links, blockquotes, and images. Kytka's legal pages are written in Markdown (for example `## Obchodní podmínky` with `###` subsections).
- With **HTML** format you write raw HTML. A fixed allowlist of tags survives sanitization (`h1`-`h6`, `p`, `br`, `hr`, `strong`, `em`, `b`, `i`, `u`, `a`, `ul`, `ol`, `li`, `blockquote`, `img`, `video`, `source`, `div`, `span`, `figure`, `figcaption`). Links may carry the site button classes `btn`, `btn-primary`, `btn-secondary`, `btn-ghost`; any other class or tag (including `<script>`, `<iframe>`, `on*` handlers, and inline styles) is stripped.
- To embed an image or video from your Media Library, paste a media token `{{media:slug}}` into the body. It expands to the correct `<img>`/`<video>` before rendering. An unknown slug silently expands to nothing. Manage those media assets and copy their slugs from the Media Library in Store settings.

## Editing a page (`/admin/cms/pages/{id}`)

The edit form is identical to the create form but pre-filled.
Save with **Save changes**; you stay on the edit page after saving.
A separate **Delete page** button at the bottom asks "Are you sure? This cannot be undone." before deleting.
If the page id does not exist you are redirected back to the list.

Changing a live page's **Slug** breaks any existing links or bookmarks to the old `/stranka/{slug}` path, and breaks header links that pointed at it - update those in [Navigation](/docs/en/admin/cms-navigation).

## Data & storage (cloud)

- Table: `content_pages` (columns `party_id`, `slug`, `title`, `template`, `body`, `body_format`, `seo_title`, `seo_description`, `show_in_footer_column`, `is_visible`, `sort_order`).
- Slugs are normalized with the shared `resolveSlug` helper on save.
- Storefront reads visible pages by slug via `fetchContentPageBySlug`; the `about`/`faq`/`contact` templates additionally read `team_members`, `faq_items`, and store contact settings.
- Media tokens resolve against the `store_media` table (Storage bucket `store-media`).

## Related pages

- [Navigation](/docs/en/admin/cms-navigation) - link pages into the header menu (they appear as `/stranka/{slug}` URL suggestions)
- [Team](/docs/en/admin/cms-team) - only shown via an `about`-template page
- [FAQ](/docs/en/admin/cms-faq) - only shown via a `faq`-template page
- [Legal Documents](/docs/en/admin/cms-legal) - a checklist that creates/edits the standard legal pages through this same editor
- [Blog](/docs/en/admin/cms-blog) - for dated articles rather than evergreen pages
