# Fleet Audit Report 2026-09-16

| Severity | Count |
|----------|-------|
| P0 | 0 |
| P1 | 11 |
| P2 | 11 |

- [P2] categories/admin-auditor: missing aria-expanded on category tree toggle - website/src/pages/admin/categories/index.astro:88
- [P1] categories/admin-auditor: N+1 product count per category without batch query - shared/services/categoryService.ts:42
- [P2] customers/admin-auditor: customer email link missing rel noopener on external mailto fallback - website/src/pages/admin/customers/index.astro:64
- [P1] customers/admin-auditor: customers list query lacks party_id scoping when search term present - shared/services/customerService.ts:38
- [P2] inventory/admin-auditor: low-stock threshold input missing accessible label - website/src/pages/admin/inventory/index.astro:102
- [P1] inventory/admin-auditor: inventory stock deduction not wrapped in transaction with cross-party check - shared/services/inventoryService.ts:94
- [P2] orders/admin-auditor: missing i18n key for order status badge fallback - website/src/pages/admin/orders/index.astro:115
- [P1] orders/admin-auditor: orders query missing index on party_id+status composite - shared/services/orderService.ts:67
- [P2] pricing/admin-auditor: coupon code input missing autocomplete off and aria-describedby - website/src/pages/admin/pricing/index.astro:76
- [P1] pricing/admin-auditor: pricing discount validation allows discount_price >= price when party overrides missing - shared/services/pricingService.ts:51
- [P2] products/admin-auditor: example: missing alt text on product image gallery - website/src/pages/admin/products/[id].astro:142
- [P1] products/admin-auditor: example: N+1 query fetching categories per product - shared/services/productService.ts:58
- [P2] cms-settings/docs-tutorial-auditor: CMS page slug help text missing link to docs slug convention - website/src/pages/admin/cms/index.astro:61
- [P1] cms-settings/docs-tutorial-auditor: docs/src/content/docs/admin/cms*.md drift: storeConfigService fields not documented - docs/src/content/docs/admin/cms.md:18
- [P2] reports-billing/integrations-auditor: billing period chart placeholder missing empty-state a11y announcement - website/src/pages/admin/billing/index.astro:133
- [P1] reports-billing/integrations-auditor: commission ledger aggregation recomputed per request without materialized view or cache - shared/services/commissionLedgerService.ts:58
- [P2] shop-customer/perf-auditor: shop product grid images missing loading=lazy and decoding async - website/src/pages/shop/index.astro:92
- [P1] shop-customer/perf-auditor: shop product listing fetches images per product (N+1) instead of joining product_images - website/src/pages/shop/index.astro:44
- [P2] audit-parties/security-auditor: audit log timestamp column missing locale-aware formatting helper - website/src/pages/admin/audit/index.astro:71
- [P1] audit-parties/security-auditor: auditService queries audit_log without party_id filter when filtering by user - shared/services/auditService.ts:44
- [P2] users-roles/security-auditor: role checkbox group missing fieldset legend for a11y - website/src/pages/admin/roles/index.astro:54
- [P1] users-roles/security-auditor: canAssignRole check not covering party-scoped ESHOP_ADMIN elevation via invite link - shared/services/permissionsService.ts:29
