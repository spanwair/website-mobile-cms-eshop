---
title: Onboarding
description: The welcome wizard and setup tutorial that guide a new self-registered admin from an empty organization to a live shop
---

Onboarding is the two-step flow that a **self-registered admin** walks the first time they use the panel.
It is the path taken by someone who signed up organically and became an Admin (role = 4), as opposed to staff invited into an existing organization.
The flow has a welcome hub at `/admin/onboarding` and a setup checklist at `/admin/onboarding/tutorial`.

Owners and eshop admins never see these pages.
An owner is sent to [create an organization](/docs/en/admin/parties) directly, and an eshop admin with no party waits on the [setup page](/docs/en/admin/setup).

## Permission required

Neither onboarding page requires a permission bit.
The hub renders with `userPermissions={0}` and the tutorial renders with full permissions (`0xffff`) so its call-to-action buttons all resolve.
Access is controlled by role and by whether an organization and its first content exist, not by permission bits.

## Welcome hub (`/admin/onboarding`)

This is the first screen a brand-new admin sees.

### Who reaches it

| Condition | Redirect |
|---|---|
| No login session | `/login` |
| `requireAdminCtx` returns `null` | `/dashboard` |
| `ctx.partyId` already set | `/admin` (nothing to onboard) |
| Role is not exactly ADMIN | `/admin/setup` (owner and eshop admin have their own paths) |
| Self-registered admin, no party | Renders the welcome card |

### What it shows

- A rocket icon and a welcome title and intro.
- Three "step" cards explaining what onboarding will cover (create your organization, add your catalog, brand your shop).
- A single primary button, **Create organization**, which links to `/admin/parties/new?onboarding=1`.

The `?onboarding=1` flag is carried through the whole flow.
It tells the [new-organization form](/docs/en/admin/parties) and the organization detail page that they are being visited mid-onboarding, so they surface a link back into the tutorial instead of behaving like a normal standalone visit.

## Setup tutorial (`/admin/onboarding/tutorial`)

Once the admin has created their organization they land on the tutorial, a live checklist that tracks real progress against the database.

### Who reaches it

| Condition | Redirect |
|---|---|
| No login session | `/login` |
| `requireAdminCtx` returns `null` | `/dashboard` |
| No `ctx.partyId` | `/admin/parties/new` if owner, otherwise `/admin/setup` |
| Otherwise | Renders the checklist |

In addition, the [Dashboard](/docs/en/admin/dashboard) actively forces admins back here.
Any time a role = ADMIN user with a party visits `/admin` while their organization has **zero categories or zero products**, they are redirected to `/admin/onboarding/tutorial`.
This means an admin cannot see an empty dashboard mid-setup, no matter how many times they log back in.
The redirect stops firing automatically once at least one category and one product exist.

### The checklist

The page loads the current party and counts its categories and products, then renders three steps.

| Step | Marker | Completion check | Button |
|---|---|---|---|
| 1. Create a category | Turns to a green check when done, row dims to 70% opacity | At least one row in `categories` for this party | **Create category** to [`/admin/categories/new`](/docs/en/admin/categories) |
| 2. Add a product | Turns to a green check when done | At least one row in `products` for this party | **Add product** to [`/admin/products/new`](/docs/en/admin/products) |
| 3. Brand your shop | Always shown as step 3, never auto-completed | Not tracked | **Go to branding** to [`/admin/settings/branding`](/docs/en/admin/settings-branding) |

Completed steps show a "done" label instead of their button.
A **Finish** button at the bottom links to `/admin`.

### Pending-approval note

If the organization's status is still `pending_approval`, an extra note appears above the checklist.
It reminds the admin that their shop is not yet live to customers and is waiting for an owner to approve it.
See [Organizations](/docs/en/admin/parties) for the approval workflow and who can perform it.

## The onboarding banner on the dashboard

Non-admin roles are never hard-redirected into onboarding.
Instead, an eshop admin who holds the [Products](/docs/en/admin/products) permission but whose organization still has no categories or products sees a dismissable-by-completion banner on the [dashboard](/docs/en/admin/dashboard).
The banner links to the same `/admin/onboarding/tutorial` checklist and disappears once the catalog is no longer empty.

## Data & storage (cloud)

- Reads `profiles.role` and the `parties` table through `requireAdminCtx`.
- The tutorial reads the current party via `fetchParty` and runs `count` queries against `categories` and `products` filtered by `party_id`.
- The new-organization button writes to `parties` (see [Organizations](/docs/en/admin/parties)).
- No data is written by the onboarding pages themselves.

## Related pages

- [Setup](/docs/en/admin/setup) - the equivalent holding page for an eshop admin waiting on an invite
- [Organizations](/docs/en/admin/parties) - where the org is actually created and later approved
- [Categories](/docs/en/admin/categories) - checklist step 1
- [Products](/docs/en/admin/products) - checklist step 2
- [Store Settings](/docs/en/admin/settings-branding) - checklist step 3 (branding)
- [Dashboard](/docs/en/admin/dashboard) - hosts the onboarding banner and forces admins back into the tutorial while the catalog is empty
