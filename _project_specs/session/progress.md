# Master Progress Tracker
# System Improvements – Auth, CMS, RBAC, E-Shop, UI

> **Protocol:** Every agent picks tasks from this file, sets status to `IN_PROGRESS`, completes work, sets status to `REVIEW`, then Disclaimer agent validates and sets `DONE`.
> **Status values:** `PENDING` | `IN_PROGRESS` | `REVIEW` | `DONE` | `BLOCKED`

---

## PHASE 1 — Database Migrations (Supabase Specialist)
*All other phases depend on Phase 1. Agents A & B run in parallel.*

| ID | Task | Agent | Status | File(s) |
|----|------|-------|--------|---------|
| DB-001 | Party + RBAC schema (parties, roles, permissions bitmask, user_party_roles) | Supabase-A | IN_PROGRESS | 20260102000001_parties_rbac.sql |
| DB-002 | Profile extension (full_name, email, phone, google_metadata, soft-delete) | Supabase-A | IN_PROGRESS | 20260102000002_profiles_extend.sql |
| DB-003 | Audit log schema (audit_logs table — all admin actions) | Supabase-A | IN_PROGRESS | 20260102000003_audit_logs.sql |
| DB-004 | Notifications schema (notifications table + user_notifications) | Supabase-A | IN_PROGRESS | 20260102000004_notifications.sql |
| DB-005 | E-shop core: products, categories, brands, variants, images, tags | Supabase-B | REVIEW | 20260102000005_eshop_catalog.sql |
| DB-006 | E-shop transactions: orders, order_items, customers, addresses | Supabase-B | REVIEW | 20260102000006_eshop_orders.sql |
| DB-007 | E-shop pricing: price_lists, discount_rules, coupons, promotions | Supabase-B | REVIEW | 20260102000007_eshop_pricing.sql |
| DB-008 | E-shop inventory: warehouses, inventory_items, stock_movements | Supabase-B | REVIEW | 20260102000008_eshop_inventory.sql |

---

## PHASE 2 — Shared Layer (Architect)
*Depends on Phase 1 migrations being written. Can start once DB-001–008 are DONE.*

| ID | Task | Agent | Status | File(s) |
|----|------|-------|--------|---------|
| SH-001 | Update shared/supabase/types.ts (regenerated from all new tables) | Architect | DONE | shared/supabase/types.ts |
| SH-002 | Update shared/types/index.ts (Party, Role, Permission, Product, Order, etc.) | Architect | DONE | shared/types/index.ts |
| SH-003 | Permissions service + bitmask constants | Architect | DONE | shared/services/permissionsService.ts, shared/constants/permissions.ts |
| SH-004 | Party service (CRUD + membership + invitations) | Architect | DONE | shared/services/partyService.ts |
| SH-005 | Product service (CRUD + variants + images + SEO) | Architect | DONE | shared/services/productService.ts |
| SH-006 | Category service (nested categories) | Architect | DONE | shared/services/categoryService.ts |
| SH-007 | Order service (CRUD + status workflow + items) | Architect | DONE | shared/services/orderService.ts |
| SH-008 | Customer service (profile + addresses + history) | Architect | DONE | shared/services/customerService.ts |
| SH-009 | Inventory service (stock + movements + alerts) | Architect | DONE | shared/services/inventoryService.ts |
| SH-010 | Pricing service (price lists + discounts + coupons) | Architect | DONE | shared/services/pricingService.ts |
| SH-011 | Audit service (log writes + reads) | Architect | DONE | shared/services/auditService.ts |
| SH-012 | Notification service (create + fetch + mark read) | Architect | DONE | shared/services/notificationService.ts |
| SH-013 | Update authService.ts (Google OAuth: capture name/email/photo, upsert profile) | Architect | DONE | shared/services/authService.ts |

---

## PHASE 3 — Website Foundation (Website Specialist)
*WEB-001 can run in parallel with Phase 1 & 2 (pure UI). WEB-002+ need Phase 2 done.*

| ID | Task | Agent | Status | File(s) |
|----|------|-------|--------|---------|
| WEB-001 | Light theme redesign: global CSS tokens, Layout.astro overhaul | Website | IN_PROGRESS | website/src/styles/global.css, website/src/components/layout/Layout.astro |
| WEB-002 | Auth pages: login with Google button, registration captures full name | Website | IN_PROGRESS | website/src/pages/login.astro, website/src/pages/auth/callback.astro |
| WEB-003 | CMS sidebar navigation component (modular, permission-aware) | Website | IN_PROGRESS | website/src/components/cms/Sidebar.astro |
| WEB-004 | CMS Layout wrapper for all admin pages | Website | IN_PROGRESS | website/src/components/cms/CmsLayout.astro |

---

