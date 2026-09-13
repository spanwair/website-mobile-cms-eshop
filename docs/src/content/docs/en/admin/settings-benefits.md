---
title: Store Settings - Benefits
description: Manage the trust badges and benefit items shown on your storefront
---

Benefits are the short trust items (free shipping, handmade quality, secure payment, and similar) that appear in the "Benefits / trust badges" block of your homepage.
They only render when the `benefits` section is enabled in [Layout](/docs/en/admin/settings-layout).

The page lives at `/admin/settings/benefits`, reached from the **Settings** sidebar entry then the **Benefits** tab.

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 1024 | MANAGE_SETTINGS | Owner, Admin, Eshop Admin (with this bit) |

Guard chain: no session -> `/login`; no admin context -> `/dashboard`; no active party -> `/admin/parties/new` (owner) or `/admin/setup`; missing MANAGE_SETTINGS -> `/admin`.

## Add / edit form

A single card at the top edits one benefit item.

| Field | Form name | Stored column | Notes |
|---|---|---|---|
| Icon | `icon` | `icon` | Emoji or short symbol. Defaults to `✓`. Placeholder `🛡️`. |
| Title | `title` | `title` | Required, trimmed. |
| Description | `description` | `description` | Optional textarea (2 rows). |
| Sort order | `sort_order` | `sort_order` | Number; lower shows first. |
| Visible | `is_visible` | `is_visible` | Checkbox, checked by default. |

### How to

1. Fill Icon and Title (Title is required), optionally a Description, Sort order, and Visible.
2. Click **Add benefit** to create it.
3. To edit an existing item, click **Edit** on its table row; the page reloads with `?edit=<id>` and the form pre-fills, showing a **Cancel** link and a **Save slide** button (shared label).
4. After a successful save or delete the page redirects back to `/admin/settings/benefits`.

## Items table

Below the form is a table of all benefit items.

| Column | Shows |
|---|---|
| Icon | The icon at large size |
| Title | The benefit title (bold) |
| Order | The sort order number |
| Visible | "Visible" or "Hidden" |
| Actions | Edit link and a Delete button |

**Delete** asks for confirmation before removing the item.
When there are no items, the table shows a centered "no benefits" empty state.

### Kytka z Beskyd example

The Kytka store seeds 6 benefit items, ordered by `sort_order`, each with an emoji icon and a short title/description reflecting its handmade dried-flower positioning.

## Data & storage (cloud)

- Reads and writes the `benefit_items` table, scoped by `party_id`, via `fetchBenefitItems`, `createBenefitItem`, `updateBenefitItem`, `deleteBenefitItem`.
- No storage bucket or other table is touched.

## Related pages

- [Store Settings - Layout](/docs/en/admin/settings-layout) - enable the `benefits` section so these items appear
- [Store Settings - Badges](/docs/en/admin/settings-badges) - separate footer badges (shipping/payment/social/store feature), not the homepage benefits
- [Store Settings - Branding](/docs/en/admin/settings-branding) - theme colors applied to the benefit block
