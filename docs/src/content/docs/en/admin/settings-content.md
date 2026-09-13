---
title: Store Settings - Content
description: Edit hero, subhero, buyback, and footer copy, manage hero slides, and upload media
---

The Content tab holds the editable text blocks of your homepage plus the hero slider and your media library.
It works with [Layout](/docs/en/admin/settings-layout) (which blocks are shown) and [Branding](/docs/en/admin/settings-branding) (how they are styled).
The media you upload here is the same library used by the image pickers on Branding, and by [Products](/docs/en/admin/products), [Categories](/docs/en/admin/categories), and the CMS blog.

The page lives at `/admin/settings/content`, reached from the **Settings** sidebar entry then the **Content** tab.

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 1024 | MANAGE_SETTINGS | Owner, Admin, Eshop Admin (with this bit) |

Guard chain: no session -> `/login`; no admin context -> `/dashboard`; no active party -> `/admin/parties/new` (owner) or `/admin/setup`; missing MANAGE_SETTINGS -> `/admin`.

The page uses a hidden `_action` field to route between four operations: `save_content`, `save_slide`, `delete_slide`, `upload_media`, and `delete_media`.

## Content sections

The main form edits four rich-text blocks, each with its own editor card.

| Section | Content column | Format column | Where it appears |
|---|---|---|---|
| Hero | `hero_content` | `hero_format` | Hero banner (when the hero slider is empty) |
| Subhero | `subhero_content` | `subhero_format` | Subhero banner |
| Buyback | `buyback_content` | `buyback_format` | Buyback / trade-in promo block |
| Footer | `footer_content` | `footer_format` | Footer rich-text area |

Each editor card offers:

- A **Format** toggle with two radio buttons: **Markdown** or **HTML**.
  The chosen format is stored in the matching `*_format` column and decides how the content is rendered.
- A monospace **Content** textarea (6 rows, resizable).
- A live **Preview** box rendering the current content, or a "nothing yet" message when empty.

You can embed uploaded media inside any block using a media token, `{{media:<slug>}}`, which is resolved to the media URL when rendered.
Copy the exact token from the media library table (see below).

Press **Save changes** to POST with `_action=save_content`; all four blocks are written together via `updateStoreConfig`.
Empty textareas save as null.

## Hero slides

Below the content form is the **Hero slides** editor.
When one or more visible slides exist they drive the homepage hero as a slider, taking priority over the plain `hero_content` text.

The add/edit form fields:

| Field | Form name | Stored column | Notes |
|---|---|---|---|
| Headline | `headline` | `headline` | Required, trimmed. |
| Subheadline | `subheadline` | `subheadline` | Optional. |
| Image | `image_url` | `image_url` | Image picker (choose from library or paste a URL). |
| CTA text | `cta_text` | `cta_text` | Button label. |
| CTA link | `cta_link` | `cta_link` | Button destination. |
| Sort order | `sort_order` | `sort_order` | Number; lower shows first. |
| Visible | `is_visible` | `is_visible` | Checkbox, checked by default. |

Below the form is a table of existing slides showing Headline, Order, Visible (Visible/Hidden), and Actions.

### How to add or edit a slide

1. Fill the form and click **Add slide** to create one (`_action=save_slide` with no `slide_id`).
2. To edit, click **Edit** on a row; the page reloads with `?edit_slide=<id>` and the form is pre-filled.
   Editing shows a **Cancel** link and a **Save slide** button.
3. To remove, click **Delete** on a row and confirm the prompt (`_action=delete_slide`).

Slides also carry an `overlay_opacity` column in the database (dark overlay strength), managed by the theme, not exposed as a field on this form.

## Media library

The bottom card is the **Media library**, shared across the admin.

### Uploading

| Field | Form name | Notes |
|---|---|---|
| Slug | `slug` | Lowercase, dash-separated (`pattern="[a-z0-9]+(-[a-z0-9]+)*"`). Identifier used in the `{{media:slug}}` token. |
| Alt text | `alt` | Accessibility description. |
| File | `file` | Accepts `image/*` or `video/*`. Required. |

Click **Upload** (`_action=upload_media`).
An upload only proceeds when a file with size > 0 and a slug are both present.

### Media table

Each uploaded item is a row with:

- **Preview** - thumbnail (an `<img>` for images, a muted `<video>` for videos).
- **Slug** - the identifier you set.
- **Type** - Image or Video (from the `media_type` column).
- **Token** - the `{{media:<slug>}}` string plus a **Copy** button that copies it to the clipboard and briefly shows a "copied" confirmation.
- **Delete** button (`_action=delete_media`) to remove the item.

An empty library shows a "no media" message.

## Data & storage (cloud)

- Content blocks: reads/writes `hero_content`, `hero_format`, `subhero_content`, `subhero_format`, `buyback_content`, `buyback_format`, `footer_content`, `footer_format` on the `store_configs` row (`updateStoreConfig`).
- Hero slides: `hero_slides` table (`fetchHeroSlides`, `createHeroSlide`, `updateHeroSlide`, `deleteHeroSlide`), scoped by `party_id`.
- Media: `store_media` table (`fetchStoreMedia`, `uploadStoreMedia`, `deleteStoreMedia`).
  Files are stored in the `store-media` Supabase Storage bucket, and the public URL is saved in `store_media.url`.

## Related pages

- [Store Settings - Layout](/docs/en/admin/settings-layout) - enable the hero, subhero, buyback, and other blocks
- [Store Settings - Branding](/docs/en/admin/settings-branding) - image pickers here draw from the same media library
- [Products](/docs/en/admin/products) - product images can use uploaded media
- [Categories](/docs/en/admin/categories) - category images use the media library
