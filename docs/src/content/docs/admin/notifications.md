---
title: Notifications
description: How the notification system works.
---

## What notifications are

The CMS has a built-in notification system for internal alerts. Notifications can be sent to specific users or all admins in an organization.

## Where to find notifications

Go to **Admin → Notifications** (`/admin/notifications`).

## Notification structure

| Field | Description |
|-------|-------------|
| Title | Headline of the notification |
| Body | Full message text |
| Type | `system_alert`, `order_update`, `low_stock`, or custom |
| Read/Unread | Whether the user has seen it |

## Unread notifications

Unread notifications:
- Show with an **Unread** badge in the table
- The row may be styled in **bold** for visibility

## Audit log

The **Audit Log** page (`/admin/audit`) shows a history of all data changes in the CMS:

| Column | Description |
|--------|-------------|
| Table | Which database table was changed |
| Action | INSERT, UPDATE, or DELETE |
| Actor | Which user made the change |
| When | Timestamp |
| Record ID | The affected row's ID |

### Filtering the audit log

Use the **Filter by table** dropdown to see only changes to a specific table. Click **Clear** to remove the filter.

The audit log is useful for:
- Seeing who deleted a product
- Tracking when an order status changed
- Reviewing what a team member changed
