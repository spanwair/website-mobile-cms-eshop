# JabkoLevně.cz - Complete Website Design Document

> **Purpose:** This document serves as a comprehensive design specification for implementing the JabkoLevně.cz e-commerce website. Every section, block, layout, and interaction is documented for a future development agent.  
> **Note:** The entire website is powered by an administration panel. All content, products, pages, navigation items, banners, team members, blog posts, and settings must be editable from the admin dashboard.

---

## Table of Contents

1. [Global Design System](#1-global-design-system)
2. [Header / Navigation](#2-header--navigation)
3. [Mega Menu](#3-mega-menu)
4. [Homepage](#4-homepage)
5. [Category / Product Listing Pages](#5-category--product-listing-pages)
6. [Product Detail Page](#6-product-detail-page)
7. [Cart Page](#7-cart-page)
8. [Content Pages](#8-content-pages)
9. [Blog](#9-blog)
10. [Footer](#10-footer)
11. [Administration Requirements](#11-administration-requirements)
12. [Page Routing Map](#12-page-routing-map)

---

## 1. Global Design System

### 1.1 Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#7CB342` (Lime Green) | Brand color, CTAs, badges, highlights, links hover, price tags, status indicators |
| `--color-primary-dark` | `#689F38` | Primary hover states |
| `--color-secondary` | `#333333` | Headings, body text, dark backgrounds |
| `--color-background` | `#FFFFFF` | Main page background |
| `--color-background-alt` | `#F5F5F5` | Alternate sections, cards background |
| `--color-border` | `#E0E0E0` | Borders, dividers, input outlines |
| `--color-text-primary` | `#212121` | Main body text |
| `--color-text-secondary` | `#757575` | Secondary text, descriptions, meta info |
| `--color-text-muted` | `#9E9E9E` | Placeholders, disabled states |
| `--color-success` | `#4CAF50` | Success messages, in-stock |
| `--color-warning` | `#FF9800` | Warnings, limited stock |
| `--color-error` | `#F44336` | Errors, out of stock, sale prices |
| `--color-badge-new` | `#7CB342` | "Nové" (New) badge |
| `--color-badge-sale` | `#F44336` | Sale/discount badge |
| `--color-badge-state-a` | `#4CAF50` | State A badge |
| `--color-badge-state-b` | `#FF9800` | State B badge |
| `--color-badge-state-c` | `#9E9E9E` | State C badge |

### 1.2 Typography

| Element | Font | Weight | Size | Line Height | Letter Spacing |
|---------|------|--------|------|-------------|----------------|
| H1 (Page titles) | System sans-serif / Inter | 700 | 32px | 1.2 | -0.02em |
| H2 (Section titles) | System sans-serif / Inter | 700 | 28px | 1.3 | -0.01em |
| H3 (Card titles) | System sans-serif / Inter | 600 | 20px | 1.4 | 0 |
| H4 (Subsection) | System sans-serif / Inter | 600 | 18px | 1.4 | 0 |
| Body | System sans-serif / Inter | 400 | 16px | 1.6 | 0 |
| Body Small | System sans-serif / Inter | 400 | 14px | 1.5 | 0 |
| Caption | System sans-serif / Inter | 400 | 12px | 1.4 | 0.02em |
| Price (Current) | System sans-serif / Inter | 700 | 18px | 1.2 | 0 |
| Price (Original/Strikethrough) | System sans-serif / Inter | 400 | 14px | 1.2 | 0 |
| Nav Link | System sans-serif / Inter | 500 | 14px | 1 | 0 |
| Button | System sans-serif / Inter | 600 | 14px | 1 | 0.02em |

### 1.3 Spacing System

| Token | Value |
|-------|-------|
| `--space-xs` | 4px |
| `--space-sm` | 8px |
| `--space-md` | 16px |
| `--space-lg` | 24px |
| `--space-xl` | 32px |
| `--space-2xl` | 48px |
| `--space-3xl` | 64px |
| `--space-4xl` | 96px |

### 1.4 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Small buttons, badges |
| `--radius-md` | 8px | Cards, inputs, buttons |
| `--radius-lg` | 12px | Large cards, modals |
| `--radius-xl` | 16px | Hero sections, banners |
| `--radius-full` | 9999px | Pills, avatars |

### 1.5 Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle elevation |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.07)` | Cards hover |
| `--shadow-lg` | `0 10px 25px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 40px rgba(0,0,0,0.15)` | Mega menu |

### 1.6 Breakpoints

| Name | Width | Usage |
|------|-------|-------|
| Mobile | < 640px | Single column, hamburger menu |
| Tablet | 640px - 1024px | 2-column grids, condensed nav |
| Desktop | 1024px - 1280px | Full layout, 3-4 column grids |
| Wide | > 1280px | Max-width container, 4-5 column grids |

### 1.7 Container

- **Max-width:** 1280px
- **Padding:** 16px (mobile), 24px (tablet), 32px (desktop)
- **Centered:** Yes, with auto margins

### 1.8 Global Components

#### 1.8.1 Buttons

**Primary Button**
- Background: `--color-primary`
- Text: White, 14px, weight 600
- Padding: 12px 24px
- Border-radius: `--radius-md` (8px)
- Hover: Background `--color-primary-dark`, slight scale(1.02)
- Active: scale(0.98)
- Transition: all 200ms ease

**Secondary Button (Outline)**
- Background: transparent
- Border: 2px solid `--color-primary`
- Text: `--color-primary`, 14px, weight 600
- Padding: 10px 22px
- Border-radius: `--radius-md`
- Hover: Background `--color-primary`, text white

**Ghost Button**
- Background: transparent
- Text: `--color-text-primary`
- Padding: 8px 16px
- Hover: Background `--color-background-alt`

#### 1.8.2 Product Card

**Layout:** Vertical card with image on top, content below.
- **Card container:** Background white, border-radius `--radius-md`, border 1px `--color-border`
- **Image area:** Aspect ratio 1:1, object-fit contain, background `#F8F8F8`
- **Image hover:** Slight zoom (scale 1.05), transition 300ms
- **Badge overlay:** Positioned top-left of image area
  - Badge types: "Nové" (green), "Sleva" (red), State badges (A/B/C with respective colors)
  - Badge style: Pill shape (`--radius-full`), padding 4px 12px, font 12px bold, white text
- **Content area:** Padding 16px
  - Product name: 16px, weight 600, 2-line clamp, color `--color-text-primary`
  - State indicator: Small pill badge showing condition (A, B, C, Nové, Zánovní)
  - Price row: Current price in `--color-primary` bold 18px; original price struck through in `--color-text-muted` 14px if on sale
  - Storage/variant info: 14px `--color-text-secondary`
- **Hover state:** Shadow `--shadow-md`, border color `--color-primary` at 30% opacity
- **Click:** Navigates to product detail page

#### 1.8.3 Breadcrumb

- Separator: `/` character
- Current page: Not clickable, `--color-text-primary`
- Parent pages: Clickable, `--color-text-secondary`, hover `--color-primary`
- Font: 14px, weight 400
- Padding: 16px 0

---

## 2. Header / Navigation

### 2.1 Top Bar (Announcement Bar)

- **Position:** Fixed or static at very top
- **Height:** ~40px
- **Background:** `--color-primary`
- **Content:** Rotating promotional messages or static announcement
- **Text:** White, 14px, centered
- **Dismissible:** Optional X button on right
- **Admin editable:** Yes - text content, background color, visibility toggle, link

### 2.2 Main Header

- **Position:** Sticky on scroll (top: 0 after announcement bar)
- **Height:** ~70px
- **Background:** White with subtle bottom border (`--color-border`)
- **Shadow on scroll:** `--shadow-sm`
- **Layout:** Flexbox, space-between, vertically centered
- **Z-index:** 1000

#### Left Section
- **Logo:** "jabkolevně" wordmark with green leaf accent on the "ě"
  - The "ě" character has a small green leaf/dot above it as brand identifier
  - Font: Custom or bold sans-serif, ~24px
  - Color: `--color-text-primary`
  - Link: Homepage
  - **Admin editable:** Logo image upload, or text + color settings

#### Center Section - Main Navigation
- **Layout:** Horizontal flex, gap 24px
- **Items:**
  1. **Nové** (with dropdown arrow) - Mega menu trigger
  2. **iPhone** - Link to /iphone/
  3. **iPad** - Link to /ipad/
  4. **Mac** - Link to /macbook/
  5. **Watch** - Link to /apple-watch/
  6. **Příslušenství** (with dropdown arrow) - Mega menu trigger
  7. **Audio** - Link to /audio/
- **Style:** 14px, weight 500, `--color-text-primary`
- **Hover:** `--color-primary`, underline animation (width 0 to 100%)
- **Active page:** `--color-primary` with underline
- **Dropdown arrow:** Chevron down icon, rotates 180deg on hover
- **Admin editable:** All nav items - name, URL, order, visibility, parent/child relationships

#### Right Section
- **Search icon:** Magnifying glass, opens search overlay/modal
- **Cart icon:** Shopping bag/cart icon with item count badge
  - Badge: Circle, `--color-primary` background, white text, positioned top-right of icon
  - Shows "0" when empty, hidden when 0 (or shows 0)
- **User account icon:** Person outline (if login system exists)
- **Icons size:** 24px
- **Icon hover:** `--color-primary`

### 2.3 Mobile Header

- **Hamburger menu:** Left side, 3-line icon
- **Logo:** Centered
- **Cart icon:** Right side
- **Search:** Inside hamburger menu or as icon
- **Mobile menu:** Full-screen overlay or slide-in from left
  - Background: white
  - Accordion-style expandable categories
  - Close button (X) top right

---

## 3. Mega Menu

Triggered by hovering "Nové" or "Příslušenství" in main nav.

### 3.1 "Nové" Mega Menu

- **Trigger:** Hover on "Nové" nav item
- **Layout:** Full-width dropdown below header, white background, `--shadow-xl`
- **Width:** 100% of container or viewport
- **Padding:** 32px
- **Columns:** 2 main columns

**Column 1: iPhone**
- Heading: "iPhone" (bold, 16px)
- List of links:
  - iPhone 17e
  - iPhone Air
  - iPhone 17 Pro Max
  - iPhone 17 Pro
  - iPhone 17
- Style: 14px, `--color-text-secondary`, hover `--color-primary`

**Column 2: iPad**
- Heading: "iPad" (bold, 16px)
- List of links:
  - iPad Pro M5 13"
  - iPad Pro M5 11"
  - iPad Air M4 13"
  - iPad Air M4 11"
  - iPad 11. gen 2025
- Style: Same as above

**Admin editable:** All menu items, headings, links, column structure

### 3.2 "Příslušenství" Mega Menu

- **Trigger:** Hover on "Příslušenství" nav item
- **Layout:** Full-width dropdown, white background, `--shadow-xl`
- **Columns:** 2 main columns

**Column 1: Pouzdra a kryty**
- Heading: "Pouzdra a kryty" (bold, 16px)
- Sub-heading: "Kryty na MacBook" (link)
- Sub-heading: "Kryty na iPad" (link)
- Sub-heading: "Kryty na iPhone" (non-link, or expandable)
  - Long list of iPhone model links (iPhone 17e down to iPhone 7, SE)
- Sub-heading: "Pouzdra na AirPods" (link)

**Column 2: Ochranná skla**
- Heading: "Ochranná skla" (bold, 16px)
- Sub-heading: "Ochranná skla na iPad" (link)
- Sub-heading: "Ochrana kamery" (link)
- Sub-heading: "Ochranná skla na iPhone" (non-link, or expandable)
  - Long list of iPhone model links (iPhone 17e down to iPhone 6)

**Admin editable:** All categories, subcategories, links, ability to add/remove models dynamically

### 3.3 "Více" Dropdown (Mobile / Condensed)

On desktop, additional nav items may be grouped under "Více":
- Proč si koupit použitý iPhone?
- Výkup
- Stavy produktů
- Blog
- O Nás
- Kontakt

**Style:** Standard dropdown, white background, `--shadow-lg`, padding 16px

---

## 4. Homepage

### 4.1 Hero Section

- **Layout:** Full-width, height ~500px (desktop), ~300px (mobile)
- **Background:** Large hero image or slider with overlay
- **Content:** Centered or left-aligned text block
- **Elements:**
  - Headline: Large H1, white or dark depending on image
  - Subheadline: 18-20px
  - CTA Button: Primary style
- **Slider:** If multiple hero banners, include dot indicators and auto-play
- **Admin editable:** 
  - Banner images (upload)
  - Headline text
  - Subheadline text
  - CTA text and link
  - Background overlay color/opacity
  - Slide order, add/remove slides

### 4.2 Category Quick Links / Featured Categories

- **Layout:** Horizontal scroll or grid of category cards
- **Cards:** 
  - Image (category thumbnail)
  - Category name below image
  - Border-radius `--radius-md`
  - Hover: Scale 1.03, shadow `--shadow-md`
- **Categories shown:** iPhone, iPad, Mac, Watch, Audio, Accessories
- **Admin editable:** Which categories to show, their order, images, names

### 4.3 Featured Products Section

- **Layout:** Section with heading + product grid
- **Heading:** "Nejprodávanější" or similar (H2, centered or left)
- **Grid:** 4 columns desktop, 2 tablet, 1 mobile
- **Gap:** 24px
- **Products:** Product cards (see 1.8.2)
- **"View all" link:** Bottom of section, centered, `--color-primary`
- **Admin editable:** 
  - Section title
  - Which products to feature (manual selection or auto: bestsellers/newest)
  - Number of products to show

### 4.4 Benefits / Trust Badges Section

- **Layout:** Horizontal row of 4-6 benefit items
- **Background:** `--color-background-alt` or white
- **Items:**
  - Icon (48px, `--color-primary`)
  - Title (16px bold)
  - Description (14px, `--color-text-secondary`)
- **Example benefits:**
  - 12 měsíců záruka
  - 14 dní na vrácení
  - 100% originální díly
  - Otestováno ve 100+ funkcích
  - Doprava zdarma
  - Osobní odběr Praha
- **Admin editable:** All benefit items - icon, title, description, visibility, order

### 4.5 Product Condition Explanation Section

- **Layout:** Two-column (image left, text right) or full-width cards
- **Heading:** "Stavy produktů" or "Jaký stav si vybrat?"
- **Content:** Brief explanation of product conditions (A, B, C, Nové, Zánovní)
- **CTA:** "Zjistit více" linking to /stavy-produktu/
- **Admin editable:** Content, images, CTA

### 4.6 Buyback / Výkup Promo Section

- **Layout:** Full-width banner or two-column
- **Background:** `--color-primary` or image with overlay
- **Content:**
  - Headline: "Prodej svůj starý iPhone"
  - Subtext: Brief description of buyback service
  - CTA: "Výkup" button
- **Admin editable:** All content, background, CTA link

### 4.7 Blog Preview Section

- **Layout:** Section heading + 3 blog post cards in a row
- **Blog card:**
  - Featured image (16:9 aspect ratio)
  - Date (caption style)
  - Title (H4, 2-line clamp)
  - Excerpt (2-3 lines, `--color-text-secondary`)
  - "Read more" link
- **Admin editable:** Which posts to show, section title

### 4.8 Newsletter Section

- **Layout:** Centered, contained width
- **Background:** `--color-background-alt`
- **Content:**
  - Headline: "Odebírej novinky"
  - Subtext: Brief description
  - Email input + Submit button (inline)
- **Input style:** Border `--color-border`, border-radius `--radius-md`, padding 12px 16px
- **Admin editable:** Content, background color

---

## 5. Category / Product Listing Pages

URL pattern: `/{category-slug}/`

Examples: `/iphone/`, `/ipad/`, `/macbook/`, `/apple-watch/`, `/audio/`, `/kryty-na-iphone-16-pro/`, `/ochranna-skla-na-iphone-15/`

### 5.1 Page Header

- **Breadcrumb:** Home > Category Name
- **Page Title:** H1, category name
- **Category description:** SEO text paragraph below title (optional, collapsible)

### 5.2 Filter & Sort Bar

- **Layout:** Sticky or static bar above product grid
- **Left side:** Filter button (mobile) or active filters
- **Right side:** Sort dropdown
  - Options: "Nejnovější", "Nejlevnější", "Nejdražší", "Nejprodávanější"
- **Style:** Background white, border-bottom, padding 16px

### 5.3 Filter Sidebar (Desktop) / Drawer (Mobile)

**Filters available:**
- **Model:** Checkbox list (e.g., iPhone 15 Pro, iPhone 14, etc.)
- **Stav (Condition):** Checkbox list (Nové, Zánovní, A, B, C)
- **Úložiště (Storage):** Checkbox list (64GB, 128GB, 256GB, etc.)
- **Barva (Color):** Color swatches
- **Cena (Price):** Range slider or min/max inputs
- **Dostupnost:** In stock only

**Style:**
- Filter group heading: 14px bold, uppercase, letter-spacing
- Filter options: 14px, checkbox + label
- Active filters: Pill badges with X to remove
- "Reset filters" button

**Admin editable:** Which filters are available per category, filter options

### 5.4 Product Grid

- **Layout:** CSS Grid
- **Columns:** 4 (desktop), 3 (tablet), 2 (mobile)
- **Gap:** 24px
- **Products:** Product cards (see 1.8.2)
- **Empty state:** "Žádné produkty nebyly nalezeny" with icon

### 5.5 Pagination

- **Layout:** Centered below grid
- **Elements:**
  - Previous page arrow (disabled on page 1)
  - Page numbers (1, 2, 3 ... 14)
  - Current page: `--color-primary` background, white text, circle
  - Other pages: `--color-text-secondary`, hover `--color-primary`
  - Next page arrow
  - "Nacházíte se na straně X z Y" text above or below
- **Style:** Gap 8px between items

### 5.6 SEO Text Block

- **Position:** Below pagination
- **Content:** Long-form descriptive text about the category
- **Style:** 16px body text, max-width for readability
- **Admin editable:** Full text content

---

## 6. Product Detail Page

URL pattern: `/{product-slug}/`

Example: `/iphone-15-pro-128-gb/`, `/iphone-17-pro-max-256-gb/`

### 6.1 Breadcrumb

- Home > Category > Product Name

### 6.2 Product Gallery

- **Layout:** Left side (50% on desktop)
- **Main image:** Large, aspect ratio ~1:1, zoom on hover (magnify effect)
- **Thumbnail strip:** Below main image, horizontal scroll
  - 4-6 thumbnails
  - Active thumbnail: border `--color-primary`, 2px
  - Click to change main image
- **Navigation arrows:** Left/right on main image (if multiple images)
- **Image count indicator:** "1 / 5" style
- **Admin editable:** Product images (multiple upload, reorder, alt text)

### 6.3 Product Info (Right Side)

- **Product name:** H1, 24-28px, bold
- **Product condition badge:** Large pill badge (A, B, C, Nové, Zánovní) with color coding
- **Short description:** 1-2 sentences
- **Price block:**
  - Current price: Large, `--color-primary`, 28px bold
  - Original price: Strikethrough, `--color-text-muted`, 18px (if on sale)
  - Savings amount: "Ušetříte X Kč" in green badge
- **Availability:**
  - In stock: Green dot + "Skladem" text
  - Out of stock: Red dot + "Není skladem"
- **Key specs list:**
  - Model, Storage, Color, Battery health (if applicable)
  - Displayed as label-value pairs

### 6.4 Variant Selector

- **Storage selector:** Button group or dropdown
  - Active: `--color-primary` background, white text
  - Inactive: White background, border, hover border `--color-primary`
- **Color selector:** Color swatches
  - Active: Ring/border `--color-primary`, 2px
  - Inactive: Border `--color-border`
- **Condition selector:** If multiple conditions available for same model

### 6.5 Add to Cart Section

- **Quantity selector:** 
  - Minus button | Number input | Plus button
  - Min: 1, Max: based on stock
  - Style: Border `--color-border`, border-radius `--radius-md`
- **Add to cart button:**
  - Full width of info column
  - Primary button style
  - Icon: Shopping cart
  - Text: "Přidat do košíku"
  - Loading state: Spinner
  - Success state: "Přidáno ✓" briefly, then back to original
- **Buy now button:** (Optional) Secondary button below

### 6.6 Product Tabs

- **Layout:** Below main product info
- **Tabs:**
  1. **Popis (Description)** - Full product description, features
  2. **Parametry (Specifications)** - Technical specs table
  3. **Obsah balení (What's in the box)** - List of included items
  4. **Záruka a vrácení (Warranty & Returns)** - Warranty info
- **Tab style:** 
  - Horizontal tabs, border-bottom
  - Active: `--color-primary` border-bottom, bold text
  - Inactive: `--color-text-secondary`, hover `--color-text-primary`
- **Tab content:** Padding 24px top

### 6.7 Related Products / Accessories

- **Heading:** "Doporučujeme přikoupit" or "Podobné produkty"
- **Layout:** Horizontal scroll or 4-column grid
- **Products:** Product cards
- **Admin editable:** Which products to show (manual or auto: same category)

### 6.8 Recently Viewed

- **Heading:** "Nedávno jste prohlíželi"
- **Layout:** Horizontal scroll
- **Products:** Product cards (smaller variant)

### 6.9 Trust Elements on Product Page

- **Below add to cart:** Row of small trust icons + text
  - "12 měsíců záruka"
  - "14 dní na vrácení"
  - "100% originální"
  - "Doprava zdarma"
- **Style:** Small icons (20px) + 12px text, horizontal row, gap 16px

---

## 7. Cart Page

URL: `/kosik/`

### 7.1 Page Title

- H1: "Nákupní košík"

### 7.2 Empty Cart State

- **Icon:** Large shopping bag icon (64px, `--color-text-muted`)
- **Text:** "Váš košík je prázdný"
- **CTA:** "Pokračovat v nákupu" - Primary button linking to homepage or shop

### 7.3 Cart Items List

- **Layout:** Table (desktop) / Card stack (mobile)
- **Columns:**
  1. Product image (80x80px)
  2. Product name + variant info (storage, color, condition)
  3. Unit price
  4. Quantity selector (same as product page)
  5. Total price for line item
  6. Remove button (X icon)
- **Row style:** Border-bottom, padding 16px
- **Remove button:** X icon, `--color-text-muted`, hover `--color-error`

### 7.4 Cart Summary (Right Sidebar)

- **Layout:** Sticky sidebar on desktop, bottom on mobile
- **Content:**
  - **Mezisoučet (Subtotal):** Sum of line items
  - **Doprava (Shipping):** "Zdarma" or calculated
  - **Sleva (Discount):** If coupon applied, show discount amount
  - **Celkem k úhradě (Total):** Large, bold, `--color-primary`
- **Coupon input:** 
  - Text input + "Použít" button
  - Inline, border `--color-border`
- **Checkout button:**
  - Full width, primary button
  - Text: "Pokračovat k objednávce"
  - Links to checkout flow

### 7.5 Continue Shopping

- Link below summary: "← Pokračovat v nákupu"
- Style: `--color-primary`, hover underline

---

## 8. Content Pages

### 8.1 "Proč si koupit použitý iPhone?" (`/proc-si-koupit-pouzity-iphone/`)

**Layout:** Full-width content page with multiple sections

**Section 1: Hero**
- Large heading: "Proč si koupit použitý iPhone?"
- Subheading: "Šetříš peněženku i planetu"
- Description paragraph

**Section 2: Comparison Visual**
- Side-by-side comparison image
- Left: New iPhone with high price
- Right: Used iPhone with lower price + savings badge
- Green accent elements (leaf graphics)
- Badge showing condition (e.g., "A stav")
- Checklist of what's included (záruka, původní díly, otestováno, baterie, záruka, vrácení)

**Section 3: Benefits Grid**
- 6 benefit cards in 2-3 columns:
  1. "100% originální díl" - Icon + description
  2. "Baterie s kondicí 80-100 %" - Icon + description
  3. "Pečlivě otestováno ve více než 100 funkcích" - Icon + description
  4. "12 měsíců záruka" - Icon + description
  5. "Možnost vrácení do 14 dnů" - Icon + description
  6. "Podpora 7 dní v týdnu" - Icon + description
- Card style: White background, border-radius `--radius-md`, padding 24px, icon top (48px, `--color-primary`)

**Section 4: Savings Table**
- Heading: "Kolik ušetříš, když si koupíš použitý iPhone?"
- Table columns: Model, Přibližná cena nového, Naše cena použitého, Ušetříš
- Rows: iPhone 17 Pro, iPhone 16 Pro, iPhone 15 Pro, iPhone 14 Pro
- Footer note: "*Ceny jsou orientační a liší se podle konkrétního modelu a stavu."
- Table style: Striped rows, border-radius `--radius-md`, overflow hidden

**Section 5: CTA**
- Heading: "Připravený na chytřejší nákup? Vyber si svůj iPhone"
- Subtext: Contact info
- CTA Button: "Vyber si svůj iPhone" → links to /iphone/

**Section 6: Team Section**
- Heading: Team section (see 8.5 for full spec)
- Shows key team members with photos

**Section 7: FAQ Accordion**
- Heading: "Často se nás ptáte"
- Accordion items:
  - "Je použitý iPhone bezpečný?" (Answer about wiped data, no Apple ID)
  - "Můžu si iPhone vyzkoušet?" (Answer about store visit or 14-day return)
  - "Jaká je záruka?" (Answer about 12-month warranty)
  - "Proč je použitý iPhone levnější?" (Answer about depreciation)
- Accordion style: 
  - Question: 16px bold, padding 16px
  - Answer: 14px, `--color-text-secondary`, padding 16px
  - Border-bottom: `--color-border`
  - Expand/collapse: Chevron icon rotates

**Admin editable:** All text, images, table data, team members shown, FAQ items

### 8.2 "Výkup" (`/vykup/`)

**Layout:** Content page with sections

**Section 1: Hero**
- Heading: "Výkup"
- Subheading: "Prodej svůj starý iPhone"
- Description: "Získej férovou cenu za svůj starý telefon..."

**Section 2: Benefits**
- Two benefit cards side by side:
  1. "Telefon můžeš poslat" - Description of mail-in process
  2. "Telefon ti vrátíme zpět" - Description of free return if price not satisfactory

**Section 3: Other Devices**
- Heading: "Chceš prodat jiné zařízení než iPhone?"
- Subheading: "Nejšťavnatější výkup kompletního sortimentu Apple!"
- Grid of 4 device cards:
  - iPad (image + "Výkup až 30 000 Kč")
  - iMac (image + "Výkup až 100 000 Kč")
  - MacBook (image + "Výkup až 100 000 Kč")
  - Apple Watch (image + "Výkup až 15 000 Kč")
- Card style: Image top, text below, centered, border-radius `--radius-md`

**Section 4: Process Steps**
- Heading: "Jednoduchý proces výkupu"
- Two-column layout:
  - Left: "Online výkup" - Description + store interior image
  - Right: "Na pobočce v Praze" - Description + store interior image
- Images: Store photos showing iPhones on display stands

**Section 5: Trade-in Comparison**
- Two product cards side by side:
  - Left: "Vyměň staré..." - iPhone 12 64 GB with max buyback price (e.g., "6 500 Kč")
  - Right: "... za nové" - iPhone 15 Pro 128 GB with price (e.g., "5 490 Kč")
- Style: Product card style with price highlight

**Admin editable:** All content, images, prices, device types

### 8.3 "Stavy produktů" (`/stavy-produktu/`)

**Layout:** Content page explaining product conditions

**Section 1: Heading**
- H1: "Stavy produktů"

**Section 2: Condition Cards**
- Grid of condition cards, each containing:
  - Condition name (e.g., "Nerozbaleno", "Rozbaleno", "Zánovní", "Stav A", "Stav A-", "Stav A/B", "Stav B", "Stav C")
  - Description of what the condition means
  - Visual indicator or icon
- Card style: White background, border, border-radius `--radius-md`, padding 24px
- For Mac category specifically, conditions include:
  - Nerozbaleno: New, unopened, never activated
  - Rozbaleno: Opened but unused, exhibition piece
  - Zánovní: Like new, briefly displayed
  - Stav A: Very well preserved, display scratch-free
  - Stav A-: Great condition, one minor cosmetic detail
  - Stav A/B: Nice condition, minor signs of use
  - Stav B: Good technical condition, visible signs of use
  - Stav C: Fully functional, noticeable wear

**Admin editable:** All condition descriptions, ability to add/remove conditions

### 8.4 "O Nás" (`/o-nas/`)

**Layout:** Content page

**Section 1: Intro**
- Heading: "O nás"
- Subheading: "Kde nás najdete?"
- Paragraph describing the business
- Key points:
  - Sells new, like-new, and used iPhones, iPads, MacBooks, accessories
  - Goal: best quality at lowest price
  - Products divided into New, Like-new, Used (A/B/C states)
  - Always original, not refurbished or assembled
  - Physical store at Vodičkova 677/10, Prague 1
  - 2 minutes walk from Lazarská tram stop

**Section 2: Team Grid**
- Heading: Team section (or no heading, just grid)
- Grid: 3-4 columns desktop, 2 tablet, 1 mobile
- Team member card:
  - Photo (square or circle, transparent/PNG background - headshot style)
  - Name (bold, 16px)
  - Position (14px, `--color-text-secondary`)
  - Short bio (14px, `--color-text-secondary`)
- **Team members (admin editable list):**
  - Adam - Majitel a zakladatel
  - Filip - Provozní ředitel
  - Terka - Marketingová specialistka
  - Miška - Manažerka zákaznické podpory
  - Filip - Manažer reklamačního oddělení
  - Miška - Manažerka finančního oddělení
  - Adam - Prodejní specialista
  - Leon - Prodejní specialista
  - Jiří - Produktový specialista
  - Vojta - Specialista expedice
  - Nikča - Specialistka expedice
  - Věrča - Manažerka skladu
  - Kydyr - Specialista testování
- Photo style: Professional headshot, transparent PNG background (checkered pattern visible), person wearing white t-shirt, centered portrait

**Section 3: Store Visit CTA**
- Heading: "Zastav se u nás na prodejně"
- Description text about services available in-store
- Same section appears on multiple pages

**Admin editable:** All team members (add/remove/edit), photos, names, positions, bios. Store description text.

### 8.5 "Kontakt" (`/kontakt-2/`)

**Layout:** Two-column (info left, map/form right) or stacked

**Section 1: Heading**
- H1: "Kontakt"

**Section 2: Contact Info**
- **Adresa (Address):**
  - Label: "Adresa" (bold)
  - Value: "Vodičkova 677/10 Praha 1"
  - Link: "Zobrazit na mapě" → Google Maps
- **Otevírací doba (Opening Hours):**
  - Label: "Otevírací doba" (bold)
  - Value: "Po-Ne: 8:30 - 20:00"
- **Bankovní spojení (Bank Details):**
  - Label: "Bankovní spojení:" (bold)
  - Value: "Číslo účtu: 5470135359/0800"

**Section 3: Store Description**
- Heading: "Zastav se u nás na prodejně"
- Paragraph about in-store services (advice, pickup, complaints, buyback, viewing)

**Section 4: Services**
- Heading: "Služby na prodejně"
- Description text

**Section 5: Company Details**
- Heading: "Provozovatel e-shopu"
- Details:
  - JabkoLevně s.r.o., Vodičkova 677/10, Praha 1
  - IČO: 07178930
  - DIČ: CZ07178930
  - Spisová značka: C 296064/MSPH Městský soud v Praze
- **Korespondence & prodejna:**
  - Vodičkova 677/10, 110 00, Praha 1

**Section 6: Contact Methods**
- Phone: +420 737 565 577
- Email: info@jabkolevne.cz
- Social media links (if present)

**Admin editable:** All contact info, opening hours, company details, map embed

---

## 9. Blog

### 9.1 Blog Listing Page (`/blog/`)

**Layout:** Content page with article grid

**Section 1: Heading**
- H1: "Blog"

**Section 2: Article Grid**
- Layout: 2-3 columns desktop, 1 mobile
- Article card:
  - Featured image (16:9, border-radius `--radius-md` top)
  - Date (caption, `--color-text-muted`)
  - Title (H3, 2-line clamp)
  - Excerpt (2-3 lines, `--color-text-secondary`)
  - Author name (if shown)
  - "Read more" link or entire card clickable
- Card hover: Shadow `--shadow-md`, image slight zoom

**Section 3: Pagination**
- Same as product listing pagination
- "Nacházíte se na straně X z Y"
- Page numbers with prev/next

**Admin editable:** All blog posts, categories, featured images, author info

### 9.2 Blog Article Page (`/blog/{article-slug}/`)

Example: `/blog/jak-nejlepe-prodat-stary-iphone/`

**Layout:** Single column, centered content

**Section 1: Breadcrumb**
- Home / Blog / Article Title

**Section 2: Article Header**
- Title: H1
- Date: Below title, `--color-text-muted`
- Featured image: Full width, 16:9, border-radius `--radius-md`

**Section 3: Article Content**
- Rich text content with:
  - Headings (H2, H3)
  - Paragraphs
  - Images (centered, with captions)
  - Ordered/unordered lists
  - Bold/italic text
  - Links ( `--color-primary`, underline)
  - FAQ sections (accordion style within article)
- Content max-width: 720px for readability
- Line height: 1.8 for body text

**Section 4: FAQ Accordion (if present in article)**
- Heading: "FAQ: [Question]"
- Accordion style same as homepage FAQ

**Section 5: Related Articles**
- Heading: "Další články"
- 3 article cards in a row

**Section 6: Author Bio (optional)**
- Author photo + name + short bio

**Admin editable:** All article content, images, FAQ items, related articles, author

---

## 10. Footer

### 10.1 Main Footer

- **Background:** `--color-secondary` (#333333) or dark gray
- **Text color:** White / light gray
- **Padding:** 64px top, 32px bottom
- **Layout:** 4-5 columns desktop, stacked mobile

**Column 1: Brand**
- Logo (white version or same as header)
- Short tagline or description
- Social media icons (if applicable)
  - Facebook, Instagram, TikTok, etc.
  - Icon size: 24px, white, hover `--color-primary`

**Column 2: Shop**
- Heading: "Obchod" or "Kategorie"
- Links:
  - iPhone
  - iPad
  - Mac
  - Watch
  - Příslušenství
  - Audio
- Link style: 14px, light gray, hover white

**Column 3: Information**
- Heading: "Informace"
- Links:
  - Proč si koupit použitý iPhone?
  - Výkup
  - Stavy produktů
  - Blog
  - O Nás
  - Kontakt
- Link style: Same as above

**Column 4: Customer Service**
- Heading: "Zákaznický servis"
- Links:
  - Doprava a platba
  - Reklamace
  - Vrácení zboží
  - Časté dotazy (FAQ)
  - Obchodní podmínky
  - Ochrana osobních údajů
- Link style: Same as above

**Column 5: Contact (optional)**
- Heading: "Kontakt"
- Phone: +420 737 565 577
- Email: info@jabkolevne.cz
- Address: Vodičkova 677/10, Praha 1
- Opening hours: Po-Ne: 8:30 - 20:00

### 10.2 Payment Methods

- **Row of payment method icons:**
  - Credit cards (Visa, Mastercard)
  - Bank transfer
  - Cash on delivery (Dobírka)
  - Apple Pay (if applicable)
- Icon style: Grayscale or white, height 32px

### 10.3 Bottom Bar

- **Background:** Slightly darker than main footer
- **Padding:** 16px
- **Content:**
  - Left: "© 2026 JabkoLevně.cz. Všechna práva vyhrazena."
  - Right: "Vytvořeno s ❤️ v Praze" or similar
- **Text:** 12px, `--color-text-muted`

**Admin editable:** All footer columns, links, contact info, payment methods, copyright text

---

## 11. Administration Requirements

The entire website must be manageable from an admin dashboard. Below is the required admin structure:

### 11.1 Dashboard
- Overview cards: Total orders, revenue, products, customers
- Recent orders table
- Low stock alerts
- Quick action buttons

### 11.2 Products Management
- **Product list:** Table with filters, search, bulk actions
- **Add/Edit product form:**
  - Basic info: Name, slug, SKU, description, short description
  - Pricing: Regular price, sale price, cost price
  - Inventory: Stock quantity, SKU, barcode
  - Images: Multiple image upload with drag-and-drop reordering
  - Categories: Multi-select category tree
  - Attributes: Model, storage, color, condition (A/B/C/Nové/Zánovní)
  - Variants: Create variants based on attribute combinations
  - SEO: Meta title, meta description, URL slug
  - Visibility: Published, draft, hidden
  - Featured: Toggle for homepage display

### 11.3 Categories Management
- **Category tree:** Hierarchical view (drag to reorder)
- **Add/Edit category:**
  - Name, slug, parent category
  - Description (for category page SEO)
  - Image (for category cards)
  - Filters: Define which filters apply to this category
  - SEO fields

### 11.4 Orders Management
- **Order list:** Table with filters (status, date, customer)
- **Order detail:**
  - Customer info
  - Products ordered
  - Payment status
  - Shipping status
  - Order notes
  - Status updates

### 11.5 Pages Management (CMS)
- **Page list:** All static pages
- **Add/Edit page:**
  - Title, slug, content (rich text editor / block builder)
  - SEO fields
  - Template selection (default, full-width, landing page)
  - Visibility
- **Sections builder for homepage:**
  - Hero slider: Add/remove slides, upload images, set text/CTA
  - Featured products: Select products or set auto-rules
  - Benefits section: Add/remove benefit items
  - Category showcase: Select categories
  - Blog preview: Select posts
  - Newsletter section: Toggle visibility
  - Buyback promo: Toggle visibility, edit content

### 11.6 Blog Management
- **Post list:** Table with filters
- **Add/Edit post:**
  - Title, slug, excerpt, content (rich text)
  - Featured image
  - Author
  - Categories/Tags
  - Publish date
  - SEO fields
  - Status: Published, draft, scheduled

### 11.7 Team Members
- **Member list:** Grid or table
- **Add/Edit member:**
  - Name, position, bio
  - Photo upload (PNG with transparency preferred)
  - Display order
  - Active toggle

### 11.8 Navigation Management
- **Menu editor:** Drag-and-drop interface
- **Main menu:** Edit header navigation items
- **Mega menu:** Edit dropdown content, columns, links
- **Footer menu:** Edit footer link columns
- **Mobile menu:** Configure mobile navigation separately if needed

### 11.9 Settings
- **General:**
  - Store name, logo, favicon
  - Contact info (address, phone, email, hours)
  - Company details (IČO, DIČ, registration)
  - Bank account
- **Appearance:**
  - Primary color picker
  - Font selection
  - Logo upload (light/dark versions)
  - Custom CSS (optional)
- **Homepage:** Configure which sections are visible and their order
- **SEO:**
  - Default meta title/description
  - Google Analytics ID
  - Sitemap settings
- **Shipping:** Configure shipping methods and prices
- **Payment:** Configure payment gateways
- **Notifications:** Email templates, admin notifications

### 11.10 Media Library
- Centralized file manager
- Upload images, organize in folders
- Image optimization (auto-resize, WebP conversion)
- Alt text management

---

## 12. Page Routing Map

| URL Pattern | Page Type | Template |
|-------------|-----------|----------|
| `/` | Homepage | Homepage template |
| `/{category-slug}/` | Category listing | Category template |
| `/{product-slug}/` | Product detail | Product template |
| `/kosik/` | Cart | Cart template |
| `/blog/` | Blog listing | Blog list template |
| `/blog/{article-slug}/` | Blog article | Blog article template |
| `/proc-si-koupit-pouzity-iphone/` | Content page | Content template |
| `/vykup/` | Content page | Content template |
| `/stavy-produktu/` | Content page | Content template |
| `/o-nas/` | Content page | Content template |
| `/kontakt-2/` | Content page | Content template |
| `/hledat/?q={query}` | Search results | Search template |

---

## 13. Additional Notes for Implementation

### 13.1 Responsive Behavior
- All layouts must be fully responsive
- Mobile-first approach recommended
- Touch-friendly tap targets (min 44x44px)
- Horizontal scroll for product rows on mobile
- Accordion filters on mobile

### 13.2 Performance
- Lazy load images below the fold
- Optimize images (WebP format, responsive sizes)
- Minimize CLS (Cumulative Layout Shift)
- Fast page loads (< 3s on 3G)

### 13.3 SEO
- Semantic HTML structure
- Proper heading hierarchy (H1 → H2 → H3)
- Meta tags for all pages
- Structured data (JSON-LD) for products, organization, breadcrumbs
- XML sitemap
- Robots.txt
- Canonical URLs

### 13.4 Accessibility
- WCAG 2.1 AA compliance
- Proper alt text for images
- Keyboard navigation support
- Focus indicators
- ARIA labels where needed
- Color contrast ratios met

### 13.5 E-commerce Features
- Guest checkout option
- User account registration/login
- Order history
- Wishlist/Favorites (optional)
- Product reviews (optional)
- Related products algorithm
- Recently viewed products (localStorage or account-based)

### 13.6 Czech Localization
- All UI text in Czech
- Currency: CZK (Kč)
- Date format: DD.MM.YYYY
- Number format: Space as thousands separator, comma as decimal (e.g., "1 234,56 Kč")
- VAT included in prices

---

*Document generated based on thorough analysis of https://www.jabkolevne.cz/ and its subpages.*
*Last updated: 2026-07-23*