## PHASE 4 — Website CMS Pages (Website Specialist)
*Depends on Phase 2 + Phase 3 foundation (WEB-001..004).*

| ID | Task | Agent | Status | File(s) |
|----|------|-------|--------|---------|
| WEB-005 | Admin Dashboard (KPI cards + chart placeholders + recent activity) | Website | DONE | website/src/pages/admin/index.astro |
| WEB-006 | Product management: list + create + edit + delete | Website | DONE | website/src/pages/admin/products/*.astro |
| WEB-007 | Category management: nested tree + CRUD | Website | DONE | website/src/pages/admin/categories/*.astro |
| WEB-008 | Order management: list + detail + status workflow | Website | DONE | website/src/pages/admin/orders/*.astro |
| WEB-009 | Customer management: list + detail | Website | DONE | website/src/pages/admin/customers/*.astro |
| WEB-010 | Pricing management: price lists + discounts + coupons | Website | DONE | website/src/pages/admin/pricing/*.astro |
| WEB-011 | Inventory management: stock overview + movements + alerts | Website | DONE | website/src/pages/admin/inventory/*.astro |
| WEB-012 | Reports: revenue + orders + products + export | Website | DONE | website/src/pages/admin/reports/index.astro |
| WEB-013 | User & Role management (RBAC): users list + roles + permission editor | Website | DONE | website/src/pages/admin/users/*.astro, website/src/pages/admin/roles/*.astro |
| WEB-014 | Party management: org list + detail + members + invitations | Website | DONE | website/src/pages/admin/parties/*.astro |
| WEB-015 | Notification center: in-app notifications panel | Website | DONE | website/src/components/cms/NotificationPanel.astro |
| WEB-016 | Audit log viewer | Website | DONE | website/src/pages/admin/audit/index.astro |

---

## PHASE 5 — Mobile (Mobile Specialist)
*Can start WEB-001-equivalent in parallel; full admin screens need Phase 2.*

| ID | Task | Agent | Status | File(s) |
|----|------|-------|--------|---------|
| MOB-001 | Light theme: update shared/constants/theme.ts + mobile tailwind config | Mobile | DONE | shared/constants/theme.ts, mobile/tailwind.config.ts |
| MOB-002 | Update all mobile UI components (Button, Card, Input, Text) for light theme | Mobile | DONE | mobile/src/components/ui/*.tsx |
| MOB-003 | Mobile admin dashboard screen | Mobile | DONE | mobile/src/screens/Admin/AdminDashboardScreen.tsx |
| MOB-004 | Mobile auth screen: Google sign-in + full name field on register | Mobile | DONE | mobile/src/screens/Auth/LoginScreen.tsx |
| MOB-005 | Mobile profile screen: shows full name, avatar, role | Mobile | DONE | mobile/src/screens/Profile/ProfileScreen.tsx |
| MOB-006 | Navigation updates (permission-aware routes) | Mobile | DONE | mobile/src/navigation/AppNavigator.tsx |

---

## PHASE 6 — Disclaimer Review (Disclaimer Agent)
*Runs after each task batch is marked REVIEW.*

| ID | Task | Agent | Status | Notes |
|----|------|-------|--------|-------|
| DIS-001 | Review DB migrations (DB-001..008) | Disclaimer | DONE | Check: no hardcoding, proper RLS, correct FK |
| DIS-002 | Review shared layer (SH-001..013) | Disclaimer | DONE | Check: max 200 lines, no fallbacks, no comments on obvious |
| DIS-003 | Review website (WEB-001..016) | Disclaimer | DONE | Check: light theme, permission guards, no dark backgrounds |
| DIS-004 | Review mobile (MOB-001..006) | Disclaimer | DONE | Check: theme consistency, no duplicated logic from shared/ |

---

## PHASE 7 — Code Quality (Tester + Code Reviewer)
| ID | Task | Agent | Status |
|----|------|-------|--------|
| CQ-001 | TypeScript typecheck: mobile + website | Tester | PENDING |
| CQ-002 | ESLint pass: mobile | Tester | PENDING |
| CQ-003 | Final code review: architecture + correctness | Code Reviewer | PENDING |

---

## Agent Assignments (current session)

| Agent | Role | Phase | Working On |
|-------|------|-------|------------|
| Supabase-A | DB migrations (RBAC + auth + audit + notif) | 1 | DB-001..004 |
| Supabase-B | DB migrations (e-shop) | 1 | DB-005..008 |
| Website-Theme | Light theme + foundation | 3 | WEB-001..004 |
| Architect | Shared types + services | 2 | SH-001..013 |
| Website-CMS | CMS pages | 4 | WEB-005..016 |
| Mobile | Mobile screens + theme | 5 | MOB-001..006 |
| Disclaimer | Review gate | 6 | All |
