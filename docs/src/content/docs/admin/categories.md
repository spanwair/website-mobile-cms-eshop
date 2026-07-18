---
title: Categories
description: How to organize your products into categories and sub-categories.
---

## What categories are for

Categories let you organize your product catalog so customers can find what they're looking for. A product can belong to **multiple categories**.

Examples:
- Electronics → Phones → Smartphones
- Clothing → Men's → T-Shirts
- A "Summer Sale" promotional category that includes items from multiple departments

## Where to find categories

Go to **Admin → Categories** (`/admin/categories`). You see a tree table showing all your categories with their hierarchy.

## Category fields

| Field | Required | Description |
|-------|----------|-------------|
| Name | ✅ | Display name (e.g. "Electronics") |
| Slug | ✅ | URL identifier. Must be unique within your org. |
| Parent | | Select a parent category to make this a sub-category |
| Icon | | Emoji or icon code (e.g. "📱") |
| Sort order | | Lower numbers appear first (default: 0) |
| Visible | | Whether customers see this category (default: yes) |

## Creating a category

1. Click **New Category** in the toolbar
2. Fill in Name and Slug (slug is auto-suggested from name)
3. Optionally select a **Parent** to nest it under another category
4. Click **Save**

The new category appears in the tree table and is immediately available for assigning to products.

## The category tree

Categories are displayed in a hierarchy. A root category has no parent. A child category shows indented under its parent. The tree can be as deep as you need.

The table shows:
- **Name** (with tree indent for children)
- **Slug**
- **Children** — how many sub-categories this has
- **Sort order**
- **Visible** badge

## Editing a category

Click the **Edit** button on any row. You can change the name, slug, parent, icon, sort order, and visibility.

> **Note**: Changing the slug of a category that is already in use by customer-facing links will break those links. Be careful when renaming slugs on live categories.

## Deleting a category

On the category edit page, click **Delete** and confirm.

When you delete a category:
- Its sub-categories become root categories (their `parent_id` is set to NULL)
- Products that were in this category lose the assignment (the `product_categories` junction row is deleted)
- The products themselves are **not** deleted

## Connecting products to categories

Categories and products are connected on the **product edit page** — not here. When editing a product, scroll down to the **Categories** section and check the boxes for the categories you want.

## Hidden categories

If a category has `is_visible = false`, it is hidden from the customer-facing shop but still visible in the admin. Use this to prepare categories before making them live.
