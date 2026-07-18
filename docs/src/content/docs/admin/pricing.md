---
title: Pricing & Coupons
description: How to set up discount rules and coupon codes.
---

## Where to find pricing

Go to **Admin → Pricing** (`/admin/pricing`). The page has three tabs:

| Tab | What's here |
|-----|-------------|
| **Pricelists** | Price lists (e.g. wholesale, VIP pricing) |
| **Discounts** | Discount rules applied automatically |
| **Coupons** | Coupon codes customers enter at checkout |

## Discount rules

A discount rule defines how a discount is calculated.

| Field | Description |
|-------|-------------|
| Name | Internal name (e.g. "Summer 10% Off") |
| Type | `percentage` or `fixed` amount |
| Value | Number — 10 means 10% or 10 Kč depending on type |
| Active | Whether this rule is currently in effect |
| Applies to | `all` products or specific categories |
| Start / End date | Optional date range |

### Types

- **percentage**: reduces price by a percentage (e.g. 10% off)
- **fixed**: reduces price by a fixed amount (e.g. 50 Kč off)

## Coupon codes

A coupon code is a string customers enter to apply a discount. Each coupon links to a **discount rule** that defines how the discount works.

| Field | Description |
|-------|-------------|
| Code | The code customers type (e.g. `SUMMER20`) — always uppercase |
| Discount rule | Which rule applies when this code is used |
| Active | Whether this code can be used right now |
| Max uses | Limit on total redemptions (leave blank for unlimited) |
| Uses count | How many times this code has been used (read-only) |

### Creating a coupon

1. Go to **Pricing → Coupons → New Coupon**
2. Enter the **code** (e.g. `WELCOME10`)
3. Select the **discount rule** it applies
4. Set **max uses** if you want to limit redemptions
5. Make sure **Active** is checked
6. Click **Save**

> Coupon codes are automatically uppercased.

### Duplicate codes

If you try to create a coupon with a code that already exists in your organization, you get a form error. Codes must be unique per organization.

## Pricelists

Pricelists allow different pricing for different customer groups (e.g. wholesale customers pay a different price than retail customers). This feature is in the admin but the full customer-group assignment integration is on the roadmap.
