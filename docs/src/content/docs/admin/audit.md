---
title: Audit Log
description: How to use the audit log to track all data changes within your organization.
---

The Audit Log records every INSERT, UPDATE, and DELETE operation on your organization's data. It is a read-only history — nothing can be deleted from the audit log. Use it for compliance, debugging, and tracking who changed what.

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 4096 | MANAGE_AUDIT | Owner, Admin (with this bit) |

This is the highest permission bit. Typically only Owners and senior Admins have it.

## Audit log page (`/admin/audit`)

### Filtering

At the top of the page, a **Filter by table** dropdown lets you narrow the log to a specific database table. Select a table name (e.g. `products`, `orders`, `customers`) and only changes to that table are shown. Click **Clear** to remove the filter.

### Table columns

| Column | Description |
|---|---|
| Timestamp | When the change was made (server time, UTC) |
| Action | What happened — INSERT (green), UPDATE (yellow), DELETE (red) |
| Table | Which database table was affected |
| Record ID | The ID of the affected row (truncated for display) |
| User ID | The Supabase auth user ID of who made the change (truncated) |

## Action types

| Action | Badge color | Meaning |
|---|---|---|
| INSERT | Green | A new record was created |
| UPDATE | Yellow | An existing record was modified |
| DELETE | Red | A record was removed |

## Data scoping

The audit log is **party-scoped** — you only see audit entries for your own organization. An admin from Organization A cannot see the audit trail of Organization B. Owners with access to multiple organizations need to switch organization context to view each org's audit log separately.

## Common use cases

**"Who deleted that product?"**
1. Filter by table: `products`
2. Look for action: `DELETE`
3. Check the User ID column — match it to a user in [Users](/admin/users)

**"What changed on this order?"**
1. Filter by table: `orders`
2. Find rows with the order's Record ID
3. Each UPDATE row represents one status or field change

**"Did someone change a user's role without authorization?"**
1. Filter by table: `profiles`
2. Look for UPDATE actions
3. Compare timestamps to your team's working hours

**Compliance audit**
The audit log provides an immutable record of all changes for GDPR, financial, or operational audits. Export the data via the Supabase dashboard if you need a formal report.

## What the audit log does NOT show

- Read operations (SELECT queries) — only writes are logged
- Changes made directly in the Supabase dashboard using the service role key (bypasses RLS and triggers)
- Changes made before the audit triggers were installed

## Related pages

- [Organizations](/admin/parties) — audit log is scoped per organization
- [Users](/admin/users) — look up who a User ID belongs to
- [Permissions](/users/permissions) — MANAGE_AUDIT permission (bit 4096)
