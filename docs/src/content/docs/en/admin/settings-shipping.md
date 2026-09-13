---
title: Shipping
description: Owner-only, platform-wide carrier configuration for PPL and Packeta, including sender address and pricing
---

The Shipping page configures the delivery carriers (PPL and Packeta) used across the platform.
Unlike the other settings pages, this one is **platform-wide, not per-organization**, and its output drives the shipping-label generation on [Orders](/docs/en/admin/orders).

## Permission required

This page is **owner-only**.
It is gated directly by `ctx.isOwner` (the same precedent as creating or closing an organization), **not** by the per-party `MANAGE_SETTINGS` bit - because carrier credentials and sender identity are platform-level, not something one org's admin should change.
Any non-owner is redirected to `/admin`.

## Carrier cards (`/admin/settings/shipping`)

The page renders one card per carrier returned by `fetchAllShippingConfigs` (PPL and Packeta), each a self-contained form.

### Mock mode notice

If the carrier's API credentials are missing from the environment, the card shows a **mock notice**.
PPL is in mock mode unless both `PPL_CLIENT_ID` and `PPL_CLIENT_SECRET` are set; Packeta is in mock mode unless `PACKETA_API_PASSWORD` is set.
In mock mode, label creation is simulated rather than booked with the real carrier.

### Fields per carrier

| Field | Column | Notes |
|---|---|---|
| Enabled | `shipping_configs.enabled` | Whether customers can pick this carrier at checkout. |
| Base price | `shipping_configs.base_price` | The default shipping charge. |
| Free above amount | `shipping_configs.free_above_amount` | Order total above which shipping is free; blank means never free. |
| Sender name | `shipping_configs.sender_name` | Required - the pickup/return name on the label. |
| Sender street | `shipping_configs.sender_street` | Required. |
| Sender city | `shipping_configs.sender_city` | Required. |
| Sender postal code | `shipping_configs.sender_postal_code` | Required. |
| Sender country code | `shipping_configs.sender_country_code` | Two letters, defaults to `CZ`. |
| Sender phone | `shipping_configs.sender_phone` | Optional. |
| Sender email | `shipping_configs.sender_email` | Optional. |

Each card saves independently via `updateShippingConfig`, keyed by the carrier `code`.

## Data & storage (cloud)

- **Table:** `shipping_configs` (one row per carrier: `code`, `display_name`, `enabled`, `base_price`, `free_above_amount`, `sender_*`).
- **Services:** `fetchAllShippingConfigs`, `updateShippingConfig` (`shippingConfigService`).
- **Environment:** `PPL_CLIENT_ID`, `PPL_CLIENT_SECRET`, `PACKETA_API_PASSWORD` decide real vs mock booking.
- **Component:** `CmsLayout` with `isOwner` passed through.

## Related pages

- [Orders](/docs/en/admin/orders) - the shipping label on an order is generated using this carrier and sender configuration
- [Badges](/docs/en/admin/settings-badges) - shipping badges that advertise these carriers on the storefront
- [Organizations](/docs/en/admin/parties) - owner-only, the other platform-level controls that live outside per-party permissions
