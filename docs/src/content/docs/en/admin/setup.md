---
title: Setup (waiting for an organization)
description: The holding page an eshop admin sees before an organization has been assigned to them
---

`/admin/setup` is a holding page.
It is where an [Eshop Admin](/docs/en/admin/users) lands when their account has admin access but no organization has been assigned to it yet.
Every other admin role is routed elsewhere before this page ever renders, so in practice only an invited eshop admin who is still waiting for a party sees it.

## Permission required

No permission bit is required.
The page renders with `userPermissions={0}`, so the sidebar shows only the always-visible entries.
Access is decided entirely by the role-based redirect chain below, not by a permission bit.

## Who reaches this page

The page runs [`requireAdminCtx`](/docs/en/admin/parties) and then applies a strict redirect chain.
The order matters, and only the last case reaches the visible card.

| Condition | Redirect | Why |
|---|---|---|
| No login session | `/login` | Must be signed in |
| `requireAdminCtx` returns `null` (role below Eshop Admin) | `/dashboard` | Pure customers have no admin panel |
| `ctx.partyId` is set (any accessible org) | `/admin` | Already configured, go straight to the dashboard |
| Owner with no party | `/admin/parties/new` | An owner must create the first organization |
| Self-registered Admin (role = ADMIN) with no party | `/admin/onboarding` | Admins walk the [onboarding wizard](/docs/en/admin/onboarding) instead of dead-ending here |
| Eshop Admin with no party | Renders the card below | This is the only role that genuinely has to wait for an invite |

## The waiting card

When the card renders it shows:

- A large building icon.
- A heading and an explanatory body sentence telling the user their account is not yet linked to an organization.
- A single **Go home** button that links back to the site root `/`.

There is no form and no action here.
The user cannot do anything except leave, because assigning them to an organization is done by an owner or admin from the [organization detail page](/docs/en/admin/parties).
Once someone invites this user into a party, their next visit to `/admin` finds `ctx.partyId` set and they are sent into the panel normally.

## Data & storage (cloud)

- Reads `profiles.role` for the signed-in user through `requireAdminCtx`.
- Reads the `parties` table to determine whether the user has any accessible organization (this is what fills `ctx.partyId` and `ctx.parties`).
- Writes nothing.

## Related pages

- [Onboarding](/docs/en/admin/onboarding) - where self-registered admins are sent instead of this page
- [Organizations](/docs/en/admin/parties) - where an owner or admin assigns a user to a party so they leave this page
- [Users](/docs/en/admin/users) - where system roles are changed
- [Dashboard](/docs/en/admin/dashboard) - the destination once an organization exists
