---
title: Organizations
description: Create, edit, approve, and staff organizations (parties), including seller mode, status rules, and the member invite flow
---

An **organization** (a "party" in the database) is the top-level container for a shop's data.
Products, categories, orders, customers, inventory, pricing, and CMS content all belong to exactly one organization.
This is how the platform keeps multiple eshops, such as [Kytka z Beskyd](/docs/en/admin/dashboard) and any other tenant, completely isolated from each other.

## Permission required

| Action | Requirement |
|---|---|
| View the organization list | MANAGE_USERS (2) |
| Open an organization detail page | MANAGE_USERS (2) **or** MANAGE_AUDIT (4096) |
| Edit organization info and status | MANAGE_AUDIT (4096) |
| Invite or remove members | MANAGE_USERS (2) |
| Create a new organization | Admin or Owner role (not a permission bit) |
| Approve a pending organization or set status `closed` | Owner only |

If you lack the needed bit the page redirects to `/admin`.
On the detail page, if you have neither MANAGE_USERS nor MANAGE_AUDIT you are redirected to `/admin`.
A non-owner who tries to open a party they do not belong to is sent back to `/admin/parties`.

## Organization list (`/admin/parties`)

The toolbar shows a count of organizations, and a **New Organization** button that appears only for Admins and Owners (role >= ADMIN).
Owners see every organization in the system; admins and eshop admins see only the parties they are assigned to.

| Column | Description |
|---|---|
| Name | Organization display name (bold) |
| Slug | URL-safe identifier, monospace, unique across the whole system |
| Company | Legal company name (`company_name`), or a dash |
| Seller Mode | Badge: **Own company** (neutral) or **Commission** (green) |
| Status | Color-coded badge: active, inactive, closed, or pending approval (amber) |
| Created | Creation date |
| Actions | **View** opens the detail page |

If there are no organizations, a centered empty-state row is shown.

## Creating a new organization (`/admin/parties/new`)

Only Admins and Owners reach this page; anyone below Admin is redirected to `/admin/parties`.
When opened with `?onboarding=1` (from the [onboarding wizard](/docs/en/admin/onboarding)) an intro banner appears and the success redirect carries the flag forward into the tutorial.

### Do you have an IČO?

The form opens with a radio toggle, **has_ico** (yes / no), that swaps between two field panels and decides the organization's seller mode.

**Yes - I have a company number (own company mode):**

| Field | Required | Notes |
|---|---|---|
| Company name | No | Has ARES autofill: typing a name shows live suggestions from the Czech business register |
| IČO | Yes (in this panel) | 8-digit company number; on blur it calls `/api/ares` to autofill name and VAT |
| VAT number | No | Auto-filled from ARES when available |
| Billing email | No | Email for billing notifications |

**No - I do not have a company number (Smalljobs commission mode):**

| Field | Required | Notes |
|---|---|---|
| Legal full name | Yes | The individual selling under the platform's commission arrangement |
| Address line 1 | Yes | Street address |
| City | Yes | |
| Postal code | Yes | |
| Bank account | Yes | Where net payouts are sent |
| Personal ID note | No | Optional free-text note |
| Commission terms accepted | Yes | Checkbox; the full commissionaire agreement is shown in an expandable box |

Both panels also share, at the top, **Name** (required) and **Slug** (auto-suggested from the name), and at the bottom two required platform legal checkboxes:

- **Privacy policy accepted** (required)
- **Platform terms accepted** (required)

### What happens on submit

Validation runs server-side:

- Name and slug must be present.
- Both privacy and terms checkboxes must be ticked, or you get a "legal required" error.
- In own-company mode, IČO is required.
- In commission mode, all of legal name, address, city, postal code, bank account, and the commission checkbox are required.

On success the organization is created with `createParty`:

- `seller_mode` is set to `own_company` (has IČO) or `smalljobs_commission` (no IČO).
- **Every new organization starts with status `pending_approval`** and stays hidden from the public storefront until an owner activates it.
  This is enforced by the `enforce_party_approval_transition` database trigger, so only an owner can move a party to `active`.
- `terms_accepted_at` and `terms_version` are stamped (current platform terms version).
- In commission mode, a commissionaire agreement is also recorded via `acceptCommissionaireAgreement`.

