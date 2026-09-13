---
title: Team
description: Manage the team members shown on your about page - name, position, bio, photo, and order
---

The Team page manages the people shown on your storefront (typically the about page).
It sits under the **Team** tab of the CMS, alongside [Navigation](/docs/en/admin/cms-navigation), [Pages](/docs/en/admin/cms-pages), [Blog](/docs/en/admin/cms-blog), [FAQ](/docs/en/admin/cms-faq), and [Legal Pages](/docs/en/admin/cms-legal).

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 2048 | MANAGE_CMS | Owner, Admin, Eshop Admin (with this bit) |

Without `MANAGE_CMS` you are redirected to `/admin`.

## Page layout (`/admin/cms/team`)

The page is a single edit form on top of a list table - there is no separate create route.
Clicking **Edit** on a row reloads the same page with `?edit={id}` and fills the form; a **Cancel** link returns to the blank "add" state.

### Add / edit form

| Field | Column | Notes |
|---|---|---|
| Name | `team_members.name` | Required. |
| Position | `team_members.position` | Job title / role, e.g. "Zakladatelka a kytkářka". |
| Bio | `team_members.bio` | Short biography (2-row textarea). |
| Photo | `team_members.photo_url` | Chosen with the `ImagePicker` from the store [media library](/docs/en/admin/settings-content). |
| Sort order | `team_members.sort_order` | Lower numbers appear first. |
| Active | `team_members.is_active` | Unticking hides the member without deleting them. |

Submitting with a hidden `id` updates; without one, it creates. On success you return to `/admin/cms/team`.

### List table

Columns: Name, Position, Order, Active (shown as Active/Inactive), Actions (**Edit** / **Delete** with a `confirm()`).
An empty list shows a centered "no members" row.

Kytka z Beskyd seeds one member: Natálie Ruszová, "Zakladatelka a kytkářka".

## Data & storage (cloud)

- **Table:** `team_members` (`party_id`, `name`, `position`, `bio`, `photo_url`, `sort_order`, `is_active`).
- **Services:** `fetchTeamMembers`, `createTeamMember`, `updateTeamMember`, `deleteTeamMember` (`teamMemberService`); `fetchStoreMedia` for the photo picker.
- **Components:** `ImagePicker`, `CmsTabs`.
- Scoped to `ctx.partyId`.

## Related pages

- [Pages](/docs/en/admin/cms-pages) - the "about" content page where the team is usually surfaced
- [Homepage Content](/docs/en/admin/settings-content) - the media library the photo picker uses
