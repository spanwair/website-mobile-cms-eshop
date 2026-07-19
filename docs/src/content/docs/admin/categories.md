---
title: Categories
description: How to organize your product catalog into a parent-child category hierarchy.
---

Categories let customers browse and filter your eshop. A product can belong to multiple categories. Categories support unlimited nesting (parent → child → grandchild). You must have at least one category before you can properly organize [Products](/admin/products).

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 16 | MANAGE_CATEGORIES | Owner, Admin, Eshop Admin (with this bit) |

## Category list (`/admin/categories`)

The list displays your entire category tree with indentation. Child categories are shown below their parent with a `└` prefix.

| Column | Description |
|---|---|
| Icon | Emoji displayed next to the category name on the eshop |
| Name | Category name (indented for child categories) |
| Visible | Badge showing whether customers can see this category |
| Children | How many direct sub-categories this has |
| Actions | Edit and Delete buttons |

## Creating a category (`/admin/categories/new`)

### How to

1. Click **New Category** in the toolbar.
2. Enter a **Name** (required). The slug is auto-suggested.
3. Optionally select a **Parent Category** to nest it under an existing category.
4. Add an **Icon** (single emoji, max 10 characters) to visually identify this category.
5. Set **Sort Order** to control where this category appears relative to siblings (lower number = first).
6. Leave **Visible** checked unless you want to prepare the category before making it live.
7. If your account has access to multiple organizations, choose which org owns this category.
8. Click **Save**.

### Field reference

| Field | Required | Description |
|---|---|---|
| Name | Yes | Display name shown to customers (e.g. "Men's Shoes") |
| Slug | Yes | URL-safe identifier (e.g. `mens-shoes`). Auto-suggested; must be unique within your org. |
| Parent | No | Select a parent to make this a sub-category. Leave blank for a root category. |
| Icon | No | Single emoji (e.g. `👟`). Max 10 characters. Shown in eshop navigation. |
| Sort order | No | Integer — lower numbers appear first among siblings. Default 0. |
| Visible | No | Checked = visible to customers. Uncheck to hide without deleting. |

## Editing a category (`/admin/categories/{id}`)

Click **Edit** on any row. All fields are editable except that the **Parent** dropdown excludes the category itself (you cannot make a category its own parent).

Changing the **Slug** on a live category will break any existing customer bookmarks or links to that category's URL. Do this only when the eshop is not yet live or when you can update all references.

## Deleting a category

Click **Delete** on the list or from the edit page and confirm.

When a category is deleted:
- Its **child categories become root categories** (their parent is set to none)
- **Products lose their assignment** to this category (but the products themselves are not deleted)
- The deletion is permanent

## How category hierarchy works

Example hierarchy:
```
Clothing              (root, sort 1)
  └ Men's             (child of Clothing, sort 1)
      └ T-Shirts      (child of Men's, sort 1)
      └ Jeans         (child of Men's, sort 2)
  └ Women's           (child of Clothing, sort 2)
Electronics           (root, sort 2)
  └ Phones            (child of Electronics)
```

The eshop renders this as a navigable menu. Customers can click a parent to see all products in it and all its children.

## Controlling visibility

Setting `is_visible = false` hides the category from the eshop navigation and browsing pages, but:
- The category still exists in the database
- Products assigned to it are still visible (if their own status is `active`)
- It is still visible in the admin panel

Use invisible categories for staging new category structures before going live.

## Connecting categories to products

The assignment happens on the **product edit page**, not here. When editing a product in [Products](/admin/products), scroll to the **Categories** section and check the boxes for each category you want the product to appear in.

## Setup order

Before creating your first product, do this:

1. Plan your category structure on paper
2. Create root categories first (e.g. "Men's", "Women's", "Electronics")
3. Create child categories next, selecting the correct parent each time
4. Then go to [Products](/admin/products) to create products and assign them to categories

## Related pages

- [Products](/admin/products) — assign products to these categories
- [Permissions](/users/permissions) — MANAGE_CATEGORIES permission (bit 16)
- [Roles](/admin/roles) — which custom roles have category management access
