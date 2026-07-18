---
title: Customers
description: How to manage customer records.
---

## What a customer record is

A **customer** is a contact record attached to your organization — typically someone who has placed or will place an order. Customers are separate from **user accounts** (auth accounts). A customer can exist in the system without having a login.

## Where to find customers

Go to **Admin → Customers** (`/admin/customers`).

## Customer fields

| Field | Required | Description |
|-------|----------|-------------|
| First name | ✅ | Customer's first name |
| Last name | ✅ | Customer's last name |
| Email | | Contact email |
| Phone | | Phone number |
| Notes | | Internal notes (not visible to customer) |
| Active | | Whether this customer is active (default: yes) |

## Searching customers

Use the **search box** at the top of the customers list. It searches by first name, last name, or email.

## Viewing a customer's orders

On the customer detail page, scroll down to see all orders linked to this customer. Click any order number to open the order detail.

## Editing a customer

1. Click **View** on the customer row
2. Change any fields
3. Click **Save**

Changes take effect immediately.

## Deactivating vs. deleting

Setting `is_active = false` hides the customer from the active list but keeps their order history. Use this instead of deletion to preserve records.

There is no delete button for customers in the current version to prevent accidental deletion of order history.
