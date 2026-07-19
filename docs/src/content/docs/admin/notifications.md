---
title: Notifications
description: How to view and manage your admin notification inbox.
---

Notifications are internal alerts delivered to your admin account. They cover system events, order updates, and low-stock alerts. All admin roles can access notifications — no specific permission bit is required beyond being an admin.

## Permission required

Accessible to all admin roles (Owner, Admin, Eshop Admin). No specific permission bit needed.

## Notification list (`/admin/notifications`)

The page shows all notifications sent to your account in a table:

| Column | Description |
|---|---|
| Timestamp | When the notification was created |
| Type | Machine-readable event type (e.g. `order_update`, `low_stock`, `system_alert`) |
| Title | Headline of the notification |
| Message | Full notification body |
| Status | Read / Unread badge |

Unread notifications are displayed in **bold**. Click a notification row to mark it as read.

## Notification types

| Type | Triggered by |
|---|---|
| `system_alert` | System-level events (e.g. maintenance, configuration changes) |
| `order_update` | Order status changes (e.g. new order placed, order shipped) |
| `low_stock` | Inventory item drops to or below its low-stock threshold |
| Custom types | Any notification sent programmatically by your app or Edge Functions |

## Reading notifications

Notifications are personal — each admin sees only their own notifications. There is no shared inbox.

Marking a notification as read is done by clicking the row. There is no bulk "mark all as read" button in the current version.

## What to do with notifications

- **Order updates**: Navigate to [Orders](/admin/orders) to process the order
- **Low stock alerts**: Go to [Inventory](/admin/inventory) to restock the item
- **System alerts**: Review the message and take the indicated action or contact your Owner

## Related pages

- [Orders](/admin/orders) — process orders mentioned in order_update notifications
- [Inventory](/admin/inventory) — restock items mentioned in low_stock notifications
- [Audit Log](/admin/audit) — full history of data changes (requires MANAGE_AUDIT permission)
