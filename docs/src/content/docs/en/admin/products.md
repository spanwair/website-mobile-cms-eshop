---
title: Products
description: Create, edit, and publish products - including the variant-group model, per-variant media and inventory, categories, conditions, and the featured flag
---

The Products section is the core of your catalog.
Every product belongs to one organization (party), can be placed in multiple [categories](/docs/en/admin/categories), carries an optional [condition](/docs/en/admin/product-conditions) label, is stocked through [Inventory](/docs/en/admin/inventory), and appears on the storefront once its status is `active`.
A product is always treated as a *group of variants*, even when it has only one - this is the mental model to keep while reading the rest of this page.

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 8 | MANAGE_PRODUCTS | Owner, Admin, Eshop Admin (with this bit) |

Without `MANAGE_PRODUCTS` you are redirected to `/admin`.
If you have no admin role at all you are redirected to `/dashboard`, and an eshop admin with no organization assigned is sent to `/admin/setup` (owner: `/admin/parties/new`).
The same `MANAGE_PRODUCTS` bit also gates [Reviews](/docs/en/admin/reviews) and [Product Conditions](/docs/en/admin/product-conditions).
Stock editing inside the product editor additionally needs `MANAGE_INVENTORY` (bit 64) - see [Inventory](/docs/en/admin/inventory).

## Product list (`/admin/products`)

The list page loads all products for the currently selected organization, 20 per page.

### Toolbar

- **Search box** - filters by product title (placeholder text comes from the localized `searchPlaceholder`).
- **Status filter** - dropdown with "All statuses", `active`, `draft`, `inactive`.
- **Category filter** - dropdown of every category in the org; only shown when at least one category exists.
- **Filter button** - submits the GET form; the current search, status, and category are preserved in the query string across pagination.
- **Total label** - shows the count of matching products, e.g. `12 products`.
- **New** button - links to `/admin/products/new`.

### Columns

| Column | Description |
|---|---|
| (thumbnail) | The primary image. If the primary media is a video it renders a muted inline `<video>` poster frame; if there is no media a small "No image" placeholder box is shown. |
| Name | Product title, bold. |
| SKU | Stock-keeping code, or an em-dash placeholder when empty. |
| Status | Color-coded badge - `badge-active` (active), `badge-draft` (draft), `badge-inactive` (inactive). |
| Price | The display price, formatted for the current language/currency. |
| Stock | Color-coded stock label (see below). |
| Actions | An **Edit** link to the product editor. |

### Stock column colors

The stock value shown here is derived from inventory, never typed by hand.

| Condition | Color | Label |
|---|---|---|
| stock is `null` (not tracked) | muted grey | "No stock tracking" |
| stock `<= 0` | red | "Out of stock" |
| stock `1-10` | amber/warning | `{n} in stock` |
| stock `> 10` | green/success | `{n} in stock` |

### Empty state and pagination

When no products match, a single centered row reads "No products".
When there is more than one page, Previous / Next links and a "Page X of Y (Total N)" indicator appear at the bottom.

## Creating a product (`/admin/products/new`)

### How to

1. Click **New** on the product list.
2. If your account can access more than one organization, pick the **Organization** from the selector at the top (single-org admins never see this field).
3. Fill in **Title** and **Price** (both required) and adjust the auto-suggested **Slug**.
4. Optionally set SKU, barcode, discount price, cost price, status, description, the **Featured** flag, and tick any **Categories**.
5. Click **Create**.
   You are redirected straight to the product editor, where you add media, variants, and stock.

### Field reference

| Field | Required | Column | Notes |
|---|---|---|---|
| Organization | Only if multi-org | `products.party_id` | Sets which org owns the product. |
| Title | Yes | `products.title` | Customer-facing name. |
| Slug | Yes | `products.slug` | URL-safe id, auto-filled from the title via the `SlugInput` component; must be unique within the org. |
| SKU | No | `products.sku` | e.g. `KZB-PODZ-BUK`. |
| Barcode | No | `products.barcode` | EAN-13 / UPC. |
| Price | Yes | `products.price` | Regular price. Once the product has variants this becomes a hidden dead field (see below). |
| Discount price | No | `products.discount_price` | Sale price; leave blank for none. |
| Cost price | No | `products.cost_price` | Internal cost for margin reporting; never shown to customers. |
| Status | Yes | `products.status` | `draft` / `active` / `inactive`. New products default to `draft`. |
| Description | No | `products.description` | Plain-text body. |
| Featured | No | `products.is_featured` | Includes the product in "featured products" storefront sections. |
| Categories | No | `product_categories` join table | Multi-select checkboxes; saved via `setProductCategories`. |

