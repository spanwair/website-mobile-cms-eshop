---
title: Store Settings - Layout
description: Choose which sections appear on your storefront homepage and in what order
---

The Layout tab decides which blocks make up your storefront homepage and the order they stack in.
It pairs with [Branding](/docs/en/admin/settings-branding) (how those blocks look) and [Content](/docs/en/admin/settings-content) (what goes inside the hero, subhero, and footer blocks).

The page lives at `/admin/settings/layout`, reached from the **Settings** sidebar entry then the **Layout** tab.

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 1024 | MANAGE_SETTINGS | Owner, Admin, Eshop Admin (with this bit) |

Same guard chain as the other settings tabs: no session -> `/login`; no admin context -> `/dashboard`; no active party -> `/admin/parties/new` (owner) or `/admin/setup`; missing MANAGE_SETTINGS -> `/admin`.

## Homepage section list

The page renders one row per available homepage section.
Each row has a **checkbox** (include this section or not) and an **Order** number input.

| Section key | Label | What it renders on the homepage |
|---|---|---|
| `hero` | Hero banner | Main top banner (or hero slider). Copy comes from [Content](/docs/en/admin/settings-content). |
| `subhero` | Subhero banner | Secondary banner below the hero. Copy from Content. |
| `categories` | Category showcase | Grid of your [categories](/docs/en/admin/categories). |
| `featured_products` | Featured products | Products flagged as featured in [Products](/docs/en/admin/products). |
| `benefits` | Benefits / trust badges | The items from [Benefits](/docs/en/admin/settings-benefits). |
| `condition_explainer` | Product condition explainer | Explains product condition labels (e.g. Kytka's "Na zakázku"). |
| `buyback_promo` | Buyback / trade-in promo | Buyback block; copy from Content. |
| `blog_preview` | Blog preview | Latest posts from the CMS blog. |
| `newsletter` | Newsletter signup | Homepage newsletter form (see [Newsletter](/docs/en/admin/settings-newsletter)). |

The order shown above is the default order for a brand-new store (defined in the section registry).

### How ordering works

- The **Order** field is a plain number.
  Lower numbers appear higher on the page.
- On save, only checked sections are kept.
  They are sorted by their Order value, then stored as an ordered list of section keys.
- The default value pre-filled in each Order box is the section's current index in the saved layout, or the end of the list if it is not currently included.
- To move a section up, give it a smaller number than the section you want it above.
  You do not need contiguous numbers; the list is sorted numerically then flattened.

### Kytka z Beskyd example

The Kytka store saves this exact order:

```
hero, subhero, benefits, categories, featured_products, condition_explainer, blog_preview, newsletter
```

Note Kytka omits `buyback_promo` (its checkbox is unchecked), so that section never renders on its homepage.

## Saving

Press **Save changes** to POST the form.
The server reads each `include_<key>` checkbox and `order_<key>` number, keeps only the included ones, sorts by order, and writes the resulting array to the `homepage_layout` column via `updateStoreConfig`.
A green banner confirms the save.

The stored value is sanitized on read: any unknown or removed section key is dropped, and if the list ends up empty the full default layout is used instead, so a stale value can never break homepage rendering.

## Data & storage (cloud)

- Reads and writes the `homepage_layout` column (a JSON array of section keys) on the `store_configs` row for your `party_id`.
- No other tables, buckets, or functions are touched.

## Related pages

- [Store Settings - Branding](/docs/en/admin/settings-branding) - colors, fonts, and card style for these sections
- [Store Settings - Content](/docs/en/admin/settings-content) - hero, subhero, and footer copy shown inside the layout blocks
- [Store Settings - Benefits](/docs/en/admin/settings-benefits) - the items rendered by the `benefits` section
- [Store Settings - Newsletter](/docs/en/admin/settings-newsletter) - controls the `newsletter` section form
- [Categories](/docs/en/admin/categories) - source of the `categories` showcase
- [Products](/docs/en/admin/products) - source of the `featured_products` section