The new party id is stored in the `activePartyId` cookie so you are immediately working inside it, then you are redirected to the [detail page](#organization-detail-adminpartiesid).

## Organization detail (`/admin/parties/{id}`)

The detail page is a two-column layout.
At the top, success and error alerts appear, plus any pending-approval banner.

### Pending-approval banners

- **Owner** viewing a `pending_approval` org sees a banner with an **Approve** button.
  Clicking it (after a confirm dialog) runs the `approve_party` action and sets the status to `active`, making the shop live.
- **Creator (non-owner)** sees a read-only banner explaining the org is waiting for owner approval, plus a link into the [onboarding tutorial](/docs/en/admin/onboarding) when arriving via `?onboarding=1`.

### Left column - Organization info (requires MANAGE_AUDIT)

An editable form with:

| Field | Notes |
|---|---|
| Name | Required |
| Company name | |
| IČO | `company_ico` |
| VAT number | `vat_number` |
| Billing email | |
| Language | `cs` or `en`; controls the org's default content language |
| Slug | Editable slug input |
| Status | See the status rules below |
| Created | Read-only metadata |

**Status field rules** (this is where owner vs admin differs):

- Owner: a full dropdown of **active**, **inactive**, and **closed**.
  Only the owner ever sees the `closed` option, and only the owner can reopen a closed org.
- Non-owner, org is `closed`: the select is replaced by a read-only locked label, and the current status is submitted unchanged.
  Trying to change a closed org server-side returns the `errorClosedOrg` error.
- Non-owner, org is `pending_approval`: the select is replaced by a read-only locked label.
  A non-owner cannot move a pending org to active; attempting it returns the `errorPendingApprovalOrg` error.
- Otherwise (non-owner, active or inactive): a dropdown of **active** and **inactive** only.

Saving runs the `update_party` action.

### Left column - Seller Mode card

Below the info form, a **Seller Mode** card (component `PartySellerModeCard`) shows the current mode and its description.

- **Commission mode with an active agreement**: shows the agreement's active-since date and accepted terms version, a link to the [payout ledger](/docs/en/admin/payouts), and a **Revert** button.
  Revert (after confirm) runs `revoke_commission_agreement`.
- **Own-company mode**: shows a **Switch to commission** disclosure.
  Expanding it reveals the full agreement text plus a form (legal full name, address line 1, city, postal code, bank account, personal ID note, and a required terms checkbox).
  Submitting runs `accept_commission_agreement`.

Both seller-mode actions require MANAGE_AUDIT.

### Left column - Invite member (requires MANAGE_USERS)

A form to add someone to this organization.
See the [full invite flow](#invite-flow) below.

| Field | Notes |
|---|---|
| Email | Required |
| System role | Dropdown of roles you may assign, filtered to Eshop Admin and above but below Owner. Hidden if you cannot assign any |
| Role | The [custom role](/docs/en/admin/roles) to grant in this party. Populated from non-system roles |

A note explains the invite behaviour, and if you have no assignable system roles it points you to [Users](/docs/en/admin/users) instead.
Client-side script: when the system role is set to **admin**, the party-role dropdown is hidden and not required (an admin gets full permissions from the system role, so no custom role is needed).
For **eshop_admin** the custom role becomes required when roles exist.

### Right column - Members table

Lists all members of this organization with a count in the heading.

| Column | Description |
|---|---|
| Name | Member display name (or "unnamed") |
| Email | Member email |
| Role | Their custom role in this party, shown as a badge |
| Joined | Join date |
| (action) | **Remove** button |

**Remove** appears only if you have MANAGE_USERS and the row is not your own account.
It runs the `remove` action (after a confirm dialog), deleting that user's `user_party_roles` entry for this org.
Removing a member does not delete their account and does not touch their access to other organizations.

## Invite flow

The invite action branches on whether the email already exists and on the chosen system role.

- **Admin invite** (`system_role` = admin): no custom role is used; the admin gets full permissions from the system role.
- **Existing user**: if they are below Admin and already belong to a different org, you get the `errorUserInOtherOrg` error (an eshop-level user cannot span two orgs).
  Otherwise their `user_party_roles` entry is upserted, their `profiles.role` is raised to the chosen system role, and a notification email lists all their organizations.
  No sign-up link is sent because the account already exists.
- **New user**: an invite is issued.
  In development (`inviteUserByEmail`) Supabase GoTrue renders the invite template into Mailpit; in production (`generateLink` + Resend) a styled email with the action link is sent.
  Invitation metadata (`pending_party_id`, `pending_role_id`, `pending_system_role`, `invited_by`) is embedded so the account is wired up correctly when the user clicks through `/auth/callback` and sets a password.

Role assignment always respects `canAssignRole`: the submitted system role is only honoured if you are allowed to assign it.
See [Users](/docs/en/admin/users) for the assignment rules and [Roles](/docs/en/admin/roles) for creating the custom roles shown in the invite dropdown.

## Data & storage (cloud)

- `parties` table: `name`, `slug`, `company_name`, `company_ico`, `vat_number`, `billing_email`, `seller_mode`, `status`, `lang`, `created_at`, `terms_accepted_at`, `terms_version`.
  The `enforce_party_approval_transition` trigger restricts `pending_approval -> active` to owners.
- `user_party_roles` table: membership rows (`user_id`, `party_id`, `role_id`) for the members list, invites, and removals.
- `roles` table: custom (non-system) roles shown in the invite dropdown.
- `profiles` table: read/updated for invited users' `role` and `lang`.
- Commissionaire agreement records via `acceptCommissionaireAgreement` / `revokeCommissionaireAgreement` / `fetchCommissionaireAgreement`.
- `/api/ares` for company lookup, `/api/switch-party` for changing the active org.
- Email via `sendPartyInvitation`, `inviteUserByEmail` (dev), and `generateLink` (prod).

## Related pages

- [Onboarding](/docs/en/admin/onboarding) - the guided flow a self-registered admin uses to create their first org
- [Users](/docs/en/admin/users) - change existing users' system roles and org assignments
- [Roles](/docs/en/admin/roles) - create the custom roles offered in the invite form
- [Payouts](/docs/en/admin/payouts) - the ledger linked from the Seller Mode card
- [Billing](/docs/en/admin/billing) - cross-party fee and payout overview
- [Store Settings](/docs/en/admin/settings-branding) - branding and configuration for the selected org
