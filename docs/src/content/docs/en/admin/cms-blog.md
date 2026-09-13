---
title: Blog
description: Write, schedule, and publish blog posts with markdown or HTML content, featured images, and SEO fields
---

The Blog manages the articles that appear at `/blog/{slug}` on your storefront, and in the `blog_preview` homepage section when that section is enabled in [Homepage Layout](/docs/en/admin/settings-layout).
It sits under the **Blog** tab of the CMS (shared with [Navigation](/docs/en/admin/cms-navigation), [Pages](/docs/en/admin/cms-pages), [Team](/docs/en/admin/cms-team), [FAQ](/docs/en/admin/cms-faq), and [Legal Pages](/docs/en/admin/cms-legal)).

## Permission required

| Permission bit | Name | Who has it by default |
|---|---|---|
| 2048 | MANAGE_CMS | Owner, Admin, Eshop Admin (with this bit) |

Without `MANAGE_CMS` you are redirected to `/admin`.
An eshop admin with no organization is sent to `/admin/setup` (owner: `/admin/parties/new`).

## Post list (`/admin/cms/blog`)

A table of all posts for the org, with a count and a **New post** button.

| Column | Description |
|---|---|
| Title | Post title, bold. |
| Slug | Shown as its live path `/blog/{slug}`. |
| Status | Badge: green "Published" or grey "Draft". |
| Actions | **Edit** and **Delete** (with a `confirm()` dialog). |

An empty list shows a centered "no posts" row.

## Creating a post (`/admin/cms/blog/new`)

### Field reference

| Field | Column | Notes |
|---|---|---|
| Title | `blog_posts.title` | Required. |
| Slug | `blog_posts.slug` | Auto-suggested from the title via the `SlugInput` component; resolved with `resolveSlug`. |
| Excerpt | `blog_posts.excerpt` | Short teaser (2-row textarea), used in previews. |
| Content | `blog_posts.content` | The article body (10-row textarea). |
| Content format | `blog_posts.content_format` | `markdown` (default) or `html` - how the body is rendered on the storefront. |
| Status | `blog_posts.status` | `draft` or `published`. |
| Featured image | `blog_posts.featured_image_url` | Chosen with the `ImagePicker` from the store [media library](/docs/en/admin/settings-content). |
| Author | `blog_posts.author_name` | Free text, e.g. "Natálie Ruszová". |
| SEO title | `blog_posts.seo_title` | Overrides the `<title>` for search engines. |
| SEO description | `blog_posts.seo_description` | Meta description. |

When you set status to **published**, `published_at` is stamped with the current time; switching back to draft clears it.
On save you land on the post's edit page.

Kytka z Beskyd ships two posts as the example: "Jak vybrat velikost věnce na dveře" and "Péče o sušené květiny".

## Editing a post (`/admin/cms/blog/{id}`)

The same form, pre-filled.
A separate red **Delete** button (with a `confirm()` dialog) removes the post.

## Data & storage (cloud)

- **Table:** `blog_posts` (`party_id`, `title`, `slug`, `excerpt`, `content`, `content_format`, `featured_image_url`, `author_name`, `status`, `published_at`, `seo_title`, `seo_description`).
- **Services:** `fetchBlogPosts`, `fetchBlogPost`, `createBlogPost`, `updateBlogPost`, `deleteBlogPost` (`blogService`); `fetchStoreMedia` (`storeMediaService`) for the image picker.
- **Components:** `SlugInput`, `ImagePicker`, `CmsTabs`.
- Scoped to `ctx.partyId`.

## Related pages

- [Homepage Layout](/docs/en/admin/settings-layout) - enable the `blog_preview` section to surface posts on the homepage
- [Homepage Content](/docs/en/admin/settings-content) - the media library the featured-image picker draws from
- [Pages](/docs/en/admin/cms-pages) - static content pages, the non-dated sibling of blog posts
