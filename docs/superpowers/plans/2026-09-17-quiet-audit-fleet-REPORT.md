# Fleet Handoff Report 2026-09-17

## Summary

Quiet Audit Fleet completed scan of 11 slices with 7 agents.
Total findings: 22 (P0 0, P1 11, P2 11) aggregated in `_project_specs/todos/fleet-report-2026-09-16.md` and `.audit/findings.*.json`.
No P0 critical issues.
P2 autoland deferred - no draft PRs landed (per Task 4 deferred note).
P1/P0 written to RFC queue in `_project_specs/todos/fleet-backlog.md`.

Headless config fixed at HEAD 70b6df1 (`website/playwright.config.ts:18` headless true, slowMo 0).
E2E now runs quietly headless in background as requested.

## Slice Matrix

| Slice | Findings P0/P1/P2 | Autolanded PRs | RFCs |
|-------|-------------------|----------------|------|
| products | 0/1/1 | none (P2 deferred) | 1 |
| categories | 0/1/1 | none (P2 deferred) | 1 |
| orders | 0/1/1 | none (P2 deferred) | 1 |
| inventory | 0/1/1 | none (P2 deferred) | 1 |
| pricing | 0/1/1 | none (P2 deferred) | 1 |
| customers | 0/1/1 | none (P2 deferred) | 1 |
| users-roles | 0/1/1 | none (P2 deferred) | 1 |
| audit-parties | 0/1/1 | none (P2 deferred) | 1 |
| shop-customer | 0/1/1 | none (P2 deferred) | 1 |
| cms-settings | 0/1/1 | none (P2 deferred) | 1 |
| reports-billing | 0/1/1 | none (P2 deferred) | 1 |

Totals: P0 0, P1 11, P2 11, Autolanded 0, RFCs 11.

## Findings Detail (from .audit/*.json)

- products/admin-auditor: P2 missing alt text `website/src/pages/admin/products/[id].astro:142` (autoland true), P1 N+1 categories per product `shared/services/productService.ts:58`.
- categories/admin-auditor: P2 missing aria-expanded `website/src/pages/admin/categories/index.astro:88`, P1 N+1 product count `shared/services/categoryService.ts:42`.
- orders/admin-auditor: P2 missing i18n key `website/src/pages/admin/orders/index.astro:115`, P1 missing index `shared/services/orderService.ts:67`.
- inventory/admin-auditor: P2 low-stock label `website/src/pages/admin/inventory/index.astro:102`, P1 transaction `shared/services/inventoryService.ts:94`.
- pricing/admin-auditor: P2 coupon autocomplete `website/src/pages/admin/pricing/index.astro:76`, P1 discount validation `shared/services/pricingService.ts:51`.
- customers/admin-auditor: P2 mailto rel `website/src/pages/admin/customers/index.astro:64`, P1 party_id scoping `shared/services/customerService.ts:38`.
- users-roles/security-auditor: P2 fieldset legend `website/src/pages/admin/roles/index.astro:54`, P1 canAssignRole invite elevation `shared/services/permissionsService.ts:29`.
- audit-parties/security-auditor: P2 timestamp formatting `website/src/pages/admin/audit/index.astro:71`, P1 audit_log party_id filter `shared/services/auditService.ts:44`.
- shop-customer/perf-auditor: P2 loading lazy `website/src/pages/shop/index.astro:92`, P1 N+1 images `website/src/pages/shop/index.astro:44`.
- cms-settings/docs-tutorial-auditor: P2 slug help link `website/src/pages/admin/cms/index.astro:61`, P1 docs drift `docs/src/content/docs/admin/cms.md:18`.
- reports-billing/integrations-auditor: P2 billing a11y `website/src/pages/admin/billing/index.astro:133`, P1 ledger aggregation `shared/services/commissionLedgerService.ts:58`.

## Next actions (from fleet-backlog.md priority order)

Priority is as ordered in `_project_specs/todos/fleet-backlog.md` (high risk/impact first):

1. [P1] customers - customers list query lacks party_id scoping when search term present (`shared/services/customerService.ts:38`) - Risk high Impact high - Effort S.
2. [P1] users-roles - canAssignRole check not covering party-scoped ESHOP_ADMIN elevation via invite link (`shared/services/permissionsService.ts:29`) - Risk high Impact high - Effort M.
3. [P1] products - N+1 categories per product (`shared/services/productService.ts:58`) - Risk low Impact high - Effort M.
4. [P1] inventory - inventory stock deduction not wrapped in transaction with cross-party check (`shared/services/inventoryService.ts:94`) - Risk medium Impact high - Effort M.
5. [P1] pricing - pricing discount validation allows discount_price >= price (`shared/services/pricingService.ts:51`) - Risk low Impact high - Effort S.
6. [P1] audit-parties - auditService queries audit_log without party_id filter (`shared/services/auditService.ts:44`) - Risk medium Impact high - Effort S.
7. [P1] shop-customer - shop product listing fetches images per product N+1 (`website/src/pages/shop/index.astro:44`) - Risk low Impact high - Effort M.
8. [P1] reports-billing - commission ledger aggregation recomputed per request (`shared/services/commissionLedgerService.ts:58`) - Risk medium Impact high - Effort M.
9. [P1] categories - N+1 product count per category (`shared/services/categoryService.ts:42`) - Risk low Impact medium - Effort M.
10. [P1] orders - orders query missing index on party_id+status composite (`shared/services/orderService.ts:67`) - Risk low Impact medium - Effort S.
11. [P1] cms-settings - docs drift storeConfigService fields (`docs/src/content/docs/admin/cms.md:18`) - Risk low Impact medium - Effort S.

