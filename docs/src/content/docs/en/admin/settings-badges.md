---
title: Badges
description: Manage the trust badges - payment, shipping, social, and store-feature - shown near the storefront footer
---

The Badges page manages the small trust/utility badges shown near your storefront footer: accepted payment methods, shipping carriers, social links, and store-feature icons.
It is one tab of the [Store Settings](/docs/en/admin/settings-branding) group, next to [Footer](/docs/en/admin/settings-footer) and [Domains](/docs/en/admin/settings-domains).

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 1024 | MANAGE_SETTINGS | Owner, Admin, Eshop Admin (with this bit) |

Without `MANAGE_SETTINGS` you are redirected to `/admin`.

## Page layout (`/admin/settings/badges`)

A single add/edit form on top, then one table per badge kind (edit reloads with `?edit={id}`; Cancel returns to the blank form).

### Add / edit badge form

| Field | Column | Notes |
|---|---|---|
| Kind | `footer_badges.kind` | One of `shipping`, `payment` (default), `social`, `store_feature`. |
| Icon | `footer_badges.icon` | An emoji or short glyph, e.g. `💳`. |
| Label | `footer_badges.label` | Required, e.g. "Visa". |
| URL | `footer_badges.url` | Optional link (e.g. a social profile). |
| Sort order | `footer_badges.sort_order` | Lower numbers first within the kind. |
| Visible | `footer_badges.is_visible` | Unticking hides without deleting. |

### The four kind groups

Badges are grouped into four separate tables, one per kind, each with columns Icon, Label, Order, Visible, Actions (**Edit** / **Delete** with a `confirm()`):

| Kind | Typical use |
|---|---|
| Shipping | Carrier logos (PPL, Packeta). |
| Payment | Accepted payment methods (Visa, Mastercard, Apple Pay). |
| Social | Links to social profiles. |
| Store feature | Reassurance icons (secure checkout, made in CZ). |

Each empty group shows its own "no badges" row.

## Data & storage (cloud)

- **Table:** `footer_badges` (`party_id`, `kind`, `icon`, `label`, `url`, `sort_order`, `is_visible`).
- **Services:** `fetchFooterBadges`, `createFooterBadge`, `updateFooterBadge`, `deleteFooterBadge` (`footerBadgeService`).
- **Types:** `FooterBadgeKind`.
- **Component:** `SettingsTabs`.
- Scoped to `ctx.partyId`.

## Related pages

- [Footer](/docs/en/admin/settings-footer) - the footer link columns these badges sit alongside
- [Shipping](/docs/en/admin/settings-shipping) - the carriers a shipping badge would advertise
