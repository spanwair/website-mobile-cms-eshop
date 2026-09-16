# Fleet Audit Backlog (RFCs for P1/P0 requiring human review)

## [P1] products - N+1 categories per product
- Slice: products
- File: shared/services/productService.ts:58
- Proposal: batch fetch categories via .in() or add DB view product_overview
- Effort: M, Risk: low, Impact: high
