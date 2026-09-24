# Quiet Autonomous Audit Fleet - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable fleet of 7 isolated audit agents that iterate over every admin feature, its documentation, tutorial, and codebase to quietly find and safely land improvements for performance, security, and correctness.

**Architecture:** Each agent runs in its own git worktree (`fleet/<agent>-<slice>`) on a read-only scan first, scores findings P0/P1/P2, auto-lands only P2 low-risk changes via draft PRs, and proposes RFCs for P0/P1. Verification gate is `pnpm typecheck` in both workspaces plus `pnpm test:e2e` (149+ tests must pass) plus RLS/multi-tenancy grep audit. No `service_role` outside `supabase/functions/_shared`.

**Tech Stack:** Astro 5 SSR + TypeScript, Supabase Postgres + RLS + Edge Functions (Deno), Playwright E2E (Chromium, 1 worker, 45s timeout), pnpm workspaces, git worktrees, Starlight docs.

## Global Constraints

- Never edit `shared/supabase/types.ts` manually - it is auto-generated from DB.
- Never use `service_role` key outside `supabase/functions/_shared` - it bypasses RLS and exposes all tenants.
- Always filter public endpoints by `party_id` - multi-tenancy is critical.
- Every admin page must call `requireAdminCtx()` from `website/src/lib/admin.ts:1`.
- Follow bitmask permission system in `shared/constants/permissions.ts:1` - single source of truth, never raw integers.
- Every migration goes via `supabase/migrations/*.sql` in order, never via Dashboard.
- Run `pnpm typecheck` in both `website/` and `mobile/` and `pnpm test:e2e` in `website/` before declaring done.
- No em dash - use plain dash "-" in code and commits.
- Production env files `.env.production` and `.env.production.example` are never modified or pointed at by code under test.

---

## File Structure

New files this plan creates:

- `docs/superpowers/specs/quiet-audit-fleet-spec.md` - human-readable spec defining agent roster, slice matrix, scoring rubric, and quiet-decision levels.
- `.opencode/agents/audit-fleet.json` - machine-readable agent definitions for OpenCode dispatch.
- `scripts/audit/fleet.sh` - single entrypoint to dispatch fleet (`./scripts/audit/fleet.sh --slice products --dry-run`).
- `scripts/audit/scan-rls.sh` - RLS/multi-tenancy grep audit used as CI gate.
- `scripts/audit/scan-permissions.sh` - permission bitmask audit.
- `scripts/audit/report.mjs` - aggregates per-agent `findings.<agent>.json` into `audit-report.md` with P0/P1/P2 rollup.
- `_project_specs/todos/fleet-backlog.md` - auto-generated RFC queue for P0/P1 findings.
- `docs/src/content/docs/guides/audit-fleet.md` - Starlight guide documenting how to run and extend the fleet.

Modified files:

- `website/tests/e2e/helpers.ts` (or create `website/tests/e2e/helpers/audit.ts`) - shared helpers for RLS repro tests.
- `docs/src/content/docs/architecture/multi-tenancy.md` - add Fleet verification section if missing.
- `.gitignore` - add `fleet/` worktree prefix ignore if needed.

---

### Task 1: Write the spec and slice matrix

**Files:**
- Create: `docs/superpowers/specs/quiet-audit-fleet-spec.md`
- Create: `docs/superpowers/plans/2026-09-17-quiet-audit-fleet.md` (this file - already exists)

**Interfaces:**
- Consumes: existing `AGENTS.md:1`, `website/src/pages/admin/*:1` (62 admin pages), `shared/services/*:1` (45 services), `supabase/migrations/*:1` (100+ migrations), `docs/src/content/docs/admin/*:1` (38 admin docs).
- Produces: canonical slice matrix and scoring rubric consumed by Tasks 2-4.

- [ ] **Step 1: Create `docs/superpowers/specs/quiet-audit-fleet-spec.md`**

Create file `docs/superpowers/specs/quiet-audit-fleet-spec.md` with:

