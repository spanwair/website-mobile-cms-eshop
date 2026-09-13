---
title: Navigation (Header Menu)
description: Build the storefront header menu and mega-menu dropdowns from categories and content pages
---

The Navigation builder controls the menu that appears in your storefront header.
It is the first tab of the Content section and sits next to [Pages](/docs/en/admin/cms-pages), [Blog](/docs/en/admin/cms-blog), [Team](/docs/en/admin/cms-team), [FAQ](/docs/en/admin/cms-faq), and [Legal Documents](/docs/en/admin/cms-legal).
Each menu entry links either to one of your [Categories](/docs/en/admin/categories) or to a custom URL (typically a [content page](/docs/en/admin/cms-pages) at `/stranka/{slug}`), and entries can be nested into dropdowns and grouped into mega-menu columns.

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 2048 | MANAGE_CMS | Owner, Admin, Eshop Admin (with this bit) |

Without the MANAGE_CMS bit you are redirected to `/admin`.
If you have no organization selected yet you are redirected to `/admin/parties/new` (owner) or `/admin/setup` (eshop admin).
Pure customers (role USER) are redirected to `/dashboard`.

## What appears in the storefront header

Your live header is built from two sources merged together and sorted by **Sort order**:

1. The hand-curated `nav_items` you create on this page (only rows where **Visible** is checked).
2. Any [Category](/docs/en/admin/categories) that has its "show in nav" flag set - those are appended automatically with a link to the shop filtered by that category.

That means you do not have to recreate your category tree here by hand.
Use this page for links the category tree cannot express: an "About us" page, a "Made to order" landing page, a blog link, or a promotional URL.

For Kytka z Beskyd the categories (Podzimní věnce, Celoroční věnce, Svatební kytice a dekorace, Smuteční věnce, Sušené květiny do vázy, Dárkové sety) come through automatically, and this page is used to add links such as "Výroba na zakázku" pointing to the `/stranka/vyroba-na-zakazku` content page.

## Add / edit form

The form at the top of the page creates a new item, or edits an existing one when you arrive via the **Edit** button (the URL becomes `/admin/cms/navigation?edit={id}`).
The heading reads "Add nav item" when creating and "Edit" when editing.

### Field reference

| Field | Column in `nav_items` | Required | Description |
|---|---|---|---|
| Label | `label` | Yes | The clickable text shown in the header (e.g. `Výroba na zakázku`). |
| Parent item | `parent_id` | No | Select a top-level item to nest this entry beneath it as a dropdown child. Leave blank for a top-level item. The dropdown lists only top-level items, and the item you are editing is excluded so it cannot become its own parent. |
| Link to category | `category_id` | No | Point the entry at one of your categories. When a category is chosen, the URL field is ignored and stored as null - the link target is the category. |
| URL | `url` | No | A custom link target. This is a creatable combobox: it suggests every content page (shown as its title, value `/stranka/{slug}`), and you can also type any custom path or full URL. A bare value gets a leading slash added (`o-nas` becomes `/o-nas`); values starting with `/`, `http://`, `https://`, or `www.` are kept as typed. |
| Mega-menu column label | `column_label` | No | Only meaningful on a child item. When the parent is a mega menu, this label groups children into a titled column (e.g. type `iPhone` to head a column). Children sharing the same column label appear together. |
| Sort order | `sort_order` | No | Integer, lower appears first. Default 0. This ordering is shared with the auto-added category items, so tune the numbers to interleave them as you want. |
| Mega menu (group children into columns) | `is_mega` | No | Checkbox. Mark a top-level item as a mega menu so its children render as multi-column dropdown grouped by their column labels. Shown as a check mark in the list. |
| Visible | `is_visible` | No | Checkbox, checked by default on new items. Unchecked items are saved but never rendered in the storefront header. |

### Category vs URL

An entry links to exactly one destination.
If you pick a category in **Link to category**, the server stores `category_id` and forces `url` to null.
If you leave the category blank, the server stores the **URL** value instead.
Use the URL combobox to link to a [content page](/docs/en/admin/cms-pages), the [blog index](/docs/en/admin/cms-blog) (`/blog`), or any external address.

### Buttons

- **+ Add nav item** / **Save changes** - submits the form (creates or updates).
- **Cancel** - shown only while editing; returns to `/admin/cms/navigation` discarding changes.

On a successful save you are redirected back to the list.
A database error is shown in a red alert box above the form and the entry is not saved.

## Navigation list

Below the form, every item (visible and hidden) is listed in sort order.

| Column | Source | Notes |
|---|---|---|
| Label | `label` | Bold. |
| Target | `category_id` or `url` | Shows the linked category's name if set, otherwise the raw URL. |
| Parent | `parent_id` | The parent item's label, or a dash when top-level. |
| Mega | `is_mega` | A check mark when the item is a mega menu, otherwise a dash. |
| Order | `sort_order` | The numeric sort value. |
| Actions | - | **Edit** and **Delete**. |

**Delete** asks for confirmation, then removes the row immediately.
When there are no items the table shows "No navigation items yet."

## Building a mega menu (step by step)

1. Create a top-level item (no parent), give it a **Label**, and check **Mega menu**.
2. Create each child item, choosing that top-level item as **Parent**.
3. Give the children a **Mega-menu column label** to group them into named columns.
4. Point each child at a category or a URL.
5. Set **Sort order** on the children to arrange them within their column.

## Data & storage (cloud)

- Table: `nav_items` (columns `party_id`, `label`, `url`, `category_id`, `parent_id`, `column_label`, `is_mega`, `sort_order`, `is_visible`).
- Reads `categories` (for the category dropdown and to resolve the Target column) and `content_pages` (to build the URL suggestions).
- All rows are scoped to the active organization via `party_id`.
- Storefront rendering merges visible `nav_items` with nav-flagged categories through `fetchStorefrontNavTree`.

## Related pages

- [Categories](/docs/en/admin/categories) - nav-flagged categories are added to the header automatically; link entries here point at them
- [Pages](/docs/en/admin/cms-pages) - content pages become the `/stranka/{slug}` URL suggestions in the link combobox
- [Blog](/docs/en/admin/cms-blog) - link to `/blog` from a nav entry to surface your posts
- [Legal Documents](/docs/en/admin/cms-legal) - legal/info pages usually belong in the footer rather than the header
