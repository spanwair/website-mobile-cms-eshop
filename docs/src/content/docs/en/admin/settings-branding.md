---
title: Store Settings - Branding
description: Set your store name, logo, colors, fonts, corner radius, and product card style
---

Branding is the first tab of Store Settings and controls how your storefront looks and feels.
Everything you set here feeds the theme engine that renders your public shop at `/eshop-<slug>`.
It works alongside [Layout](/docs/en/admin/settings-layout) (which sections appear on the homepage) and [Content](/docs/en/admin/settings-content) (the words and images inside those sections).

The page lives at `/admin/settings/branding` and is reached from the **Settings** entry in the sidebar (System group), then the **Branding** tab.
Every Store Settings tab shares a top tab bar and a **View storefront** button that opens `/eshop-<your-slug>` in a new tab so you can preview changes.

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 1024 | MANAGE_SETTINGS | Owner, Admin, Eshop Admin (with this bit) |

Access flow enforced at the top of the page:

1. No session -> redirected to `/login`.
2. No admin context (`requireAdminCtx` returns null) -> redirected to `/dashboard`.
3. Admin context but no active party -> redirected to `/admin/parties/new` (owner) or `/admin/setup` (everyone else).
4. Party present but missing MANAGE_SETTINGS -> redirected to `/admin`.

All settings apply to your currently selected organization (party).
Switch parties with the party switcher before editing if you manage more than one.

## Design presets

At the top of the form is a **Design presets** panel.
Each preset is a card showing three color swatches (primary, secondary, surface), a label, and the preset body font.

- Click any built-in preset card to instantly fill the color pickers, `font_heading`, `font_body`, and `radius_scale` fields.
  Nothing is saved until you press **Save changes** at the bottom.
- Custom presets you saved earlier appear next to the built-in ones, labeled as custom, each with an "x" remove button.
- To save the current colors as a reusable template, type a name in the **template name** box and click **Save as template**.
  This POSTs to `/api/admin/color-presets` and stores the seven color fields.
- Removing a custom preset calls `DELETE /api/admin/color-presets?id=...` and reloads the page.

Custom presets are stored per party in the `party_color_presets` table.

## Branding section

| Field | Form name | Stored column | Notes |
|---|---|---|---|
| Brand name | `brand_name` | `brand_name` | Store name shown in the header and titles. Empty saves as null. Kytka example: `Kytka z Beskyd`. |
| Tagline | `tagline` | `tagline` | Short slogan under the brand name. Kytka example: `Krása, která nikdy neuvadne`. |
| Logo | `logo_url` | `logo_url` | Image picker (see below). Header logo. |
| Favicon | `favicon_url` | `favicon_url` | Image picker. Browser-tab icon. |

### Image picker

Logo, favicon, and store photo use a shared image picker control.
Each shows a text input holding the URL, a small 40x40 preview thumbnail when a value is set, a **Clear** button, and a **Choose from library** button.
Choose from library opens the media picker populated from your [media library](/docs/en/admin/settings-content) (the `store_media` table).
You can also paste any external URL directly into the text field.

## Contact section

| Field | Form name | Stored column | Notes |
|---|---|---|---|
| Phone | `contact_phone` | `contact_phone` | Shown in the footer and contact page. |
| Email | `contact_email` | `contact_email` | Type `email` input. |
| Business hours | `business_hours` | `business_hours` | Free text. Placeholder `Po-Ne: 8:30 - 20:00`. |
| Currency code | `currency_code` | `currency_code` | Max 3 characters, force-uppercased on save. Defaults to `CZK`. Kytka uses `CZK`. |

A note under this section explains these details appear on the storefront (contact page and footer).

## Store visit section

| Field | Form name | Stored column | Notes |
|---|---|---|---|
| Store address | `store_address` | `store_address` | Physical address. Placeholder `Vodičkova 10, Praha 1`. |
| Map URL | `store_map_url` | `store_map_url` | Link to Google Maps or similar. Placeholder `https://maps.google.com/...`. |
| Store photo | `store_photo_url` | `store_photo_url` | Image picker. Photo of the physical shop. |
| Footer theme | `footer_theme` | `footer_theme` | Select: **Light** or **Dark**. Controls the footer background. Kytka uses `dark`. |