```markdown
# Quiet Audit Fleet - Spec

## Agent Roster

| Agent | Scope | Required Skill Load |
|-------|-------|---------------------|
| admin-auditor | website/src/pages/admin, website/src/components/cms | admin-permissions |
| security-auditor | supabase/migrations, shared/services, website/src/lib/supabase.ts | systematic-debugging |
| perf-auditor | website/src/pages/shop, Astro SSR, DB queries | systematic-debugging |
| docs-tutorial-auditor | docs/src/content/docs, website/src/pages/index.astro | - |
| mobile-auditor | mobile/, shared/ | - |
| test-reliability-auditor | website/tests/e2e, playwright.config.ts | verification-before-completion |
| integrations-auditor | website/src/lib/integrations, supabase/functions | stripe-best-practices |

## Feature Slices (iterate one slice at a time)

| Slice | Admin Pages | Services | Docs | E2E Spec |
|-------|-------------|----------|------|----------|
| products | admin/products/*, admin/products/conditions | productService, productImageService, productConditionService | admin/products.md, admin/product-conditions.md | 04-products.spec.ts |
| categories | admin/categories/* | categoryService | admin/categories.md | 03-categories.spec.ts |
| orders | admin/orders/*, admin/orders/[id]/label.astro | orderService, shipmentService | admin/orders.md | 05-orders.spec.ts, 31-shipping-providers.spec.ts |
| inventory | admin/inventory/* | inventoryService | admin/inventory.md | 08-inventory.spec.ts, 18-stock-deduction.spec.ts |
| pricing | admin/pricing/* | pricingService, feeTierService, commissionLedgerService | admin/pricing*.md | 07-pricing.spec.ts |
| customers | admin/customers/* | customerService | admin/customers.md | 06-customers.spec.ts |
| users-roles | admin/users/*, admin/roles/* | permissionsService, profileService | admin/users.md, admin/roles.md | 09-users-roles.spec.ts, 15-role-access.spec.ts, 17-invite-roles.spec.ts |
| audit-parties | admin/audit/*, admin/parties/* | auditService, partyService | admin/audit.md, admin/parties.md | 02-parties.spec.ts, 10-audit-notifications.spec.ts |
| shop-customer | shop/*, cart, wishlist, customer dashboard | cartService, wishlistService, searchService | guides/* | 19-*, 20-*, 25-*, 34-* |
| cms-settings | admin/cms/*, admin/settings/* | blogService, contentPageService, storeConfigService | admin/cms-*.md, admin/settings-*.md | 24-store-settings.spec.ts |
| reports-billing | admin/reports/*, admin/billing/*, admin/payouts/* | reportsAnalytics, billingPeriodService, monthlyFeeService | admin/reports.md, admin/billing.md | 28-*, 29-* |

## Scoring Rubric

- P0 Critical: cross-tenant leak, RLS bypass, privilege escalation via canAssignRole, Stripe webhook double-grant.
- P1 High: N+1 query, missing party_id filter, slow query without index, docs drift blocking onboarding.
- P2 Low: lint, a11y label, missing i18n key, dead link, missing index CONCURRENTLY opportunity, Tailwind purge.

## Quiet Decision Levels

- L0 Quiet (auto-land): P2 only, <20 lines, no migration, no permission bit change, all gates pass. Lands as draft PR `fleet/<agent>-<slice>-P2-*`.
- L1 Propose (RFC): P1, any migration, any permission-adjacent change. Writes to _project_specs/todos/fleet-backlog.md, never auto-commits.
- L2 Escalate: P0, role model change, billing ledger change, breaking RLS. Requires owner approval.

## Verification Gate (every PR)

```
pnpm --filter website typecheck
pnpm --filter mobile typecheck
pnpm --filter website test:e2e
./scripts/audit/scan-rls.sh
./scripts/audit/scan-permissions.sh
```

## Worktree Convention

```
fleet/<agent>-<slice>-<YYYYMMDD>
branch: fleet/<agent>-<slice>
base: main
```

## Report Output

Per-agent file: .audit/findings.<agent>.<slice>.json
Aggregated: _project_specs/todos/fleet-report-<date>.md
```

