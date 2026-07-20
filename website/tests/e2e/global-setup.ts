import { execSync } from "child_process";
import { writeFileSync, unlinkSync } from "fs";

const OWNER_ID = "ffffffff-0000-0000-0000-000000000008";
const ADMIN_ID = "27d68c79-fb83-43e4-83fa-b2d3a6f15c7f";
const USER_ID = "6f9296bf-3073-4c85-a7b6-ec227ff1b758";
const ESHOP_ID = "bf11ea77-6a24-4fc8-8487-882d6a48c8ba";
// Role with MANAGE_PRODUCTS only (bit 8) — tests limited eshop_admin access
const LIMITED_ESHOP_ROLE_ID = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";
// Role with VIEW_DASHBOARD + MANAGE_PRODUCTS + MANAGE_CATEGORIES (1|8|16=25) — tests dashboard section gating
const DASHBOARD_PROD_CAT_ROLE_ID = "dddddddd-dddd-dddd-dddd-dddddddddddd";

const PARTY_ID = "11111111-1111-1111-1111-111111111111";
const PARTY2_ID = "11111111-2222-2222-2222-111111111111";
const CUSTOMER_ID = "22222222-2222-2222-2222-111111111111";
const WAREHOUSE_ID = "33333333-3333-3333-3333-111111111111";
const PRODUCT_ID = "44444444-4444-4444-4444-111111111111";
const INVENTORY_ID = "55555555-5555-5555-5555-111111111111";
const ORDER_ID = "66666666-6666-6666-6666-111111111111";
const RULE_ID = "77777777-7777-7777-7777-111111111111";
const COUPON_ID = "88888888-8888-8888-8888-111111111111";
const NOTIF_ID = "99999999-9999-9999-9999-111111111111";

const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const SUPABASE_URL = "http://127.0.0.1:54321";
const CATEGORY_ID = "aa111111-1111-1111-1111-111111111111";

function psql(sql: string) {
  const tmp = `/tmp/e2e-${Date.now()}.sql`;
  writeFileSync(tmp, sql);
  try {
    return execSync(
      `PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f ${tmp}`,
      { stdio: "pipe" }
    ).toString();
  } finally {
    unlinkSync(tmp);
  }
}


function apiPut(path: string, body: Record<string, unknown>) {
  return execSync(
    `curl -s -X PUT "${SUPABASE_URL}/auth/v1/admin${path}" \
      -H "apikey: ${SERVICE_ROLE_KEY}" \
      -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
      -H "Content-Type: application/json" \
      -d '${JSON.stringify(body)}'`,
    { stdio: "pipe" }
  ).toString();
}

