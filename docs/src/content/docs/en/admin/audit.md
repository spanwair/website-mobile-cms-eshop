---
title: Audit Log
description: Read-only history of create, update, and delete actions across your organization's data
---

The Audit Log is a read-only, chronological record of data changes in your organization.
Every meaningful insert, update, and delete is written to `audit_logs`, giving you an accountability trail for who changed what and when.
The `MANAGE_AUDIT` bit that unlocks this page is also what lets an admin edit party settings in [Organizations](/docs/en/admin/parties) and recompute billing periods in [Reports](/docs/en/admin/reports).

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 4096 | MANAGE_AUDIT | Owner, Admin, Eshop Admin (with this bit) |

Without `MANAGE_AUDIT` you are redirected to `/admin`.
An eshop admin with no organization is sent to `/admin/setup` (owner: `/admin/parties/new`).

## Log view (`/admin/audit`)

Entries load 50 per page through `fetchAuditLogs`, newest first, scoped to the active party, with a total count shown top-right.

### Table filter

A dropdown lists every table that actually has entries for this org (built from a distinct query over `audit_logs.table_name`).
Pick one and press **Filter** to narrow to a single table; a **Clear** link removes the filter.

### Columns

| Column | Source | Notes |
|---|---|---|
| Timestamp | `created_at` | Full date and time in the current locale. |
| Action | `action` | Color-coded badge: create/INSERT green, update/UPDATE amber, delete/DELETE red, anything else grey. The label is localized (Create / Update / Delete). |
| Table | `table_name` | Monospaced table name, or a dash. |
| Record ID | `record_id` | Monospaced, truncated to 12 characters. |
| User ID | `user_id` | Monospaced, truncated to 12 characters - the actor who made the change. |

The action classifier is tolerant: it matches both raw SQL verbs (`INSERT`/`UPDATE`/`DELETE`) and app-level verbs (`create`/`update`/`delete`).

## Empty state and pagination

When nothing matches, a centered "No logs" row is shown.
Previous / Next links and a "Page X of Y (Total N)" indicator appear when there is more than one page, preserving the table filter.

## Data & storage (cloud)

- **Table:** `audit_logs` (`created_at`, `action`, `table_name`, `record_id`, `user_id`, `party_id`).
- **Service:** `fetchAuditLogs` (`auditService`).
- Rows are written automatically by the application/database when records change; this page never writes, only reads.
- Scoped to `ctx.partyId`.

## Related pages

- [Organizations](/docs/en/admin/parties) - editing party settings requires this same `MANAGE_AUDIT` bit
- [Reports](/docs/en/admin/reports) - billing-period recompute is gated by `MANAGE_AUDIT`
- [Users](/docs/en/admin/users) and [Roles](/docs/en/admin/roles) - role and membership changes are among the actions recorded here