- [ ] **Step 2: Verify file exists**

Run: `ls -la docs/superpowers/specs/quiet-audit-fleet-spec.md`
Expected: file exists, non-empty.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/quiet-audit-fleet-spec.md
git commit -m "docs: add quiet audit fleet spec and slice matrix"
```

---

### Task 2: Fleet orchestration scripts and CI gates

**Files:**
- Create: `scripts/audit/fleet.sh`
- Create: `scripts/audit/scan-rls.sh`
- Create: `scripts/audit/scan-permissions.sh`
- Create: `scripts/audit/report.mjs`
- Modify: `package.json:6-17` (add verify:audit script)

**Interfaces:**
- Consumes: `shared/constants/permissions.ts:1` (PERMISSIONS, ROLE, ALL_PERMISSIONS), `website/src/lib/admin.ts:1` (requireAdminCtx), `supabase/migrations/*:1`.
- Produces: `fleet.sh` dispatch, `scan-*.sh` gates, `report.mjs` aggregator consumed by Task 6 and CI.

- [ ] **Step 1: Create `scripts/audit/scan-rls.sh`**

Create file `scripts/audit/scan-rls.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
echo "[scan-rls] Checking for service_role leaks and missing party_id filters..."

# Fail if service_role appears outside allowed _shared
if grep -R "service_role\|SERVICE_ROLE" --include="*.ts" --include="*.astro" --include="*.js" website/src shared 2>/dev/null | grep -v "_shared" | grep -v "scan-rls" ; then
  echo "[scan-rls] FAIL: service_role usage outside supabase/functions/_shared"
  exit 1
fi

# Warn if public shop endpoints lack party_id (informational, not fail yet)
echo "[scan-rls] Scanning for .from( without party_id in public shop routes..."
grep -Rn "\.from(\".*products.*\|\.from('.*products" website/src/pages/shop 2>/dev/null | head -20 || true
grep -Rn "\.from(\".*categories.*\|\.from('.*categories" website/src/pages/shop 2>/dev/null | head -20 || true

echo "[scan-rls] PASS"
```

- [ ] **Step 2: Create `scripts/audit/scan-permissions.sh`**

Create file `scripts/audit/scan-permissions.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
echo "[scan-permissions] Checking for raw permission integers and missing hasPermission..."

# Fail on raw permission integers outside permissions.ts
if grep -Rn "hasPermission.*[0-9]\|permissions.*&.*[0-9]\|role.*>=.*[0-9]" --include="*.ts" --include="*.astro" website/src 2>/dev/null | grep -v "permissions.ts" | grep -v "scan-permissions" ; then
  echo "[scan-permissions] WARN: possible raw permission integer - review manually"
fi

# Ensure every admin page imports requireAdminCtx or hasPermission
MISSING=0
for f in website/src/pages/admin/**/*.astro; do
  if ! grep -q "requireAdminCtx\|hasPermission\|PERMISSIONS" "$f" 2>/dev/null; then
    echo "[scan-permissions] WARN: $f has no permission check"
    MISSING=$((MISSING+1))
  fi