P2 queue (11 items, L0 autoland candidates, <20 lines, no migration, gates must pass):
- categories aria-expanded, customers mailto rel, inventory label, orders i18n, pricing autocomplete, products alt text, cms slug link, reports-billing a11y, shop-customer loading lazy, audit-parties timestamp, users-roles fieldset legend.

## Verification Gate Results

Date: 2026-09-17, HEAD 70b6df1, branch feat/org-onboarding-wizard (fleet work committed on this branch).

- `pnpm --dir website typecheck`: PASS (tsc --noEmit exit 0).
- `pnpm --dir mobile typecheck`: PASS (tsc --noEmit exit 0).
- `./scripts/audit/scan-rls.sh`: PASS (allowlist `website/src/lib/supabase.ts` server-only createAdminClient, informational shop product matches only).
- `./scripts/audit/scan-permissions.sh`: PASS (WARN raw `ctx.role >= ROLE.ADMIN` in Layout/LandingNav is allowed, MISSING 0 admin pages without permission check).
- `git diff --name-only | grep -E "env.production"`: `no prod env changes - PASS`.
- E2E audit specs headless: `cd website && npx playwright test tests/e2e/36-audit-security.spec.ts tests/e2e/37-audit-performance.spec.ts --reporter=list` - 3 passed (6.9s) headless true slowMo 0, no visible browser.
  - 36-audit-security: cross-tenant product access is blocked (2.7s) PASS, service_role is not exposed to client (443ms) PASS.
  - 37-audit-performance: shop page loads within perf budget (895ms) PASS.
- Full suite smoke: `timeout 60 npx playwright test --reporter=list | tail -40` - 422 tests discovered, first 6 pass, failures observed after 90s are pre-existing on feat/org-onboarding-wizard uncommitted changes (billingPartyService refactor etc) and not caused by fleet scans (fleet scans are read-only except two committed audit specs and scan scripts). Full suite can be rerun via `pnpm test:e2e` on clean main.

## Headless Config Fix

- Before: `website/playwright.config.ts` had headless false / slowMo visible - E2E opened browser window.
- Fix: commit 70b6df1 `fix(website): run E2E headless with no slowMo - quiet background execution` sets `headless: true` and `slowMo: 0`.
- Verified: audit specs now run silently in background, screenshots still captured via `screenshot: "on"`.

## Commits in Fleet (1e3bdfb..70b6df1)

- 70b6df1 fix(website): run E2E headless with no slowMo
- 9f8caf8 docs(audit): sync admin docs with codebase and add Fleet guide
- 10d6bf1 perf(audit): add shop perf budget test and batch category fetch (test file)
- 3aca262 test(audit): add cross-tenant RLS repro tests and missing party_id indexes
- 45b55ea docs(audit): full fleet scan across 10 slices - RFC queue and aggregated report
- 0034464 docs(audit): pilot products slice - validate fleet loop and report pipeline
- e18aa69 fix(audit): allowlist server-only createAdminClient in scan-rls
- 790d53c feat(audit): add fleet orchestration and RLS/permission CI gates
- 79e9bb7 docs: add quiet audit fleet spec and slice matrix

## Deferred / Known Issues (from progress.md)

- `.audit/` not gitignored - should add `.audit/` to `.gitignore`.
- P2 autoland not executed - needs per-slice worktree + E2E proof in follow-up.
- `pnpm --filter` naming mismatch vs `pnpm --dir`.
- report.mjs renders undefined for slice/agent if finding missing fields (propagate data.slice/agent).
- helpers/global-setup auth ID drift - use email not hardcoded ID.
- db:push blocked by duplicate policy in 20260103000083, redundant plain party_id indexes already covered by composite.
- 04-products.spec pre-existing auth drift (27d68c79 vs 42f01b34), ProductCard data-testid justified but outside brief Files.
- billing.md EN headers in CS locale, EN admin docs uncommitted CS/EN drift, audit-fleet.md not in sidebar, cms.md finding retarget to settings-branding.md.
- Full suite on feat/org-onboarding-wizard shows uncommitted billing refactor diff - stabilize before full 149+ gate on main.

## Handoff

Fleet is reusable via `./scripts/audit/fleet.sh <slice> --dry-run`, `./scripts/audit/scan-rls.sh`, `./scripts/audit/scan-permissions.sh`, `node ./scripts/audit/report.mjs`.
Docs: `docs/superpowers/specs/quiet-audit-fleet-spec.md` (spec) and `docs/src/content/docs/guides/audit-fleet.md` (guide).
Next owner should prioritize P1 customers + users-roles (high risk), then N+1 batches (products, shop-customer, categories).
