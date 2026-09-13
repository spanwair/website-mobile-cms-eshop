---
title: Footer
description: Build the storefront footer link columns, grouping links under system or custom columns
---

The Footer settings page builds the link columns shown in your storefront footer.
Each link belongs to a column (a system column like "Shop" or a custom one you name), and can point at a content page, a category filter, or any URL.
It is one tab of the [Store Settings](/docs/en/admin/settings-branding) group, alongside [Badges](/docs/en/admin/settings-badges), [Domains](/docs/en/admin/settings-domains), and the rest.

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 1024 | MANAGE_SETTINGS | Owner, Admin, Eshop Admin (with this bit) |

Without `MANAGE_SETTINGS` you are redirected to `/admin`.

## Page layout (`/admin/settings/footer`)

A single add/edit form above a list table (edit reloads with `?edit={id}`; Cancel returns to the blank form).

### Add / edit link form

| Field | Column | Notes |
|---|---|---|
| Column | `footer_links.column_key` | A `CreatableCombobox`: pick a system column or type a new custom key. Defaults to `shop`. |
| Label | `footer_links.label` | The visible link text. |
| URL | `footer_links.url` | A `CreatableCombobox` pre-filled with your content pages (as `/stranka/{slug}`); you can also type any URL. |
| Sort order | `footer_links.sort_order` | Lower numbers appear first within the column. |
| Visible | `footer_links.is_visible` | Unticking hides the link without deleting it. |

### System columns

The built-in column keys (from `SYSTEM_FOOTER_COLUMNS`) are: `shop`, `information`, `purchase_info`, `customer_service`, and `custom`.
Any other key you type becomes a custom column, displayed under that literal key.

### List table

Columns: Column (localized label), Label, URL, Order, Visible, Actions (**Edit** / **Delete** with a `confirm()`).
An empty list shows a centered "no links" row.

Kytka z Beskyd seeds three columns: `shop` (category links), `information` (about, team, custom-order guide, size guide, blog, contact), and `customer_service` (FAQ, contact).
The footer's light/dark look is controlled separately by `footer_theme` in [Branding](/docs/en/admin/settings-branding).

## Data & storage (cloud)

- **Table:** `footer_links` (`party_id`, `column_key`, `label`, `url`, `sort_order`, `is_visible`).
- **Services:** `fetchFooterLinks`, `createFooterLink`, `updateFooterLink`, `deleteFooterLink` (`footerLinkService`); `fetchContentPages` for the URL combobox.
- **Constants:** `SYSTEM_FOOTER_COLUMNS` from `shared/constants/footer.ts`.
- **Components:** `CreatableCombobox`, `SettingsTabs`.
- Scoped to `ctx.partyId`.

## Related pages

- [Pages](/docs/en/admin/cms-pages) - the content pages the URL combobox links to
- [Legal Pages](/docs/en/admin/cms-legal) - legal documents you typically link from the footer
- [Branding](/docs/en/admin/settings-branding) - the `footer_theme` (light/dark) setting
- [Badges](/docs/en/admin/settings-badges) - payment/shipping/social badges shown near the footer