If no categories exist yet, the checkboxes are replaced by a prompt linking to [create a category](/docs/en/admin/categories) (the `/admin/categories/new` route).

### Pending-organization product cap

An organization that is not yet `active` (awaiting owner approval) is capped at a fixed number of products (`PENDING_ORG_PRODUCT_CAP`).
The hard limit is enforced by the DB trigger `enforce_pending_org_product_cap`; the create form runs a friendly pre-check and shows a localized "cap reached" error instead of the raw DB error when the count is already at the cap.

## Editing a product (`/admin/products/{id}`)

The editor stacks several independent forms, each posting an `action` back to the same URL.
Reading top to bottom: variants, the main product form, media, then the inventory panel.

### The variant group model

Every product is a group of variants, and at all times exactly one row is "in focus" (the selected row, marked with a green dot).
When there are real variants, one is selected by default (the first, or the one named in `?variant=`).
When there are none, the single product-level row plays that same role.
Whatever is in focus is what the media section and the inventory panel below target.

The variants panel (`ProductVariants` component) shows:

- A table of existing variants with reorder arrows, name (a link that selects that variant), price, active badge, **Edit variant**, and **Delete**.
- An add/edit form below it.

| Variant field | Column | Notes |
|---|---|---|
| Name | `product_variants.name` | e.g. `Střední (25-35 cm)`. Required. |
| Price | `product_variants.price` | The price customers actually pay for this variant. May be blank. |
| SKU | `product_variants.sku` | Per-variant code. |
| Active | `product_variants.is_active` | Toggles the variant's `badge-active` / `badge-inactive` state. |

Variant actions and their form `action` values:

- **Add** (`add_variant`) / **Save variant** (`update_variant`) - create or update; the form auto-switches to edit mode when a variant is selected, and an **Add** link resets it to a blank form (`edit_variant=new`).
- **Delete** (`delete_variant`) - removes the variant after a confirm dialog.
- **Reorder** (`move_variant`, direction `up`/`down`) - the up/down arrows swap `product_variants.sort_order` with the neighbouring row. The top row hides its up-arrow, the bottom row its down-arrow.

**Important pricing rule:** as soon as a product has at least one variant, the storefront always shows the *variant* price, never `products.price`.
So the editor hides the main Price and Discount price inputs and shows the note "Price is set by variants" instead - the product-level price becomes a dead field.
With zero variants, the product-level Price and Discount price inputs are shown and used.

Kytka z Beskyd example: "Podzimní věnec z bukového listí" is one product with three size variants - `Malý (15-25 cm)` 290, `Střední (25-35 cm)` 490, `Větší (36-46 cm)` 690 CZK - each carrying its own price and its own inventory row.

### Main product form

Same fields as the create form (Title, Slug, SKU, Barcode, Price/Discount unless variants exist, Cost price, Status, Description, Featured, Categories) plus:

| Field | Column | Notes |
|---|---|---|
| Condition | `products.condition_id` | Dropdown of the org's [product conditions](/docs/en/admin/product-conditions), plus a "No condition" option. For Kytka, made-to-order products carry the "Na zakázku" condition and in-stock ones carry none. |

**Save** writes the product and re-applies category assignments, then returns to the product list.
**Delete** (separate red button, confirm dialog) permanently removes the product.

### Status workflow

| Status | Meaning |
|---|---|
| `draft` | Hidden from customers; use while building the product. Default for new products. |
| `active` | Publicly visible and purchasable. |
| `inactive` | Hidden from the shop but retained - good for seasonal items. |

### Media: images and videos

