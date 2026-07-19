---
title: Users
description: How to view team members and change their roles within your organization.
---

The Users page lists all members of your organization and lets you change their assigned roles. Use this page to promote, demote, or reassign team members. To invite new people to your organization, use [Organizations](/admin/parties) instead.

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 2 | MANAGE_USERS | Owner, Admin (with this bit) |

## User list (`/admin/users`)

The table shows every member of your current organization:

| Column | Description |
|---|---|
| Display name | Member's name |
| Email | Member's email address |
| Role | Color-coded badge showing current role |
| Joined | When they joined the organization |
| Change role | Dropdown + Apply button (hidden for your own row and for Owners) |

Your own row is marked with **(you)** and has no role dropdown — you cannot change your own role.

## Changing a user's role

1. Find the user in the table.
2. Open the **role dropdown** on their row and select the new role.
3. Click **Apply**.

The change takes effect immediately. The user will have the permissions of the new role on their next page load or API call.

## Role assignment rules

These rules are enforced in the code — you cannot bypass them through the UI:

| Rule | Detail |
|---|---|
| Cannot change own role | Your own row has no dropdown |
| Cannot change Owners | Owner rows have no dropdown — only Owners can be changed by other Owners |
| Admin can assign up to Admin | An Admin can change a user's role to anything up to and including Admin (peer assignment is allowed) |
| Cannot elevate above your own role | You cannot assign a role higher than your own |

## Role colors

| Role | Badge color | Permission level |
|---|---|---|
| Owner | Red/special | Full system access |
| Admin | Orange | All permissions in their org |
| Eshop Admin | Blue | Custom permission bitmask |
| User | Gray | No admin access |

## Users vs inviting new members

| Task | Where to do it |
|---|---|
| Change an existing member's role | This page (Users) |
| Invite a new person to the org | [Organizations](/admin/parties) → your org → Invite Member |
| Remove a member from the org | [Organizations](/admin/parties) → your org → Members table → Remove |

## Related pages

- [Organizations](/admin/parties) — invite new members and remove existing ones
- [Custom Roles](/admin/roles) — the roles available in the dropdown come from here
- [Role Hierarchy](/users/roles) — understand Owner / Admin / Eshop Admin / User
- [Permissions](/users/permissions) — what each permission bit grants
