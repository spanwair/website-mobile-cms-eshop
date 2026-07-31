# Rules for automated edits in this repo (local llama-server agent)

A ticket file for the actual task is included in this session separately. These are
repo-wide rules that always apply on top of it. This model has a 32,000 token context
window — these rules are kept short on purpose. Don't restate whole files back with
commentary; extra prose comes directly out of the budget available for the real answer.

## Repo conventions (condensed from .claude/CLAUDE.md — do not violate)
- Never duplicate logic between `mobile/` and `website/` — shared code belongs in `shared/`.
- Max 200 lines per file — split by component/route/service/util if you'd exceed it.
- No comments unless the WHY is genuinely non-obvious (a workaround, a hidden constraint).
  Never comment WHAT the code does.
- No fallback mechanisms / silent error swallowing — they hide real failures.
- Never hardcode credentials — only `.env.development`/`.env.production`/`.envrc` may hold secrets.
- All DB schema changes go through `supabase/migrations/`, never ad hoc.
- Use the EXACT repo-relative file path you were given for every file — never invent a path
  or add/drop a directory prefix (e.g. the real path is `website/...`, NOT `local-agents/website/...`).

## Permissions (only if the task touches website/src/pages/admin/, Sidebar.astro,
## website/src/lib/admin.ts, or shared/constants/permissions.ts)
- Single source of truth is `shared/constants/permissions.ts` — NEVER redefine role numbers,
  permission bit values, or labels anywhere else; import them.
- If `local-agents/skills/admin-permissions.md` isn't already in your context, say so instead
  of guessing — it has the full role/permission rules and page-access table.

## E2E testing — MANDATORY for every website/ or mobile/ code change
1. Every change must be covered by either a NEW Playwright spec or a passing run of an
   EXISTING relevant one. Never skip this.
2. New specs live in `website/tests/e2e/`, named `NN-short-description.spec.ts` where NN is
   the next unused number (check existing files in that directory).
3. Only ever run the spec file(s) relevant to this task:
   `cd website && pnpm exec playwright test <filename>.spec.ts`
   NEVER run the bare full suite (`pnpm playwright test` / `pnpm test:e2e` with no file
   argument) — that runs every spec in the repo and only happens when a human explicitly
   asks for a full regression run.
4. Any test that visits a `/admin/*` page (or any page behind login) MUST log in first,
   using the existing helper — do not write your own login logic:
   ```ts
   import { loginAs, OWNER, ADMIN, USER, ESHOP, BASE } from "./helpers";
   // before navigating to a protected page:
   await loginAs(page, ADMIN.email, ADMIN.password); // or OWNER / USER / ESHOP as the scenario needs
   await page.goto(`${BASE}/admin/...`);
   ```
   Skipping this makes the test redirect to `/login` and fail — this has happened before,
   do not repeat it.
5. `website/tests/e2e/helpers.ts` also exports `psql()` for DB seeding/assertions and
   `screenshot()` for debug captures — read it if a scenario needs test data beyond what
   `global-setup.ts` already seeds.