The media section (`ProductImages` component) uploads directly to Supabase Storage and records rows in `product_images`.
Media is scoped to whatever variant is in focus:

- With a selected variant, its own media is shown first, and the shared (variant-less) group is listed underneath as the fallback that every variant without its own media inherits.
- A simple product with no variants just uses the shared group.

**Images** (`upload_image` action):

1. Click **Choose file** (accepts `image/jpeg, image/png, image/webp, image/gif`); multiple files are allowed.
2. Optionally set **Alt text** and tick **Set as primary**.
3. Click **Upload image**.
   Files are stored in the `product-images` bucket at `{party_id}/{product_id}/{variant_id or "shared"}/{timestamp}-{i}.{ext}`, and the public URL is written to `product_images.url`.
   Only the first file honours the "primary" tick.
4. On each stored image: **Set primary** (`set_primary` - sets `is_primary`, clearing it on the others) and **Delete** (`delete_image`, with confirm). The primary image carries a "Primary" badge.

**Videos** (`upload_video` action):

1. Click **Choose file** (accepts `video/mp4, video/webm, video/ogg, video/quicktime`); multiple allowed.
2. Click **Upload video**.
   Files go to the `product-videos` bucket with the same path scheme, and the row is written with `media_type = "video"`.
   Videos render as controls-enabled thumbnails and can be **Deleted** (confirm).

A small client script updates the file-picker label to the chosen filename, or "N files" for a multi-select.

### Inventory panel (inside the editor)

The bottom card mirrors the standalone [Inventory](/docs/en/admin/inventory) page but targets the single in-focus row.
It shows On hand / Reserved / Available / Min threshold / Max threshold stat tiles, out-of-stock and low-stock badges, and - only if you also hold `MANAGE_INVENTORY` - three forms:

- **On demand** checkbox (`set_on_demand`) - ticking it sets `inventory_items.track_inventory = false` so the item is always orderable.
- **Adjust stock** (`adjust_inventory`) - quantity (±), movement type (adjustment / purchase / return / damage), optional note.
- **Update thresholds** (`update_thresholds`) - min (low-stock) and max thresholds.

Recent stock movements (up to 5) are listed below.
See [Inventory](/docs/en/admin/inventory) for the full semantics of these fields.
If the in-focus row has no inventory record, the panel shows "No inventory record".

## Data & storage (cloud)

- **Tables:** `products` (party_id, condition_id, title, slug, sku, barcode, price, discount_price, cost_price, tax_rate, status, is_featured, is_visible, description, rating_avg, review_count), `product_variants` (name, sku, price, attributes, condition_id, is_active, sort_order), `product_images` (url, alt, is_primary, media_type, variant_id, sort_order), `product_categories` (product_id, category_id join), `inventory_items`, `stock_movements`, `product_conditions`.
- **Storage buckets:** `product-images` and `product-videos`, path `{party_id}/{product_id}/{variant_id|"shared"}/{timestamp}-{i}.{ext}`.
- **Services:** `productService` (`fetchProducts`, `createProduct`, `updateProduct`, `deleteProduct`, `setProductCategories`), `productImageService` (add/delete/setPrimary image, add/update/delete/reorder variant), `inventoryService`, `productConditionService`, `categoryService`.
- **DB triggers referenced:** `ensure_variant_inventory_item` / `create_default_inventory_item` auto-create inventory rows; `enforce_pending_org_product_cap` enforces the pending-org product cap.
- All queries are scoped to `ctx.partyId` so one org can never see another's catalog.

## Related pages

- [Categories](/docs/en/admin/categories) - organize products into a browsable, nav-visible hierarchy
- [Product Conditions](/docs/en/admin/product-conditions) - the labels the Condition dropdown chooses from
- [Inventory](/docs/en/admin/inventory) - stock per variant, thresholds, on-demand, stock movements
- [Reviews](/docs/en/admin/reviews) - moderate customer reviews (same MANAGE_PRODUCTS bit)
- [Pricing](/docs/en/admin/pricing) - discounts and coupons that reference products
- [Orders](/docs/en/admin/orders) - orders contain product line items
