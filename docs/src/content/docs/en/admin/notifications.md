---
title: Notifications
description: The always-visible per-user notification inbox in the admin panel
---

Notifications at `/admin/notifications` is your personal inbox inside the admin panel.
It lists system messages addressed to your account, such as invitations and status changes.
It is the one admin page that is always reachable, which is why the [dashboard](/docs/en/admin/dashboard) redirects here when a user lacks the dashboard permission.

## Permission required

None.
The page has permission bit `0`, so its sidebar entry is always rendered for any admin, and no permission check gates the page body.
The only access requirements are a valid login session and an admin context.

| Condition | Redirect |
|---|---|
| No login session | `/login` |
| `requireAdminCtx` returns `null` | `/dashboard` |
| Otherwise | Renders the inbox |

## The notification table

Notifications are listed newest information first in a single table.

| Column | Description |
|---|---|
| Timestamp | When the notification was created, shown as a full localized date and time in small muted text |
| Type | The machine notification type, shown in monospace (for example an invite or approval type) |
| Title | The notification title, or a dash if none |
| Message | The notification body text in muted type, or a dash if none |
| Status | A badge reading **Unread** (green) or **Read** (grey) |

Unread rows are rendered in bold to draw the eye.
There is no filter, search, pagination, or mark-as-read control on this page; it is a straight read-only list.
If you have no notifications, a centered empty-state message fills the table.

## Scope

This inbox is **per user, not per organization**.
The list comes from `fetchUserNotifications` called with your own user id, so switching the active organization does not change what you see here.
Notifications follow you across every party you belong to.

## Data & storage (cloud)

- Reads the `notifications` table filtered to the signed-in user, via `fetchUserNotifications`.
  Columns surfaced: `created_at`, `type`, `title`, `body`, and `read_at` (which drives the read/unread badge and bold styling).
- Reads `profiles` and `parties` only through `requireAdminCtx` for the surrounding layout.
- The page writes nothing.

## Related pages

- [Dashboard](/docs/en/admin/dashboard) - redirects here for admins who lack the VIEW_DASHBOARD bit
- [Organizations](/docs/en/admin/parties) - invitations that generate notifications originate here
- [Audit log](/docs/en/admin/audit) - the organization-wide activity record, distinct from this per-user inbox
