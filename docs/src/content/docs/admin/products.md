---
title: Products
description: How to create, edit, and manage products in the CMS.
---

## Where to find products

Go to **Admin → Products** (`/admin/products`). You see a table of all products in your organization.

## Product fields

| Field | Required | Description |
|-------|----------|-------------|
| Title | ✅ | Product name shown to customers |
| Slug | ✅ | URL-safe identifier (auto-suggested). Must be unique within your org. |
| SKU | | Internal stock-keeping code |
| Barcode | | EAN/UPC barcode |
| Price | ✅ | Regular price in your currency |
| Discount price | | Sale price (shown instead of regular price when set) |
| Status | ✅ | `draft`, `active`, or `inactive` |
| Description | | Text description |
| Featured | | Show in "featured" sections |
| Categories | | Which categories this product belongs to |

## Status explained

| Status | What it means |
|--------|---------------|
| `draft` | Hidden from customers, work in progress |
| `active` | Visible to customers, available for purchase |
| `inactive` | Not available, hidden from shop |

## Creating a product

1. Click **New Product** in the toolbar
2. Fill in at minimum: Title, Slug, Price
3. Select categories (optional but recommended)
4. Set status to `draft` while you're still working, `active` when ready
5. Click **Save**

## Categories

Products can belong to **multiple categories** at once. On the product edit page, you see checkboxes for all categories in your organization.

Assigning a product to a category lets customers browse and filter by category in the shop.

> For categories to appear in the product form, you must first create them under **Admin → Categories**.

## Product images

Below the product form, there is an **Images** section:

1. Click **Choose file** and select an image (JPG, PNG, WebP, GIF — max 5MB)
2. Add an optional **alt text** (important for accessibility and SEO)
3. Check **Set as primary** if this is the main product photo
4. Click **Upload Image**

Images are stored in Supabase Storage (a free, built-in storage service). The primary image is shown as the product thumbnail in listings.

To delete an image, click the **Delete** button on its thumbnail. To change which image is primary, click **Set Primary** on the one you want.

## Searching and filtering

On the products list:
- **Search box** — searches by product title
- **Status filter** — shows only draft, active, or inactive products
- **Category filter** — shows only products in a specific category

## Deleting a product

On the product edit page, scroll to the bottom and click **Delete**. You will be asked to confirm. Deletion is permanent.

> **Warning**: Deleting a product also removes its inventory records and category assignments. Orders that already reference this product are not affected.
