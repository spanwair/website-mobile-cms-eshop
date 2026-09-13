---
title: Domains
description: Attach and verify a custom domain for your storefront using a DNS TXT record
---

The Domains page lets you attach a custom domain (e.g. `kytkazbeskyd.cz`) to your storefront and prove you own it with a DNS TXT record.
Until you attach a custom domain, your storefront lives at the platform path `/eshop-{slug}`.
It is one tab of the [Store Settings](/docs/en/admin/settings-branding) group.

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 1024 | MANAGE_SETTINGS | Owner, Admin, Eshop Admin (with this bit) |

Without `MANAGE_SETTINGS` you are redirected to `/admin`.

## Adding and verifying a domain (`/admin/settings/domains`)

### How to

1. Type the domain (it is lowercased and trimmed) and click **Add domain**.
   A `store_domains` row is created with a random `verification_token`, status **Pending**.
2. In your DNS provider, create the TXT record the page shows you:
   `TXT {VERIFICATION_SUBDOMAIN}.{your-domain} = {verification_token}`.
3. Once DNS has propagated, click **Verify**.
   The server does a live TXT lookup (`verifyDomainTxtRecord`); on a match the domain flips to **Verified**, otherwise you get a "verify" hint to try again.
4. To detach a domain, click **Remove** (with a `confirm()` dialog).

### Table columns

| Column | Description |
|---|---|
| Domain | Monospaced domain name. |
| Status | Green "Verified" or amber "Pending". Pending rows also print the exact TXT record to add. |
| Added | Creation date. |
| Actions | **Verify** (pending only) and **Remove**. |

An empty list shows a centered "no domains" row.

## Data & storage (cloud)

- **Table:** `store_domains` (`party_id`, `domain`, `verification_token`, `verified`, `created_at`).
- **Services:** `fetchStoreDomains`, `getStoreDomain`, `addStoreDomain`, `verifyStoreDomain`, `removeStoreDomain` (`storeConfigService`).
- **Helpers:** `verifyDomainTxtRecord`, `VERIFICATION_SUBDOMAIN` from `domainVerification`.
- **Component:** `SettingsTabs`.
- Scoped to `ctx.partyId`.

## Related pages

- [Branding](/docs/en/admin/settings-branding) - your brand identity that the custom domain will front
- [Multi-Tenant Architecture](/docs/en/architecture/multi-tenancy) - how domains and `/eshop-{slug}` paths route to the right org
