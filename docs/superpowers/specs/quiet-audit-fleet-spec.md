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
