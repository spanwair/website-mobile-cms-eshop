# Task: always-visible "Add new URL" in the CMS URL combobox, forced leading "/"

## Where

`website/src/components/cms/CreatableCombobox.astro` — this is a **shared** component used
with `urlOnly` by two admin pages:
- `website/src/pages/admin/cms/navigation.astro` (the one reported)
- `website/src/pages/admin/settings/footer.astro`

Both must be fixed together — do not special-case navigation.astro, the bug is in the
shared component's client-side script (the `<script>` block at the bottom of
CreatableCombobox.astro), specifically `isCustomAllowed()` and `render()`.

## Current (buggy) behavior

`isCustomAllowed(v)` — when `urlOnly` is true — only returns `true` if the typed text is a
prefix of, or starts with, `"https://"`, `"http://"`, or `"www."`. `render()` only shows the
"Add new" (`combobox-create`) list item when `isCustomAllowed` is true. Result: typing
`kontakt` or `/kontakt` never shows "Add new" — only typing `h`, `ht`, `htt`, ... `https`
does. This is also why the placeholder text `/stranka/o-nas` is misleading: you can't
actually create that shape of value today.

## Required behavior (from the person who filed this)

1. For `urlOnly` comboboxes specifically, the "Add new" option must be **always visible**,
   as the **first** item in the dropdown list — not gated on what's typed, not gated on
   length. It shows on focus with an empty input too.
2. Clicking it adds the typed text as the new URL, and that URL **always gets a leading
   `/`** unless it's already an absolute external URL.
3. Do not change the non-`urlOnly` combobox behavior (the `column_key` combobox in
   footer.astro) — its "Add new" gating (`isCustomAllowed` returns true whenever non-empty)
   is correct today and is out of scope.

## Implementation notes (read these before writing code — they resolve the ambiguity the
   ticket didn't spell out)

- **External URLs must still work.** Both call sites let users link to arbitrary pages, and
  an admin may legitimately want to add `https://external-site.com`. Do not force a `/`
  prefix onto a value that already starts with `http://`, `https://`, or `www.` — pass it
  through unchanged. Only values that don't match those prefixes get a leading `/` added
  (and don't double it if the user already typed `/kontakt`).
- **Empty input:** the "Add new" row must still render (requirement 1 says "always"), but
  clicking it while the input is empty must be a no-op (don't create `/` as a URL). Render
  it in a visually disabled state (e.g. `aria-disabled="true"` + a CSS class dropping
  opacity) and ignore clicks on it in the `mousedown` handler.
- **Label text:** keep using the existing `createLabel` prop (`t.admin.cms.urlCreateLabel`,
  translated: "Use custom URL" / "Použít vlastní URL" in `shared/i18n/locales/{en,cs}.ts` —
  do not add new translation keys). When there's a typed value, show the label with the
  *already-normalized* value in quotes (e.g. `Use custom URL "/kontakt"`) so the user sees
  the forced `/` before they click, not after. When input is empty, show the label alone,
  no trailing empty quotes.
- **Don't touch** `isCustomAllowed` calls made for non-`urlOnly` combobox (footer.astro's
  `column_key` field) — verify by testing both pages after the change, not just navigation.
- Keep the existing `exact` match suppression: if the typed value already matches an
  existing option exactly, don't also show a redundant "Add new" row for the same value.
- No new dependencies, no new files needed for the component itself — this is a same-file,
  same-line-budget change to `CreatableCombobox.astro`'s inline `<script>` block (currently
  ~130 lines inside a 196-line file — stay under the repo's 200-line-per-file rule).

## Why this is safe to auto-run (not permission-sensitive)

This does not touch role/permission logic, `hasPermission`, `canAssignRole`, or
`shared/constants/permissions.ts` — it's a client-side UX fix to an input widget. It does
live under `website/src/pages/admin/`, so the admin-permissions skill and gate's E2E
admin-spec check will still fire automatically (per `.claude/CLAUDE.md`'s auto-trigger
rule) — that's expected and fine, treat it as a routine "did I break the admin page gating
while I was in this file" check, not evidence the task itself is permission work.

## Test coverage expected from the tester role

No existing Playwright spec covers this combobox (checked: none of
`website/tests/e2e/*.spec.ts` reference `combobox` or `cms/navigation`). Add a new spec —
next unused number is `27` (last existing is `26-search-autocomplete.spec.ts`) — e.g.
`website/tests/e2e/27-cms-navigation-url-combobox.spec.ts` — covering, at minimum:
- On `/admin/cms/navigation`, focus the URL field with no text typed: "Add new"/"Use custom
  URL" is visible as the first list item, and clicking it does nothing (no crash, field
  stays empty, form is still submittable via a real option or by typing).
- Type `kontakt` (no leading slash): the create row shows the value as `/kontakt`; clicking
  it sets the input value to `/kontakt` exactly (not `kontakt`, not `//kontakt`).
- Type `/kontakt` (already has leading slash): clicking create sets the input to `/kontakt`
  (not `//kontakt`).
- Type `https://example.com`: clicking create sets the input to `https://example.com`
  unchanged (no forced `/`).
- Repeat the "type `kontakt` -> creates `/kontakt`" check on `/admin/settings/footer`'s URL
  field, to confirm the shared-component fix works on both call sites.
- Sanity check footer.astro's `column_key` combobox (non-`urlOnly`) still behaves as before
  (create row still gated on non-empty input, no `/` prefixing applied to it).

## Gate

Because this touches `website/src/pages/admin/`, `gate.py` will automatically run
`website:typecheck`, `website:lint`, `website:build`, and the admin-permission Playwright
specs. All of those plus the new `27-*` spec must pass before this is reported mergeable.
Nothing gets committed or pushed automatically — a human reviews the treehouse workspace
and merges by hand.
