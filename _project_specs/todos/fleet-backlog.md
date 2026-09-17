# Fleet Audit Backlog (RFCs for P1/P0 requiring human review)

## [P1] products - N+1 categories per product
- Slice: products
- File: shared/services/productService.ts:58
- Proposal: batch fetch categories via .in() or add DB view product_overview
- Effort: M, Risk: low, Impact: high

## [P1] categories - N+1 product count per category without batch query
- Slice: categories
- File: shared/services/categoryService.ts:42
- Proposal: replace per-category count query with single grouped count via .select count or DB view category_product_counts
- Effort: M, Risk: low, Impact: medium

## [P1] orders - orders query missing index on party_id+status composite
- Slice: orders
- File: shared/services/orderService.ts:67
- Proposal: add CREATE INDEX CONCURRENTLY on orders(party_id, status) and verify query plan with EXPLAIN
- Effort: S, Risk: low, Impact: medium

## [P1] inventory - inventory stock deduction not wrapped in transaction with cross-party check
- Slice: inventory
- File: shared/services/inventoryService.ts:94
- Proposal: wrap stock deduction + movement insert in rpc or use supabase transaction helper; add cross-party trigger test
- Effort: M, Risk: medium, Impact: high

## [P1] pricing - pricing discount validation allows discount_price >= price when party overrides missing
- Slice: pricing
- File: shared/services/pricingService.ts:51
- Proposal: add guard if discount_price present then discount_price < price else reject; cover with unit test
- Effort: S, Risk: low, Impact: high

## [P1] customers - customers list query lacks party_id scoping when search term present
- Slice: customers
- File: shared/services/customerService.ts:38
- Proposal: ensure search branch also appends .eq party_id and add RLS regression E2E for cross-party search
- Effort: S, Risk: high, Impact: high

## [P1] users-roles - canAssignRole check not covering party-scoped ESHOP_ADMIN elevation via invite link
- Slice: users-roles
- File: shared/services/permissionsService.ts:29
- Proposal: add invite-token path check that verifies assigner has MANAGE_ROLES on target party and cannot elevate beyond own role
- Effort: M, Risk: high, Impact: high

## [P1] audit-parties - auditService queries audit_log without party_id filter when filtering by user
- Slice: audit-parties
- File: shared/services/auditService.ts:44
- Proposal: require party_id param for audit queries or enforce RLS filter at service layer; add scan-rls rule for audit_log
- Effort: S, Risk: medium, Impact: high

## [P1] shop-customer - shop product listing fetches images per product (N+1) instead of joining product_images
- Slice: shop-customer
- File: website/src/pages/shop/index.astro:44
- Proposal: single query with join on product_images or include via view product_with_images; add loading skeleton
- Effort: M, Risk: low, Impact: high

## [P1] cms-settings - docs/src/content/docs/admin/cms*.md drift: storeConfigService fields not documented
- Slice: cms-settings
- File: docs/src/content/docs/admin/cms.md:18
- Proposal: sync docs fields with storeConfigService schema (branding, layout, badges) and add docs drift CI check
- Effort: S, Risk: low, Impact: medium

## [P1] reports-billing - commission ledger aggregation recomputed per request without materialized view or cache
- Slice: reports-billing
- File: shared/services/commissionLedgerService.ts:58
- Proposal: add materialized view or monthly cache table with cron refresh; measure before/after via EXPLAIN ANALYZE
- Effort: M, Risk: medium, Impact: high
