---
title: Newsletter
description: Toggle the footer newsletter signup, manage subscribers, and export the subscriber list to CSV
---

The Newsletter page controls where the newsletter signup appears on your storefront and manages the people who have subscribed.
It is one tab of the [Store Settings](/docs/en/admin/settings-branding) group.

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 1024 | MANAGE_SETTINGS | Owner, Admin, Eshop Admin (with this bit) |

Without `MANAGE_SETTINGS` you are redirected to `/admin`.

## Visibility (`/admin/settings/newsletter`)

The top card toggles **footer newsletter enabled** (`store_configs.footer_newsletter_enabled`), which shows or hides the signup box in the storefront footer.
The card also links to [Homepage Layout](/docs/en/admin/settings-layout), where the separate `newsletter` homepage section is turned on or off - the two placements are independent.
Save writes through `updateStoreConfig`.

## Subscribers

Below the toggle, a stats row shows:

- **Active subscribers** - `countNewsletterSubscribers` (currently subscribed).
- **Total signups** - every row ever, including unsubscribed.
- An **Export CSV** button.

### Subscriber table

| Column | Description |
|---|---|
| Email | Subscriber email, bold. |
| Subscribed at | Signup date. |
| Status | Green "Subscribed" or amber "Unsubscribed" (derived from `unsubscribed_at`). |
| Actions | **Unsubscribe** / **Resubscribe** toggle, and **Delete** (with a `confirm()`). |

Unsubscribe/resubscribe flips `newsletter_subscribers.unsubscribed_at`; delete removes the row entirely.
An empty list shows a centered "no subscribers" row.

### CSV export (`/admin/settings/newsletter/export.csv`)

Returns `newsletter-subscribers.csv` with columns `email`, `subscribed_at`, `status` (`subscribed` / `unsubscribed`), one row per subscriber.
Values are CSV-escaped.
Guarded by the same `MANAGE_SETTINGS` bit (403 otherwise), scoped to the active party.

## Data & storage (cloud)

- **Tables:** `newsletter_subscribers` (`party_id`, `email`, `subscribed_at`, `unsubscribed_at`), `store_configs` (`footer_newsletter_enabled`).
- **Services:** `fetchNewsletterSubscribers`, `countNewsletterSubscribers`, `setNewsletterSubscriberStatus`, `deleteNewsletterSubscriber` (`newsletterService`); `fetchStoreConfig`, `updateStoreConfig` (`storeConfigService`).
- **Component:** `SettingsTabs`.
- Scoped to `ctx.partyId`.

## Related pages

- [Homepage Layout](/docs/en/admin/settings-layout) - toggles the `newsletter` homepage section (separate from the footer box)
- [Footer](/docs/en/admin/settings-footer) - the footer area where the signup box renders
