---
title: Test Coverage
description: What is tested and what is not.
---

## Current coverage (149 tests, 100% passing)

### Authentication (01-auth)
- ✅ Admin login with valid credentials
- ✅ Wrong password shows error message
- ✅ Non-existent email shows error message
- ✅ Unauthenticated access to /admin redirects to /login
- ✅ Unauthenticated access to /admin/products redirects
- ✅ Unauthenticated access to /admin/orders redirects
- ✅ USER role (1) blocked from /admin
- ✅ ESHOP_ADMIN can access /admin
- ✅ Session persists across navigation

### Organizations / Parties (02-parties)
- ✅ Party list loads and shows seeded organization
- ✅ Create new party with full fields
- ✅ Create new party with required fields only
- ✅ Duplicate slug shows form error
- ✅ Empty name triggers browser validation
- ✅ Party detail page loads with all fields
- ✅ Invite member to party
- ✅ Duplicate invite shows error
- ✅ Remove member with confirmation
- ✅ Active badge visible
- ✅ Party count updates in toolbar
- ✅ Delete second party

### Categories (03-categories)
- ✅ Category list loads
- ✅ Create root category
- ✅ Create child category (parent select)
- ✅ Create category with icon and sort_order
- ✅ Category tree shows hierarchy
- ✅ Edit category name
- ✅ Toggle visibility
- ✅ Duplicate slug shows form error
- ✅ Delete leaf category
- ✅ Delete root category

### Products (04-products)
- ✅ Product list loads
- ✅ Search by title
- ✅ Filter by status (active / draft)
- ✅ Create draft product
- ✅ Create active featured product
- ✅ Product detail pre-fills values
- ✅ Edit product title and price
- ✅ Change status draft→active
- ✅ Change status active→inactive
- ✅ Duplicate slug shows form error
- ✅ Seed product detail page works
- ✅ Price formatting in list
- ✅ (+ 4 more)

### Orders (05-orders) — 12 tests
- ✅ Full status lifecycle (pending→confirmed→processing→shipped→delivered)
- ✅ Status tab filtering
- ✅ Order detail page
- ✅ Customer link from order
- ✅ Tracking number save

### Customers (06-customers) — 8 tests
- ✅ List, search, detail, edit
- ✅ Order history on customer page
- ✅ Toggle active status

### Pricing (07-pricing) — 12 tests
- ✅ Discount rule visible with badge
- ✅ Coupon tabs navigation
- ✅ SEED10 coupon shows active + 0 uses
- ✅ Create PROMO20 coupon
- ✅ Duplicate coupon code error

### Inventory (08-inventory) — 10 tests
- ✅ Seeded item shows qty=50
- ✅ Stock adjustments (purchase +20, damage -5, return +3)
- ✅ Low stock scenario (damage -60 → qty=8 < threshold=10)
- ✅ Low stock badge appears
- ✅ Low stock filter shows item

### Users & Roles (09-users-roles) — 14 tests
- ✅ Users list with all test accounts
- ✅ Owner badge (red)
- ✅ "You" indicator on own row
- ✅ Role change form on other users
- ✅ Change user role, revert after test
- ✅ Super Admin system role visible
- ✅ System role has no delete button
- ✅ Create custom role with permissions
- ✅ Permission chips shown
- ✅ Delete custom role

### Audit & Notifications (10-audit) — 10 tests
- ✅ Audit log page loads
- ✅ Filter by table dropdown
- ✅ Total count visible
- ✅ Notification page loads
- ✅ Seeded notification visible
- ✅ Unread badge

### Dashboard (11-dashboard) — 8 tests
- ✅ 6 KPI cards visible with values
- ✅ Sidebar navigation
- ✅ Navigate to products from sidebar
- ✅ Navigate to orders from sidebar

### Access Control (12-access-control) — 9 tests
- ✅ Unauthenticated cannot access /admin, /admin/users, /admin/inventory
- ✅ USER (1) blocked from /admin
- ✅ ESHOP_ADMIN can access /admin, /admin/products, /admin/orders
- ✅ Sidebar shows correct links for role

### New Features (13-new-features) — 17 tests
- ✅ Category checkboxes shown on product edit page
- ✅ Assign category to product, verify persists on reload
- ✅ Unassign category, verify cleared on reload
- ✅ Image upload form visible
- ✅ Upload a product image (real file upload)
- ✅ Uploaded image appears in gallery
- ✅ First image has Set Primary button (not primary by default)
- ✅ Set image as primary → badge appears, Set Primary button gone
- ✅ Delete image → gallery count decreases
- ✅ After deleting last image → grid hidden, upload form still present
- ✅ OWNER (role=8) sees all users in admin
- ✅ ESHOP_ADMIN does not see OWNER in users list
- ✅ ESHOP_ADMIN sees own account
- ✅ ESHOP_ADMIN does not see USER outside their party

## Not yet tested (future)

- Order cancellation
- Customer group pricing
- Mobile app flows
- API rate limiting
- Large dataset pagination
