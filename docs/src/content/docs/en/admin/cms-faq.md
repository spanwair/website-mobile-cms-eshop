---
title: FAQ
description: Manage frequently asked questions grouped by context and shown on your storefront
---

The FAQ page manages the questions and answers shown on your storefront (on the FAQ content page and, by context, on other pages).
It sits under the **FAQ** tab of the CMS, alongside [Navigation](/docs/en/admin/cms-navigation), [Pages](/docs/en/admin/cms-pages), [Blog](/docs/en/admin/cms-blog), [Team](/docs/en/admin/cms-team), and [Legal Pages](/docs/en/admin/cms-legal).

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 2048 | MANAGE_CMS | Owner, Admin, Eshop Admin (with this bit) |

Without `MANAGE_CMS` you are redirected to `/admin`.

## Page layout (`/admin/cms/faq`)

Like [Team](/docs/en/admin/cms-team), this is a single edit form above a list table, with no separate create route.
**Edit** reloads the page with `?edit={id}`; **Cancel** returns to the blank "add" form.

### Add / edit form

| Field | Column | Notes |
|---|---|---|
| Question | `faq_items.question` | Required. |
| Answer | `faq_items.answer` | Required (3-row textarea). |
| Context | `faq_items.context` | A grouping key, default `general`. Placeholder suggests values like `general`, `about`, `buyback`. Lets you show the right FAQs on the right page. |
| Sort order | `faq_items.sort_order` | Lower numbers appear first. |
| Visible | `faq_items.is_visible` | Unticking hides the item without deleting it. |

Submitting with a hidden `id` updates; without one, it creates. On success you return to `/admin/cms/faq`.

### List table

Columns: Question, Context, Order, Actions (**Edit** / **Delete** with a `confirm()`).
An empty list shows a centered "no FAQ" row.

Kytka z Beskyd seeds five general questions (delivery time, custom colors/size, funeral wreaths, payment, longevity of dried flowers).

## Data & storage (cloud)

- **Table:** `faq_items` (`party_id`, `question`, `answer`, `context`, `sort_order`, `is_visible`).
- **Services:** `fetchFaqItems`, `createFaqItem`, `updateFaqItem`, `deleteFaqItem` (`faqService`).
- **Component:** `CmsTabs`.
- Scoped to `ctx.partyId`.

## Related pages

- [Pages](/docs/en/admin/cms-pages) - the FAQ content page (template `faq`) that renders these items
- [Team](/docs/en/admin/cms-team) - the sibling single-form CMS editor with the same add/edit pattern
