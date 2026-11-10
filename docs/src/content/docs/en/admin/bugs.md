---
title: Reported Bugs
description: Owner-only inbox for bug reports filed from the floating widget on every admin page, including optional screenshot and screen-recording capture
---

Every `/admin/*` page shows a floating bug button in the bottom-left corner.
Any admin-capable user (eshop_admin, admin, or owner) can open it, describe what happened, and optionally attach a screenshot and/or a short screen recording, all captured with browser-only APIs (`getDisplayMedia` / `MediaRecorder`) — no local screenshot tool or desktop software involved.
Submitted reports are only ever readable by the platform owner.

## Permission required

Filing a report requires no permission bit — the widget is mounted in `CmsLayout` and shows for every admin role, the same precedent as the always-visible Notifications entry.

**Reading** reports is different: `/admin/bugs` and its sidebar entry are **owner-only**, gated directly by `ctx.isOwner` (same precedent as [Shipping](/docs/en/admin/settings-shipping)), not by a `MANAGE_*` permission bit — bug reports and their screenshots/videos can contain sensitive data from any organization, so no per-party permission can grant access to them. Any non-owner hitting `/admin/bugs` directly is redirected to `/admin`.

## The widget (every admin page)

Click the 🐛 button to open a small panel anchored to the button, with no backdrop — it must not block the rest of the screen while the reporter is still looking at what they're describing. The panel has three independent, **entirely optional** inputs:

| Input | How it's captured |
|---|---|
| Description | A plain textarea. |
| Screenshot | `navigator.mediaDevices.getDisplayMedia({ video: true })` prompts the browser's native screen/window/tab picker, a single frame is drawn to a canvas, and the capture stream is stopped immediately. |
| Screen recording | Same `getDisplayMedia` picker, but the stream feeds a `MediaRecorder` until the reporter clicks Stop (or ends sharing via the browser's own "Stop sharing" control). |

No field is required — the Report button can be clicked with all three empty.
Submitting posts a `FormData` to `POST /api/admin/bug-reports` with whatever fields are present, plus `pageUrl` (`location.href`) and `userAgent`, collected automatically.

### A codec-stripping gotcha

`MediaRecorder.mimeType` reports a codec-qualified type like `video/webm;codecs=vp9`, which never matches the storage bucket's plain `allowed_mime_types` entry (`video/webm`) and gets rejected with `InvalidMimeType`. `uploadBugReportMedia` (`shared/services/bugReportService.ts`) strips everything after `;` before uploading — keep this in mind if the allowed-types list or the recorder's mime type selection ever changes.

## Reported Bugs list (`/admin/bugs`, owner-only)

A simple table: timestamp, reporter email, organization name (if the reporter had an active party), description, the page they were on, links to the screenshot/video (if any), and an open/resolved status toggle.

Status is a plain two-state field (`open` / `resolved`) updated via a same-page `POST` form, no API route involved.

## Data and storage (cloud)

- **Table:** `bug_reports` — `reporter_id`, `reporter_email` (denormalized so the row still reads sensibly if the profile is later deleted), `party_id`, `page_url`, `description`, `screenshot_path`, `video_path`, `user_agent`, `status`, `created_at`.
- **Bucket:** `bug-reports`, **private** (`public = false`). Media is only ever resolved to a 1-hour signed URL (`getBugReportMediaUrl`), generated server-side on `/admin/bugs`, never a public `getPublicUrl()` link. An unsigned direct request to an object 400s.
- **RLS:** INSERT allowed to any authenticated user with `can_access_admin()` (role ≥ eshop_admin) where `reporter_id = auth.uid()`; SELECT/UPDATE restricted to `is_owner()`.
- **A write-path RLS gotcha:** `createBugReport` intentionally does **not** chain `.select()` after `.insert()`. Supabase's `insert().select()` requires the row to also satisfy the table's SELECT policy to return it — since SELECT here is owner-only, chaining `.select()` made every non-owner reporter's insert fail with "new row violates row-level security policy", even though the INSERT policy itself was satisfied. Insert-only, no return value, avoids the implicit read-back check entirely.
- **Services:** `createBugReport`, `fetchBugReports`, `updateBugReportStatus`, `getBugReportMediaUrl` (`shared/services/bugReportService.ts`).
- **Components:** `BugReportWidget.astro` (mounted unconditionally in `CmsLayout.astro`) + `website/src/lib/bugReportWidget.ts` for the capture/submit logic.

## Related pages

- [Shipping](/docs/en/admin/settings-shipping) — the other owner-only, platform-wide admin surface gated by `ctx.isOwner` directly instead of a permission bit
- [Notifications](/docs/en/admin/notifications) — the other always-visible-to-every-role sidebar entry (`perm: 0`)