export default async function globalSetup() {
  // Ensure owner auth user exists (create if missing, then ensure profile row exists)
  const ownerCheck = execSync(
    `curl -s "${SUPABASE_URL}/auth/v1/admin/users/${OWNER_ID}" \
      -H "apikey: ${SERVICE_ROLE_KEY}" \
      -H "Authorization: Bearer ${SERVICE_ROLE_KEY}"`,
    { stdio: "pipe" }
  ).toString();
  if (ownerCheck.includes('"error"') || !ownerCheck.includes(OWNER_ID)) {
    execSync(
      `curl -s -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
        -H "apikey: ${SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -d '{"id":"${OWNER_ID}","email":"owner@test.com","password":"Owner1234!","email_confirm":true}'`,
      { stdio: "pipe" }
    );
    // Wait briefly for auth trigger to create the profile
    execSync("sleep 1");
  }
  // Ensure profile row exists (trigger may not fire in test env)
  psql(`
    SET session_replication_role = replica;
    INSERT INTO public.profiles (id, role, display_name)
    VALUES ('${OWNER_ID}', 8, 'Owner')
    ON CONFLICT (id) DO NOTHING;
    SET session_replication_role = DEFAULT;
  `);

  // Reset passwords for test users (idempotent)
  apiPut(`/users/${OWNER_ID}`, { password: "Owner1234!" });
  apiPut(`/users/${ADMIN_ID}`, { password: "Admin1234!" });
  apiPut(`/users/${USER_ID}`, { password: "User1234!" });
  apiPut(`/users/${ESHOP_ID}`, { password: "Eshop1234!" });
  console.log("[global-setup] Test user passwords reset.");

  // Clean up in dependency order (replica mode bypasses triggers/RLS)
  const replica = "SET session_replication_role = replica;";
  const defaultRole = "SET session_replication_role = DEFAULT;";

  psql(`${replica} DELETE FROM public.user_notifications WHERE notification_id = '${NOTIF_ID}'; ${defaultRole}`);
  psql(`${replica} DELETE FROM public.notifications WHERE id = '${NOTIF_ID}'; ${defaultRole}`);
  psql(`${replica} DELETE FROM public.coupons WHERE id = '${COUPON_ID}' OR (party_id = '${PARTY_ID}' AND code NOT IN ('__NEVER__')); ${defaultRole}`);
  psql(`${replica} DELETE FROM public.discount_rules WHERE id = '${RULE_ID}'; ${defaultRole}`);
  psql(`${replica} DELETE FROM public.orders WHERE id = '${ORDER_ID}'; ${defaultRole}`);
  psql(`${replica} DELETE FROM public.inventory_items WHERE id = '${INVENTORY_ID}'; ${defaultRole}`);
  psql(`${replica} DELETE FROM public.product_images WHERE product_id = '${PRODUCT_ID}'; ${defaultRole}`);
  psql(`${replica} DELETE FROM public.products WHERE id = '${PRODUCT_ID}' OR (party_id = '${PARTY_ID}' AND slug IN ('test-product', 'test-draft', 'test-active', 'another-product', 'seed-product', 'e2e-test-product', 'featured-active-e2e')); ${defaultRole}`);
  psql(`${replica} DELETE FROM public.customers WHERE id = '${CUSTOMER_ID}'; ${defaultRole}`);
  psql(`${replica} DELETE FROM public.warehouses WHERE id = '${WAREHOUSE_ID}'; ${defaultRole}`);
  psql(`${replica} DELETE FROM public.categories WHERE party_id = '${PARTY_ID}' OR id = '${CATEGORY_ID}'; ${defaultRole}`);
  psql(`${replica} DELETE FROM public.user_party_roles WHERE party_id IN ('${PARTY_ID}', '${PARTY2_ID}'); ${defaultRole}`);
  // Delete only the known seeded role IDs — preserves custom roles created manually for these parties
  psql(`${replica} DELETE FROM public.roles WHERE id IN (
    '22222222-2222-2222-2222-222222222222',
    '${LIMITED_ESHOP_ROLE_ID}',
    '${DASHBOARD_PROD_CAT_ROLE_ID}'
  ); ${defaultRole}`);
  psql(`${replica} DELETE FROM public.parties WHERE id IN ('${PARTY_ID}', '${PARTY2_ID}') OR slug IN ('second-org', 'test-org-2', 'e2e-party', 'full-fields-org', 'other-organisation') OR slug LIKE 'e2e-org-%'; ${defaultRole}`);

  console.log("[global-setup] Cleanup done.");

  // Set user profile roles (use replica to bypass role hierarchy trigger)
  psql(`
    SET session_replication_role = replica;
    INSERT INTO public.profiles (id, role, display_name)
      VALUES ('${OWNER_ID}', 8, 'Owner')
      ON CONFLICT (id) DO UPDATE SET role = 8, display_name = 'Owner';
    UPDATE public.profiles SET role = 4, display_name = 'Admin'        WHERE id = '${ADMIN_ID}';
    UPDATE public.profiles SET role = 2, display_name = 'Eshop Admin'  WHERE id = '${ESHOP_ID}';
    UPDATE public.profiles SET role = 1, display_name = 'Regular User' WHERE id = '${USER_ID}';
    SET session_replication_role = DEFAULT;
  `);

  // Seed party
  psql(`
    ${replica}
    INSERT INTO public.parties (id, name, slug, company_name, vat_number, billing_email, is_active)
    VALUES (
      '${PARTY_ID}',
      'Test Organisation',
      'test-organisation',
      'Test Company s.r.o.',
      'CZ12345678',
      'billing@testorg.com',
      true
    );
    ${defaultRole}
  `);

  // Seed global Super Admin role (full permissions) for test party memberships
  psql(`
    ${replica}
    INSERT INTO public.roles (id, name, permissions, is_system)
    VALUES ('22222222-2222-2222-2222-222222222222', 'Super Admin', 32767, false)
    ON CONFLICT (id) DO UPDATE SET permissions = 32767;
    ${defaultRole}
  `);

  // Link admin and eshop to PARTY_ID as Super Admin
  psql(`
    ${replica}
    INSERT INTO public.user_party_roles (user_id, party_id, role_id)
    VALUES ('${ADMIN_ID}', '${PARTY_ID}', '22222222-2222-2222-2222-222222222222')
    ON CONFLICT DO NOTHING;
    ${defaultRole}
  `);

  psql(`
    ${replica}
    INSERT INTO public.user_party_roles (user_id, party_id, role_id)
    VALUES ('${ESHOP_ID}', '${PARTY_ID}', '22222222-2222-2222-2222-222222222222')
    ON CONFLICT DO NOTHING;
    ${defaultRole}
  `);

  // Seed limited role with ONLY MANAGE_PRODUCTS (bit 8) — used to test permission isolation
  psql(`
    ${replica}
    INSERT INTO public.roles (id, name, permissions, is_system)
    VALUES ('${LIMITED_ESHOP_ROLE_ID}', 'Products Only', 8, false)
    ON CONFLICT (id) DO UPDATE SET permissions = 8;
    ${defaultRole}
  `);

  // Seed dashboard+products+categories role (VIEW_DASHBOARD|MANAGE_PRODUCTS|MANAGE_CATEGORIES = 25)
  psql(`
    ${replica}
    INSERT INTO public.roles (id, name, permissions, is_system)
    VALUES ('${DASHBOARD_PROD_CAT_ROLE_ID}', 'Dashboard+Products+Categories', 25, false)
    ON CONFLICT (id) DO UPDATE SET permissions = 25;
    ${defaultRole}
  `);

  // Seed root category
  psql(`
    ${replica}
    INSERT INTO public.categories (id, party_id, name, slug, is_visible, sort_order)
    VALUES ('${CATEGORY_ID}', '${PARTY_ID}', 'Test Category', 'test-category', true, 0);
    ${defaultRole}
  `);

  // Seed customer
  psql(`
    ${replica}
    INSERT INTO public.customers (id, party_id, first_name, last_name, email, phone, is_active)
    VALUES (
      '${CUSTOMER_ID}', '${PARTY_ID}',
      'Jan', 'Test', 'customer@test.com', '+420123456789', true
    );
    ${defaultRole}
  `);

  // Seed warehouse
  psql(`
    ${replica}
    INSERT INTO public.warehouses (id, party_id, name, code, is_active, is_default)
    VALUES (
      '${WAREHOUSE_ID}', '${PARTY_ID}',
      'Main Warehouse', 'WH-MAIN', true, true
    );
    ${defaultRole}
  `);

  // Seed product
  psql(`
    ${replica}
    INSERT INTO public.products (id, party_id, title, slug, sku, price, status, is_featured, is_visible)
    VALUES (
      '${PRODUCT_ID}', '${PARTY_ID}',
      'Seed Product', 'seed-product', 'SKU-SEED-001',
      99.90, 'active', false, true
    );
    ${defaultRole}
  `);

  // Seed inventory item (qty=50, threshold=10)
  psql(`
    ${replica}
    INSERT INTO public.inventory_items (id, party_id, product_id, warehouse_id, qty_on_hand, qty_reserved, low_stock_threshold)
    VALUES (
      '${INVENTORY_ID}', '${PARTY_ID}', '${PRODUCT_ID}', '${WAREHOUSE_ID}',
      50, 0, 10
    );
    ${defaultRole}
  `);

  // Seed order (pending)
  psql(`
    ${replica}
    INSERT INTO public.orders (id, party_id, customer_id, order_number, status, payment_status, total_amount, currency)
    VALUES (
      '${ORDER_ID}', '${PARTY_ID}', '${CUSTOMER_ID}',
      'ORD-SEED-001', 'pending', 'unpaid', 99.90, 'CZK'
    );
    ${defaultRole}
  `);

  // Seed discount rule
  psql(`
    ${replica}
    INSERT INTO public.discount_rules (id, party_id, name, type, value, is_active, applies_to)
    VALUES (
      '${RULE_ID}', '${PARTY_ID}',
      'Seed 10% Off', 'percentage', 10, true, 'all'
    );
    ${defaultRole}
  `);

  // Seed coupon SEED10
  psql(`
    ${replica}
    INSERT INTO public.coupons (id, party_id, code, discount_rule_id, is_active)
    VALUES (
      '${COUPON_ID}', '${PARTY_ID}',
      'SEED10', '${RULE_ID}', true
    );
    ${defaultRole}
  `);

  // Seed notification + link to admin
  psql(`
    ${replica}
    INSERT INTO public.notifications (id, party_id, type, title, body)
    VALUES (
      '${NOTIF_ID}', '${PARTY_ID}',
      'system_alert', 'Test Notification', 'This is a seeded test notification body.'
    );
    INSERT INTO public.user_notifications (user_id, notification_id, read_at)
    VALUES ('${ADMIN_ID}', '${NOTIF_ID}', NULL);
    ${defaultRole}
  `);

  // Seed second party (PARTY2) — ESHOP user is member, ADMIN is NOT
  psql(`
    ${replica}
    INSERT INTO public.parties (id, name, slug, is_active)
    VALUES ('${PARTY2_ID}', 'Other Organisation', 'other-organisation', true);
    ${defaultRole}
  `);

  // Only ESHOP user belongs to PARTY2 (not ADMIN — this tests cross-org isolation)
  psql(`
    ${replica}
    INSERT INTO public.user_party_roles (user_id, party_id, role_id)
    VALUES ('${ESHOP_ID}', '${PARTY2_ID}', '22222222-2222-2222-2222-222222222222')
    ON CONFLICT DO NOTHING;
    ${defaultRole}
  `);

  console.log("[global-setup] All test data seeded successfully.");
  console.log(`  Party:        ${PARTY_ID}`);
  console.log(`  Party2:       ${PARTY2_ID} (eshop-only, admin excluded)`);
  console.log(`  Customer:     ${CUSTOMER_ID}`);
  console.log(`  Warehouse:    ${WAREHOUSE_ID}`);
  console.log(`  Product:      ${PRODUCT_ID} (qty=50)`);
  console.log(`  Order:        ${ORDER_ID} (ORD-SEED-001, pending)`);
  console.log(`  DiscRule:     ${RULE_ID} (10% off)`);
  console.log(`  Coupon:       ${COUPON_ID} (SEED10)`);
  console.log(`  Notification: ${NOTIF_ID} (unread for admin)`);
}
