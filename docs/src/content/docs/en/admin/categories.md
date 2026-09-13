---
title: Categories
description: Build the category tree that organizes your catalog and drives the storefront navigation
---

Categories organize your catalog into a browsable, optionally nested tree and drive the storefront navigation menu.
Each [product](/docs/en/admin/products) can belong to one or more categories, and categories can nest under a parent to form a hierarchy.
This section lives at `/admin/categories`.

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 16 | MANAGE_CATEGORIES | Owner, Admin, Eshop Admin (with this bit) |

Without `MANAGE_CATEGORIES` you are redirected to `/admin`.
No admin role at all redirects to `/dashboard`; an eshop admin with no organization goes to `/admin/setup` (owner: `/admin/parties/new`).

## Category list (`/admin/categories`)

The list renders the full category tree flattened into rows, with child categories indented under their parent (a `└` marker and left padding per depth level).

### Toolbar

- **Total label** - count of categories, e.g. `6 categories`.
- **New** button - links to `/admin/categories/new`.

### Columns

| Column | Source | Notes |
|---|---|---|
| Name | `categories.name` | Indented by depth; shows the category `icon` (an emoji, if set) before the name. |
| Visibility | `categories.is_visible` | `badge-active` ("Visible") or `badge-inactive` ("Hidden"). |
| Children | | The number of direct child categories. |
| Actions | | **Edit** link and a **Delete** button (confirm dialog). |

When there are no categories the table shows a single centered "No categories" row.

Deletion posts back to the list with `category_id` and removes the category via `deleteCategory`.

## Creating a category (`/admin/categories/new`)

### How to

1. Click **New** on the category list.
2. If your account can access multiple organizations, choose the **Organization** first.
3. Enter a **Name**; the **Slug** auto-fills from it.
4. Optionally pick a **Parent**, an **Icon**, a **Sort order**, and an **Image** (from the media library).
5. Tick **Visible** and/or **Show in navigation** as needed.
6. Click **Create**.

### Field reference

| Field | Required | Column | Notes |
|---|---|---|---|
| Organization | Only if multi-org | `categories.party_id` | Which org owns the category. |
| Name | Yes | `categories.name` | Display name, e.g. `Podzimní věnce`. |
| Slug | Yes | `categories.slug` | URL-safe id, auto-suggested from the name via `SlugInput`. |
| Parent | No | `categories.parent_id` | Dropdown of existing categories; "No parent" makes it top-level. |
| Icon | No | `categories.icon` | Short emoji/text (max 10 chars) shown before the name. |
| Sort order | No | `categories.sort_order` | Integer ordering within its level; defaults to `0`. |
| Image | No | `categories.image_url` | Picked with the `ImagePicker` from the store media library (see below). |
| Visible | No | `categories.is_visible` | Checked by default on new categories; hides/shows the category on the storefront. |
| Show in navigation | No | `categories.show_in_nav` | Unchecked by default; drives whether the category appears in the storefront nav/mega-menu. |

### The image picker and media library

The **Image** field is not a free-text URL box - it is the `ImagePicker` component wired to the store media library (`store_media`, loaded via `fetchStoreMedia`).
Click **Choose from library** to open the media picker and select an existing image; a 40x40 preview thumbnail appears, and a **Clear** button removes the selection.
The underlying value stored is the media URL in `categories.image_url`.

## Editing a category (`/admin/categories/{id}`)

The edit form carries the same fields as the create form (minus the organization selector - a category's org is fixed).
The **Parent** dropdown excludes the category itself so it cannot become its own parent.
Buttons: **Save** (updates and returns to the list) and a separate **Delete** button (confirm dialog) below the form.

## How categories cooperate with the catalog

- Products are assigned to categories from the [product editor](/docs/en/admin/products) via multi-select checkboxes (the `product_categories` join table). The category filter on the product list uses the same tree.
- `show_in_nav` controls the storefront navigation directly - there is no separate curated nav table for standard categories.
- `is_visible` hides a category from the storefront without deleting it or its products.
- Kytka z Beskyd seeds six top-level categories, all with `show_in_nav = true`: Podzimní věnce, Celoroční věnce, Svatební kytice a dekorace, Smuteční věnce a kytice, Sušené květiny do vázy, Dárkové sety - each given an `image_url` from the store media library.

## Data & storage (cloud)

- **Table:** `categories` (id, party_id, name, slug, parent_id, icon, image_url, sort_order, is_visible, show_in_nav, seo_title, seo_description, created_at, updated_at). Scoped to the org by `party_id`.
- **Join table:** `product_categories` (product_id, category_id) - written from the product editor.
- **Media:** `store_media` via `fetchStoreMedia`; `image_url` holds the chosen library URL. No direct upload happens on this page.
- **Services:** `categoryService` (`fetchCategoryTree`, `fetchCategories`, `fetchCategory`, `createCategory`, `updateCategory`, `deleteCategory`), `storeMediaService`.

## Related pages

- [Products](/docs/en/admin/products) - assign products to categories and filter the product list by category
- [Product Conditions](/docs/en/admin/product-conditions) - the other product-organizing concept (labels)
- [Inventory](/docs/en/admin/inventory) - stock for the products inside these categories
