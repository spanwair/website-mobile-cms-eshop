---
title: Products
description: How to create, edit, manage images, and publish products in the CMS.
---

The Products section is the core of your catalog. Products belong to your organization, can be assigned to multiple [categories](/admin/categories), appear on the eshop when active, and are tracked in [Inventory](/admin/inventory).

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 8 | MANAGE_PRODUCTS | Owner, Admin, Eshop Admin (with this bit) |

This same permission also gates [Product Reviews](/admin/reviews).

## Product list (`/admin/products`)

The list page shows all products in your organization with:

- **Search box** — searches by product title in real time
- **Status filter** — show only `draft`, `active`, or `inactive` products
- **Category filter** — dropdown of all your categories; filters to products in that category

| Column | Description |
|---|---|
| Name | Product title |
| SKU | Stock-keeping unit code |
| Status | Badge showing draft / active / inactive |
| Price | Regular selling price |

## Creating a product (`/admin/products/new`)

### How to

1. Click **New Product** in the toolbar.
2. Fill in the required fields (Title, Slug, Price, Status).
3. Select one or more **categories** using the checkboxes. If no categories exist yet, a link to [create one](/admin/categories/new) appears.
4. If your account has access to multiple organizations, choose which **organization** this product belongs to using the org selector.
5. Click **Save**. You land on the edit page where you can upload images.

### Field reference

| Field | Required | Description |
|---|---|---|
| Title | Yes | Product name shown to customers |
| Slug | Yes | URL-safe identifier (auto-suggested from title). Must be unique within your org. |
| SKU | No | Internal stock-keeping code (e.g. `SHIRT-RED-L`) |
| Barcode | No | EAN-13 or UPC barcode for scanning |
| Price | Yes | Regular price in your currency |
| Discount price | No | Sale price — shown instead of regular price when set. Leave blank for no discount. |
| Status | Yes | `draft`, `active`, or `inactive` (see below) |
| Description | No | Full product description (supports plain text) |
| Is featured | No | Check to include this product in "featured" sections on the eshop |
| Categories | No | Which categories this product belongs to (multi-select checkboxes) |

### Status workflow

| Status | What it means |
|---|---|
| `draft` | Hidden from customers — use while working on the product |
| `active` | Publicly visible and purchasable |
| `inactive` | Hidden from the shop but not deleted — useful for seasonal products |

Always start a new product as `draft` until it is ready, then set it to `active`.

## Editing a product (`/admin/products/{id}`)

Open a product from the list by clicking its name. In addition to all the create fields you also get:

### Image management

Below the product form is an image section:

1. Click **Upload Image** and select a JPG, PNG, WebP, or GIF (max 5 MB). Images are stored in the `product-images` Supabase Storage bucket at `{org_id}/{product_id}/{timestamp}.{ext}`.
2. After upload, the image thumbnail appears. Click **Set Primary** to make it the main product photo used in listings.
3. Click **Delete** on a thumbnail to permanently remove that image.

For video: click **Upload Video**. Videos go to the `product-videos` bucket.

### Deleting a product

Scroll to the bottom and click **Delete**, then confirm. Deletion is permanent and removes:
- All image and video uploads
- Category assignments
- Inventory records for this product

Orders that already contain this product are **not** affected.

## Relationship to other pages

- **Before creating products**, create your [Categories](/admin/categories) first — you need at least one to properly organize your catalog.
- After creating a product, go to [Inventory](/admin/inventory) to set its stock levels.
- Customer-submitted ratings and reviews for a product are managed in [Reviews](/admin/reviews).
- Pricing discounts and coupon codes that can apply to products are managed in [Pricing](/admin/pricing).

## Related pages

- [Categories](/admin/categories) — organize products into a browsable hierarchy
- [Inventory](/admin/inventory) — track stock levels per product
- [Reviews](/admin/reviews) — moderate customer reviews (same permission: MANAGE_PRODUCTS)
- [Pricing](/admin/pricing) — price lists and discounts that reference products
- [Orders](/admin/orders) — orders contain product line items
