---
title: Custom Roles
description: How to create and manage custom permission roles for your organization.
---

Custom roles let you define precisely what each team member can do in the admin panel. Every organization starts with a **Super Admin** system role (created automatically). You can create additional roles tailored to specific job functions.

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 4 | MANAGE_ROLES | Owner, Admin (with this bit) |

## Role list (`/admin/roles`)

The table shows all roles belonging to your organization:

| Column | Description |
|---|---|
| Name | Role display name (e.g. "Warehouse Staff") |
| Description | Optional explanation of what this role is for |
| Permissions | Chip badges showing each permission this role includes |
| Type | `system` (cannot be deleted) or `custom` (can be deleted) |
| Delete | Button — only shown for custom roles |

## System roles vs custom roles

| Type | Description |
|---|---|
| System | Created automatically (e.g. "Super Admin" created when the org is set up). Cannot be deleted or modified through the UI. |
| Custom | Created by you. Can be deleted. |

The **Super Admin** system role has all permissions (`ALL_PERMISSIONS`) and is assigned to the first Owner of the organization.

## Creating a custom role (`/admin/roles/new`)

### How to

1. Click **New Role**.
2. Enter a **Name** (required) — describe the function, e.g. "Warehouse Staff", "Content Editor", "Finance".
3. Optionally add a **Description** to remind yourself what this role is for.
4. Check the **permission checkboxes** for each capability this role should have.
5. Click **Save**.

The role is now available in the role dropdown when [inviting members](/admin/parties) to your organization and in [Users](/admin/users) for changing existing members' roles.

## Permission checkboxes

Each checkbox corresponds to one permission bit:

| Checkbox label | Permission bit | Grants access to |
|---|---|---|
| View Dashboard | 1 | [Dashboard](/admin/dashboard) |
| Manage Users | 2 | [Users](/admin/users), [Organizations](/admin/parties) |
| Manage Roles | 4 | [Custom Roles](/admin/roles) (this page) |
| Manage Products | 8 | [Products](/admin/products), [Reviews](/admin/reviews) |
| Manage Categories | 16 | [Categories](/admin/categories) |
| Manage Orders | 32 | [Orders](/admin/orders), [Returns](/admin/returns) |
| Manage Inventory | 64 | [Inventory](/admin/inventory) |
| Manage Pricing | 128 | [Pricing & Coupons](/admin/pricing) |
| Manage Customers | 256 | [Customers](/admin/customers) |
| Manage Reports | 512 | [Reports](/admin/reports) |
| Manage Audit | 4096 | [Audit Log](/admin/audit) |

## Recommended role configurations

| Role name | Suggested permissions |
|---|---|
| Warehouse Staff | Manage Inventory only |
| Content Editor | Manage Products + Manage Categories |
| Customer Support | Manage Customers + Manage Orders |
| Shop Manager | Manage Products + Categories + Orders + Inventory + Customers + Pricing |
| Finance | Manage Reports + View Dashboard |
| Full Admin | All permissions |

## Deleting a custom role

Click **Delete** on a custom role row. This removes the role definition. Any users who were assigned this role will need to be reassigned a different role via [Users](/admin/users) — otherwise they fall back to minimal access.

Do not delete a role that is currently in use. Check [Users](/admin/users) first to see if anyone has that role.

## Related pages

- [Users](/admin/users) — assign roles to team members
- [Organizations](/admin/parties) — role dropdown in invite form uses roles from this page
- [Permissions](/users/permissions) — detailed explanation of every permission bit
- [Role Hierarchy](/users/roles) — Owner / Admin / Eshop Admin / User system roles
