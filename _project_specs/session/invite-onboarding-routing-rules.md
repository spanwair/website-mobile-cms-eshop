# Invite vs Onboarding routing rules

Incident: a user invited as Admin to another company set their password/name and landed on
`/admin/onboarding` instead of the inviting company.
Root cause: Admin invites embedded no `pending_party_id`, so the invitee got zero
`user_party_roles` rows and `requireAdminCtx()` returned `partyId = null`, which routes to
`/admin/setup` and from there (role = ADMIN) to `/admin/onboarding`.
Fixed in: `website/src/pages/admin/parties/[id].astro`, `website/src/pages/admin/users/new.astro`,
`website/src/pages/auth/callback.astro`, `website/src/pages/admin/index.astro`,
migration `20260917000004_invited_admin_party_membership.sql`, E2E `17-01`/`17-05`.

## The two onboarding surfaces (do not confuse them)

| URL | Who it is for | Content |
|-----|---------------|---------|
| `/admin/onboarding` | ONLY organic signups (self-registered ADMIN, zero parties) | Welcome hub with "Create organization" CTA |
| `/admin/onboarding/tutorial` | Organic admins while their catalog is empty (hard redirect); invited staff/admins of an empty org (banner link only) | Catalog checklist: categories, products, branding |

## Routing matrix (normative)

| Case | After auth / finish registration | Lands on |
|------|---------------------------|----------|
| Organic signup, no party, role ADMIN | login | `/admin/onboarding` (welcome hub) — the ONLY flow that may land here |
| Organic admin with party, catalog empty (0 categories OR 0 products) | any `/admin` visit | hard redirect `/admin/onboarding/tutorial` |
| Organic admin with party, catalog non-empty | any `/admin` visit | `/admin` dashboard |
| Invited NEW user (any system role incl. ADMIN), inviting party known | finish-registration submit | `/admin` of the INVITING party, `activePartyId` cookie pinned to it |
| Invited new ADMIN, inviting party has empty catalog | finish-registration submit | `/admin` dashboard + checklist banner (NEVER forced tutorial, NEVER welcome hub) |
| Invited EXISTING user (added to another org) | next login | their current `activePartyId` org; new org visible in party switcher |
| Legacy Admin invite (no party metadata, inviter has exactly 1 party) | finish-registration submit | recovered into inviter's party → `/admin` |
| Legacy Admin invite, inviter has 0 or 2+ parties | finish-registration submit | cannot recover → `/admin/onboarding`; inviter must re-invite |
| Eshop admin with no party (genuinely waiting) | any `/admin` visit | `/admin/setup` waiting room (only role that may sit here) |
| Owner without party | any `/admin` visit | `/admin/parties/new` |

## Invariant rules for future changes

1. Every invite sent from a party context MUST embed `pending_party_id` (that party).
   No exceptions for system role ADMIN — Admins need the membership row even though their
   permissions come from the system role (ALL_PERMISSIONS), not from a custom role.
2. Every new-user invite SHOULD embed `pending_role_id`. For Admin invites (no selectable
   role) use the highest-permission role as the membership FK placeholder.
3. `handle_new_user()` MUST create a `user_party_roles` row whenever a party is determinable:
   explicit metadata wins; else highest-permission role fills a missing role; else a
   single-party inviter determines a missing party. Never leave an invited user partyless.
4. `auth/callback` MUST upsert the membership idempotently AND pin `activePartyId` to the
   inviting party, so the invitee lands in the right org even with several memberships.
   The finish-registration step is the shared public registration page at `/login?invite=1`
   (NOT a bespoke set-password screen): the invitee is already authenticated, so it prefills +
   locks the email and calls `updateUser({ password })`, then forwards to `/admin`.
5. `/admin/onboarding` (welcome hub) MUST only ever be reached by partyless ADMINs.
   If an invited user lands there, rule 1–4 was violated — treat it as a bug, not UX.
6. `/admin` MUST hard-redirect to the tutorial ONLY for organic admins
   (`membership.invited_by` is NULL or self). Invited members get the banner instead.
7. Existing-user invites MUST also ensure membership, not just flip `profiles.role`.
   A system role without a party row is invisible to `requireAdminCtx()`.
8. E2E `17-01` (Admin invite → inviting-party dashboard, never onboarding) and `17-05`
   (legacy recovery) MUST stay green; extend them before changing any invite metadata.