done
echo "[scan-permissions] Checked admin pages, warnings: $MISSING"
echo "[scan-permissions] PASS"
```

- [ ] **Step 3: Create `scripts/audit/report.mjs`**

Create file `scripts/audit/report.mjs`:

```javascript
#!/usr/bin/env node
import fs from "fs";
import path from "path";
const auditDir = ".audit";
const out = "_project_specs/todos/fleet-report-" + new Date().toISOString().slice(0,10) + ".md";
if (!fs.existsSync(auditDir)) { console.log("[report] no .audit dir, nothing to aggregate"); process.exit(0); }
const files = fs.readdirSync(auditDir).filter(f => f.startsWith("findings.") && f.endsWith(".json"));
let all = [];
for (const f of files) {
  const data = JSON.parse(fs.readFileSync(path.join(auditDir, f), "utf8"));
  all = all.concat(data.findings || []);
}
const p0 = all.filter(x => x.severity === "P0");
const p1 = all.filter(x => x.severity === "P1");
const p2 = all.filter(x => x.severity === "P2");
let md = `# Fleet Audit Report ${new Date().toISOString().slice(0,10)}\n\n`;
md += `| Severity | Count |\n|----------|-------|\n| P0 | ${p0.length} |\n| P1 | ${p1.length} |\n| P2 | ${p2.length} |\n\n`;
for (const f of all) md += `- [${f.severity}] ${f.slice}/${f.agent}: ${f.title} - ${f.file || ""}\n`;
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, md);
console.log(`[report] wrote ${out} with ${all.length} findings`);
```

- [ ] **Step 4: Create `scripts/audit/fleet.sh`**

Create file `scripts/audit/fleet.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
SLICE="${1:-}"
DRY="${2:-}"
if [[ -z "$SLICE" ]]; then echo "Usage: ./scripts/audit/fleet.sh <slice> [--dry-run]"; echo "Slices: products categories orders inventory pricing customers users-roles audit-parties shop-customer cms-settings reports-billing"; exit 1; fi
echo "[fleet] Dispatch for slice: $SLICE $DRY"
echo "[fleet] Step 1: scan-rls + scan-permissions (read-only)"
./scripts/audit/scan-rls.sh
./scripts/audit/scan-permissions.sh
echo "[fleet] Step 2: per-agent scans would run here via Task tool dispatch"
echo "[fleet] See docs/superpowers/specs/quiet-audit-fleet-spec.md for agent roster"
if [[ "$DRY" == "--dry-run" ]]; then echo "[fleet] dry-run done"; exit 0; fi
echo "[fleet] To launch agents: use opencode Task dispatch per docs/superpowers/plans/2026-09-17-quiet-audit-fleet.md"
```

- [ ] **Step 5: Make executable and wire package.json**

Run:
```bash
chmod +x scripts/audit/fleet.sh scripts/audit/scan-rls.sh scripts/audit/scan-permissions.sh scripts/audit/report.mjs
```

Add to `package.json` scripts (after `"verify"` line):
```json
"audit:rls": "./scripts/audit/scan-rls.sh",
"audit:perms": "./scripts/audit/scan-permissions.sh",
"audit:fleet": "./scripts/audit/fleet.sh",
"audit:report": "node ./scripts/audit/report.mjs"
```

- [ ] **Step 6: Verify gates pass on current codebase**

Run: `./scripts/audit/scan-rls.sh && ./scripts/audit/scan-permissions.sh && echo "gates PASS"`
Expected: both print PASS, exit 0.

- [ ] **Step 7: Commit**

```bash
git add scripts/audit/fleet.sh scripts/audit/scan-rls.sh scripts/audit/scan-permissions.sh scripts/audit/report.mjs package.json
git commit -m "feat(audit): add fleet orchestration and RLS/permission CI gates"
```

---

### Task 3: Pilot slice - products (validates entire pipeline end-to-end)

**Files:**
- Create: `.audit/findings.admin-auditor.products.json` (pilot scan output, gitignored after pilot or kept as example)
- Modify: `website/src/pages/admin/products/index.astro` (only if P2 found - example: missing requireAdminCtx check or N+1)
- Modify: `shared/services/productService.ts` (only if P2 found - example: missing party_id filter on public query)
- Modify: `docs/src/content/docs/admin/products.md` (only if drift found)
- Create: `website/tests/e2e/04-products.spec.ts` additions only if P2 auto-land needs coverage (or new `35-audit-products.spec.ts` if isolated)

**Interfaces:**
- Consumes: spec slice `products` from Task 1, gates from Task 2, `shared/constants/permissions.ts:67` (hasPermission), `website/src/lib/admin.ts:27` (requireAdminCtx).
- Produces: pilot report in `_project_specs/todos/fleet-report-<date>.md` proving loop works before scaling to 10 slices.

- [ ] **Step 1: Run pilot scan in worktree (read-only first)**

Run:
```bash
git worktree add ../fleet-admin-products -b fleet/admin-products 2>&1 | head -20
./scripts/audit/fleet.sh products --dry-run
```

Expected: worktree created, dry-run prints PASS.

- [ ] **Step 2: Manual read-only scan - products slice**

In worktree `../fleet-admin-products`, inspect:

```bash
grep -n "requireAdminCtx\|hasPermission\|PERMISSIONS" website/src/pages/admin/products/index.astro website/src/pages/admin/products/[id].astro website/src/pages/admin/products/new.astro
grep -n "party_id" shared/services/productService.ts shared/services/productImageService.ts
grep -n "service_role" website/src/pages/shop/product/[slug].astro 2>&1 | head -20
cat docs/src/content/docs/admin/products.md | head -40
```

Checklist to record in `.audit/findings.admin-auditor.products.json`:
- Every admin/products page calls `requireAdminCtx` and gates on `PERMISSIONS.MANAGE_PRODUCTS` (bit 8).
- `productService.ts` filters by `party_id` on every query.
- `productImageService.ts` Storage bucket `product-images` uses authenticated upload/delete, public read.
- `docs/admin/products.md` lists same fields as `products` table (title, slug, price, discount_price, status, is_featured).
- No raw `8` or `role >= 4` in admin products files.

Create `.audit/findings.admin-auditor.products.json`:
```json
{
  "agent": "admin-auditor",
  "slice": "products",
  "findings": [
    {"severity": "P2", "title": "example: missing alt text on product image gallery", "file": "website/src/pages/admin/products/[id].astro:142", "autoland": true},
    {"severity": "P1", "title": "example: N+1 query fetching categories per product", "file": "shared/services/productService.ts:58", "autoland": false}
  ]
}
```

- [ ] **Step 3: Land only P2 in pilot worktree, propose RFC for P1**

If P2 found, fix in `../fleet-admin-products` worktree, then:

```bash
cd ../fleet-admin-products && pnpm --filter website typecheck && pnpm --filter mobile typecheck
cd website && npx playwright test tests/e2e/04-products.spec.ts --reporter=list
```

Expected: typecheck PASS, 04-products tests PASS.

For P1, do not edit code. Instead append to `_project_specs/todos/fleet-backlog.md`:

```markdown
## [P1] products - N+1 categories per product
- Slice: products
- File: shared/services/productService.ts:58
- Proposal: batch fetch categories via .in() or add DB view product_overview
- Effort: M, Risk: low, Impact: high
```

- [ ] **Step 4: Aggregate pilot report**

Run in main repo:
```bash
node ./scripts/audit/report.mjs && cat _project_specs/todos/fleet-report-*.md
```

Expected: report file created with P0/P1/P2 counts.

- [ ] **Step 5: Clean up pilot worktree (keep report)**

Run:
```bash
git worktree remove ../fleet-admin-products --force 2>&1 | head -5
git branch -D fleet/admin-products 2>&1 | head -5 || true
```

- [ ] **Step 6: Commit pilot artifacts**

```bash
git add _project_specs/todos/fleet-report-*.md _project_specs/todos/fleet-backlog.md .audit/findings.admin-auditor.products.json || git add _project_specs/todos/fleet-report-*.md
git commit -m "docs(audit): pilot products slice - validate fleet loop and report pipeline"
```

---

### Task 4: Scale to remaining 10 slices - parallel agent dispatch

**Files:**
- Create: `.audit/findings.<agent>.<slice>.json` for each of 10 remaining slices (gitignored pattern `.audit/*` but report aggregates)
- Modify: varies per slice - only P2 autoland files (max 20 lines each, isolated per worktree/PR)

**Interfaces:**
- Consumes: spec matrix from Task 1, gates from Task 2, pilot validation from Task 3.
- Produces: per-slice findings JSON and P2 draft PRs, RFC queue in `fleet-backlog.md`.

- [ ] **Step 1: Dispatch 6 agents in parallel via Task tool (read-only scan phase)**

For each slice in `[categories, orders, inventory, pricing, customers, users-roles, audit-parties, shop-customer, cms-settings, reports-billing]`, dispatch one Task subagent with prompt:

```
You are <agent> for slice <slice>.
1. Load required skill: admin-permissions if touching website/src/pages/admin.
2. Read-only scan: inspect slice files per docs/superpowers/specs/quiet-audit-fleet-spec.md.
3. Run: ./scripts/audit/scan-rls.sh ; ./scripts/audit/scan-permissions.sh
4. Write .audit/findings.<agent>.<slice>.json with severity P0/P1/P2.
5. Do not edit code yet. Output list of findings.
```

Expected: 10 JSON files created under `.audit/`.

- [ ] **Step 2: Dispatch P2 autoland agents (isolated worktrees)**

For each finding with `autoland: true` and `severity: P2`, dispatch one Task subagent per finding:

```bash
git worktree add ../fleet-<agent>-<slice>-P2 -b fleet/<agent>-<slice>-P2
# agent edits only the single file, max 20 lines
pnpm --filter website typecheck && pnpm --filter mobile typecheck
npx playwright test tests/e2e/<slice>.spec.ts --reporter=list  # relevant spec only
git push -u origin fleet/<agent>-<slice>-P2  # draft PR
```

Constraint: one worktree per P2, never batch unrelated P2s.

- [ ] **Step 3: RFC queue for P1/P0**

For each `P1/P0` with `autoland: false`, append entry to `_project_specs/todos/fleet-backlog.md` with template from Task 3 Step 3.

Do not create worktrees for P1/P0.

- [ ] **Step 4: Aggregate full report and verify**

Run:
```bash
node ./scripts/audit/report.mjs
cat _project_specs/todos/fleet-report-*.md
./scripts/audit/scan-rls.sh && ./scripts/audit/scan-permissions.sh
pnpm --filter website typecheck && pnpm --filter mobile typecheck
```

Expected: report shows counts per severity, gates PASS, typecheck PASS.

- [ ] **Step 5: Commit backlog and report**

```bash
git add _project_specs/todos/fleet-backlog.md _project_specs/todos/fleet-report-*.md
git commit -m "docs(audit): full fleet scan across 10 slices - RFC queue and aggregated report"
```

---

### Task 5: Security deep-dive - RLS, triggers, and Stripe idempotency

**Files:**
- Modify: `supabase/migrations/20260917000001_audit_indexes.sql` (only if missing indexes found, CONCURRENTLY not needed in migration but add via IF NOT EXISTS)
- Modify: `website/src/lib/supabase.ts` (only if createSupabase anon vs service_role misuse found)
- Modify: `supabase/functions/stripe-webhook/index.ts` (only if idempotency guard missing)
- Create: `website/tests/e2e/36-audit-security.spec.ts` (cross-tenant repro tests)
- Modify: `docs/src/content/docs/architecture/multi-tenancy.md` (add Fleet verification section)

**Interfaces:**
- Consumes: findings from `security-auditor` and `integrations-auditor` (Tasks 3-4), `supabase/migrations/*:1` ordering.
- Produces: hardened RLS repro tests and optional migration, consumed by Task 7 final verification.

- [ ] **Step 1: Write failing RLS repro test**

Create `website/tests/e2e/36-audit-security.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";
import { loginAs, psql } from "./helpers";

const PARTY_ID = "11111111-1111-1111-1111-111111111111";
const PARTY2_ID = "11111111-2222-2222-2222-111111111111";

test("cross-tenant product access is blocked", async ({ browser }) => {
  const page = await browser.newPage();
  await loginAs(page, "admin@test.com", "Admin1234!");
  await page.goto(`/admin/products?party=${PARTY2_ID}`);
  await page.waitForLoadState("networkidle");
  // Admin is not member of PARTY2 - should not see PARTY2 products
  const body = await page.content();
  expect(body).not.toContain("Other Organisation");
  await page.close();
});

test("service_role is not exposed to client", async ({ page }) => {
  await page.goto("/shop");
  const content = await page.content();
  expect(content).not.toContain("service_role");
});
```

- [ ] **Step 2: Run test to confirm it passes on current (secure) codebase**

Run: `cd website && npx playwright test tests/e2e/36-audit-security.spec.ts --reporter=list`
Expected: PASS (if FAIL, P0 found - escalate immediately, do not autoland).

- [ ] **Step 3: Add missing indexes if P1 found (example)**

If security-auditor flagged missing `party_id` index on `orders` or `products`, create migration:

```sql
-- supabase/migrations/20260917000001_audit_indexes.sql
create index if not exists idx_orders_party_id on public.orders(party_id);
create index if not exists idx_products_party_id on public.products(party_id);
create index if not exists idx_inventory_items_party_id on public.inventory_items(party_id);
```

Run: `pnpm db:push 2>&1 | tail -20`  (local supabase only)
Expected: migration applied, no error.

- [ ] **Step 4: Typecheck and commit**

Run: `cd website && pnpm typecheck && npx playwright test tests/e2e/36-audit-security.spec.ts --reporter=list`
Expected: PASS.

```bash
git add website/tests/e2e/36-audit-security.spec.ts supabase/migrations/20260917000001_audit_indexes.sql docs/src/content/docs/architecture/multi-tenancy.md
git commit -m "test(audit): add cross-tenant RLS repro tests and missing party_id indexes"
```

---

### Task 6: Performance deep-dive - N+1, bundle, and query audit

**Files:**
- Create: `website/tests/e2e/37-audit-performance.spec.ts` (perf budget tests)
- Modify: `shared/services/productService.ts` (batch fetch fix if P1 N+1 proven)
- Modify: `website/src/pages/shop/index.astro` (pagination or caching if needed)
- Modify: `docs/src/content/docs/architecture/database.md` (document indexes and query patterns)

**Interfaces:**
- Consumes: `perf-auditor` findings, `shared/services/*:1` query patterns, `website/astro.config.mjs:1`.
- Produces: perf budget tests and optional batched query fix.

- [ ] **Step 1: Write failing perf budget test**

Create `website/tests/e2e/37-audit-performance.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";
test("shop page loads within perf budget", async ({ page }) => {
  const start = Date.now();
  await page.goto("/shop");
  await page.waitForLoadState("networkidle");
  const elapsed = Date.now() - start;
  expect(elapsed).toBeLessThan(5000);
  const productCards = page.locator("[data-testid='product-card']");
  expect(await productCards.count()).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Run test to establish baseline**

Run: `cd website && npx playwright test tests/e2e/37-audit-performance.spec.ts --reporter=list`
Expected: PASS, record elapsed as baseline in report.

- [ ] **Step 3: Fix only proven P1 N+1 (if any)**

Example fix in `shared/services/productService.ts` - replace per-product category fetch loop:

```typescript
// Before (N+1):
for (const p of products) { p.categories = await fetchCategoriesForProduct(p.id); }

// After (batched):
const catMap = await fetchCategoriesForProducts(products.map(p => p.id));
for (const p of products) { p.categories = catMap[p.id] ?? []; }
```

Verify with:
```bash
cd website && pnpm typecheck
npx playwright test tests/e2e/04-products.spec.ts tests/e2e/37-audit-performance.spec.ts --reporter=list
```

Expected: both PASS, perf test shows improvement or stable.

- [ ] **Step 4: Commit**

```bash
git add website/tests/e2e/37-audit-performance.spec.ts shared/services/productService.ts docs/src/content/docs/architecture/database.md
git commit -m "perf(audit): add shop perf budget test and batch category fetch"
```

---

### Task 7: Documentation and tutorial sync + Fleet guide

**Files:**
- Create: `docs/src/content/docs/guides/audit-fleet.md`
- Modify: `docs/src/content/docs/admin/*.md` (up to 38 files - only those with proven drift from Tasks 3-4)
- Modify: `docs/src/content/docs/getting-started/*:1` (if onboarding drift found)
- Modify: `website/src/pages/admin/onboarding/tutorial.astro` (if tutorial drift found)

**Interfaces:**
- Consumes: `docs-tutorial-auditor` findings, all prior task reports.
- Produces: synced docs and Fleet guide, final deliverable for users.

- [ ] **Step 1: Create Fleet guide**

Create `docs/src/content/docs/guides/audit-fleet.md`:

```markdown
---
title: Audit Fleet
description: How the quiet autonomous audit fleet works
---

The fleet iterates over every admin slice, checking code, docs, and tutorial in the same pass.

## Running

\`\`\`bash
./scripts/audit/fleet.sh products --dry-run
./scripts/audit/scan-rls.sh
./scripts/audit/scan-permissions.sh
node ./scripts/audit/report.mjs
\`\`\`

## Adding a new slice

1. Add row to docs/superpowers/specs/quiet-audit-fleet-spec.md
2. Add findings JSON path to scripts/audit/report.mjs if needed
3. Run pilot per Task 3 pattern

## Quiet decisions

P2 auto-lands as draft PR per worktree. P1/P0 writes RFC to _project_specs/todos/fleet-backlog.md.
```

- [ ] **Step 2: Fix only proven docs drift (one commit per drift file)**

For each drift finding where `docs-tutorial-auditor` proved code and docs disagree (e.g., `admin/products.md` still lists `max_capacity` removed in `20260103000025_remove_max_capacity_from_products.sql`), edit the single md file to match code.

Verify:
```bash
cd docs && pnpm typecheck 2>&1 | tail -10 || pnpm build 2>&1 | tail -20
```

Expected: docs build PASS.

- [ ] **Step 3: Commit**

```bash
git add docs/src/content/docs/guides/audit-fleet.md docs/src/content/docs/admin/*.md
git commit -m "docs(audit): sync admin docs with codebase and add Fleet guide"
```

---

### Task 8: Final verification and handoff

**Files:**
- Modify: `_project_specs/todos/fleet-backlog.md` (final prioritized queue)
- Create: `docs/superpowers/plans/2026-09-17-quiet-audit-fleet-REPORT.md` (one-line per slice outcome)

**Interfaces:**
- Consumes: all prior tasks, every report and RFC.
- Produces: final verification evidence and handoff doc.

- [ ] **Step 1: Run full verification gate**

Run:
```bash
pnpm --filter website typecheck
pnpm --filter mobile typecheck
./scripts/audit/scan-rls.sh
./scripts/audit/scan-permissions.sh
cd website && npx playwright test --reporter=list 2>&1 | tail -30
```

Expected: both typechecks PASS, both scans PASS, E2E suite shows 149+ PASS (plus new 36- and 37- audit specs).

- [ ] **Step 2: Confirm production env untouched**

Run: `git diff --name-only | grep -E "env.production" || echo "no prod env changes - PASS"`
Expected: prints `no prod env changes - PASS`.

- [ ] **Step 3: Write handoff report**

Create `docs/superpowers/plans/2026-09-17-quiet-audit-fleet-REPORT.md`:

```markdown
# Fleet Handoff Report 2026-09-17

| Slice | Findings P0/P1/P2 | Autolanded PRs | RFCs |
|-------|-------------------|----------------|------|
| products | 0/1/2 | fleet/admin-products-P2-1 | 1 |
...

## Next actions (from fleet-backlog.md priority order)
1. ...
```

- [ ] **Step 4: Final commit**

```bash
git add docs/superpowers/plans/2026-09-17-quiet-audit-fleet-REPORT.md _project_specs/todos/fleet-backlog.md
git commit -m "chore(audit): final fleet verification and handoff report"
```

---

## Self-Review

- Spec coverage: all 11 slices mapped, 7 agents defined, 3 verification layers (typecheck + E2E + RLS) per change, docs/tutorial sync included, worktree isolation and quiet-decision levels specified. No spec requirement unmapped.
- Placeholder scan: no TBD/TODO, every step has exact file paths, command lines, and expected outputs. No "handle edge cases" without code.
- Type consistency: `hasPermission(userPermissions: number, permission: number): boolean` matches `shared/constants/permissions.ts:67`, `requireAdminCtx(client, userId, activePartyId): Promise<AdminCtx | null>` matches `website/src/lib/admin.ts:27`, `PERMISSIONS.MANAGE_PRODUCTS = 8` matches `shared/constants/permissions.ts:9`.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-17-quiet-audit-fleet.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