The footer theme here is the same setting referenced from the [Footer links](/docs/en/admin/settings-footer) tab.

## Colors section

Seven color pickers laid out in a grid.
Each shows a native HTML color swatch plus the current hex value in monospace next to it.
When you apply a preset the hex label updates live.

| Picker | Form name | Stored column | Default | Kytka value |
|---|---|---|---|---|
| Primary | `color_primary` | `color_primary` | `#4F46E5` | `#7C4F93` |
| Secondary | `color_secondary` | `color_secondary` | `#7C3AED` | `#C97B4A` |
| Background | `color_background` | `color_background` | `#FFFFFF` | `#FDFBF7` |
| Surface | `color_surface` | `color_surface` | `#F8F9FA` | `#F7F1E8` |
| Text primary | `color_text_primary` | `color_text_primary` | `#212529` | `#2E2A26` |
| Text secondary | `color_text_secondary` | `color_text_secondary` | `#6C757D` | `#7A6F63` |
| Border | `color_border` | `color_border` | `#E9ECEF` | `#E8DFD0` |

These seven values are injected as CSS custom properties into the storefront, so changing them recolors buttons, links, cards, and backgrounds across the whole shop.

## Typography section

| Field | Form name | Stored column | Default | Kytka value |
|---|---|---|---|---|
| Heading font | `font_heading` | `font_heading` | `Inter` | `Playfair Display` |
| Body font | `font_body` | `font_body` | `Inter` | `Lora` |
| Corner radius | `radius_scale` | `radius_scale` | `default` | `soft` |

Corner radius is a select with three options that scale border-radius across the storefront:

| Value | Label |
|---|---|
| `sharp` | Sharp corners |
| `default` | Default corners |
| `soft` | Soft corners |

Fonts are entered by name; use a font available to the storefront (Google Fonts family names such as `Playfair Display` and `Lora`).

## Components section

| Control | Form name | Stored column | Notes |
|---|---|---|---|
| Product card variant | `product_card_variant` | `product_card_variant` | Select. Options below. Kytka uses `luxury`. |
| Enable wishlists | `enable_wishlists` | `enable_wishlists` | Checkbox, checked by default. Turns the storefront wishlist feature on or off. |

Product card variant options (from the variant registry):

| Value | Label |
|---|---|
| `classic` | Classic - image, title, price, rating |
| `minimal` | Minimal - image, title, price only |
| `luxury` | Luxury - large image, heading font, understated price |

This chooses how every product tile renders across the shop and in [Products](/docs/en/admin/products) previews.

## Saving

A single **Save changes** button at the bottom submits the whole form via POST to the same URL.
On success a green banner shows the saved message; on failure a red banner shows the error message returned by `updateStoreConfig`.
All fields are written in one `UPDATE` to the row in `store_configs` matching your `party_id`.

## Data & storage (cloud)

- Reads and writes a single row in `store_configs` (keyed by `party_id`) via `fetchStoreConfig` / `updateStoreConfig`.
- Reads `store_media` (for the image pickers) via `fetchStoreMedia`.
- Reads `party_color_presets` via `fetchColorPresets`; the Save as template / remove buttons hit `/api/admin/color-presets`.
- No storage bucket is written directly on this page; media uploads happen on the [Content](/docs/en/admin/settings-content) tab (the `store-media` bucket).

## Related pages

- [Store Settings - Layout](/docs/en/admin/settings-layout) - choose which homepage sections appear and in what order
- [Store Settings - Content](/docs/en/admin/settings-content) - hero, subhero, footer copy, and the media library that feeds the image pickers here
- [Store Settings - Footer](/docs/en/admin/settings-footer) - footer columns and links; also uses the footer theme set here
- [Products](/docs/en/admin/products) - product tiles rendered with the card variant chosen here
