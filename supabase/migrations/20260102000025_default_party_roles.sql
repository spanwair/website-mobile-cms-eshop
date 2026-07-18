-- Seed three additional default roles for every party, alongside Super Admin.
-- Permission bitmask reference:
--   VIEW_DASHBOARD=1, MANAGE_USERS=2, MANAGE_ROLES=4, MANAGE_PRODUCTS=8,
--   MANAGE_CATEGORIES=16, MANAGE_ORDERS=32, MANAGE_INVENTORY=64, MANAGE_PRICING=128,
--   MANAGE_CUSTOMERS=256, VIEW_REPORTS=512, MANAGE_CMS=1024, MANAGE_FILES=2048,
--   MANAGE_SETTINGS=4096, BILLING=8192, API_MANAGEMENT=16384, FULL_ACCESS=32768

-- Manager: dashboard + products + categories + orders + inventory + pricing + customers + reports
-- 1+8+16+32+64+128+256+512 = 1017
-- Editor: dashboard + products + categories (content team, no order/financial access)
-- 1+8+16 = 25
-- Viewer: dashboard + reports only (read-only, e.g. accountant, investor)
-- 1+512 = 513

-- Update trigger to seed all 4 default roles for new parties
CREATE OR REPLACE FUNCTION create_party_super_admin_role()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.roles (party_id, name, permissions, is_system, description)
  VALUES
    (NEW.id, 'Super Admin', 32767, true,  'Full access to all features — system role, cannot be deleted'),
    (NEW.id, 'Manager',     1017,  false, 'Manages day-to-day operations: products, orders, inventory, pricing, customers'),
    (NEW.id, 'Editor',      25,    false, 'Creates and edits products and categories — no financial or order access'),
    (NEW.id, 'Viewer',      513,   false, 'Read-only access to dashboard and reports');
  RETURN NEW;
END;
$$;

-- Backfill: insert missing default roles for all existing parties that only have Super Admin
INSERT INTO public.roles (party_id, name, permissions, is_system, description)
SELECT
  p.id,
  r.name,
  r.permissions,
  false,
  r.description
FROM public.parties p
CROSS JOIN (
  VALUES
    ('Manager', 1017,  'Manages day-to-day operations: products, orders, inventory, pricing, customers'),
    ('Editor',  25,    'Creates and edits products and categories — no financial or order access'),
    ('Viewer',  513,   'Read-only access to dashboard and reports')
) AS r(name, permissions, description)
WHERE NOT EXISTS (
  SELECT 1 FROM public.roles
  WHERE party_id = p.id AND name = r.name
);
