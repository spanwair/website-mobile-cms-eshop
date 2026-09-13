---
title: E2E Test Suite
description: How the 132 automated end-to-end tests work and how to run them.
---

## What the tests do

The E2E (end-to-end) tests use **Playwright** to open a real browser, click through every admin page, fill out forms, and verify the results. They test the entire system — from the database to the UI — in one pass.

The tests run with a **visible browser** (headed mode) locally so you can watch them work. In CI they run headless.

## Running the tests

```bash
cd website
node_modules/.bin/playwright test --timeout=60000
```

Or with the full path from the project root:
```bash
cd /path/to/website-mobile-template/website
node_modules/.bin/playwright test
```

## Prerequisites

Before running tests:
1. **Local Supabase must be running**: `supabase start`
2. **Dev server must be running**: `cd website && pnpm dev` (in a separate terminal)
3. **Test users must exist** in the local Supabase auth

## The global setup

Before any test runs, `tests/e2e/global-setup.ts` runs automatically. It:
1. Resets passwords for the three test accounts
2. Cleans up all test data from previous runs
3. Seeds fresh test data (organization, product, order, coupon, notification, etc.)

This ensures each test run starts from a known state.

## Test accounts

| Email | Password | Role |
|-------|----------|------|
| `admin@test.com` | `Admin1234!` | Owner (8) |
| `eshop@test.com` | `Eshop1234!` | Eshop Admin (2) |
| `user@test.com` | `User1234!` | User (1) |

## The 12 test files

| File | Tests | What it covers |
|------|-------|---------------|
| `01-auth.spec.ts` | 9 | Login, logout, wrong password, role-based redirect |
| `02-parties.spec.ts` | 12 | Create/edit/delete organizations, member management |
| `03-categories.spec.ts` | 10 | Category tree CRUD, parent-child, delete |
| `04-products.spec.ts` | 16 | Product CRUD, search, filter, status changes |
| `05-orders.spec.ts` | 12 | Order status transitions, customer link, tracking |
| `06-customers.spec.ts` | 8 | Customer CRUD, search, order history |
| `07-pricing.spec.ts` | 12 | Discount rules, coupon creation, duplicate code |
| `08-inventory.spec.ts` | 10 | Stock adjustments, low stock filter, badge |
| `09-users-roles.spec.ts` | 14 | Role assignment, custom role create/delete |
| `10-audit-notifications.spec.ts` | 10 | Audit log filter, notification display |
| `11-dashboard.spec.ts` | 8 | KPI cards, sidebar navigation |
| `12-access-control.spec.ts` | 9 | Auth guards, role-based page access |
| `13-new-features.spec.ts` | 17 | Categories on products, image uploads, user hierarchy visibility |

**Total: 149 tests — all passing.**

## Screenshots

Every test step takes a screenshot saved to `tests/screenshots/`. After a test run, you can browse these to see exactly what happened at each step.

## Serial mode

Tests within each spec file run **serially** (one after another, sharing a browser page). This allows tests to build on each other — e.g. test 3 creates a category, test 4 verifies it's in the list.

Test files themselves also run serially (one file at a time) to avoid race conditions.

## Fixing a failing test

1. Run just the failing file: `node_modules/.bin/playwright test tests/e2e/03-categories.spec.ts`
2. Look at the screenshot for that test in `tests/screenshots/`
3. Check the error message — usually a locator mismatch or a timing issue
4. Fix either the test or the underlying app bug
5. Re-run the full suite to confirm nothing else broke

## Common test issues

| Problem | Fix |
|---------|-----|
| "strict mode violation: X resolved to 2 elements" | Use a more specific selector — `getByRole("cell", { name: "X", exact: true })` |
| `selectOption({ label: /regex/ })` fails | Playwright requires a string for label — use `{ label: "Exact Label" }` or `{ index: 1 }` |
| Czech text not matching `/english/i` | Add Czech alternative: `/english\|česky/i` or navigate by URL instead of clicking tabs |
| "Target page... has been closed" | Previous test navigated away — add `page.goto(URL)` at the start of the affected test |
