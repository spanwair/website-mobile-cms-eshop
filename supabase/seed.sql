-- Mock data seed for local development
-- Profiles are created automatically on auth.users insert via trigger.
-- We insert directly into profiles for local testing.

-- Admin user (you can sign in as this via magic link locally)
INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@template.local',  NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated'),
  ('00000000-0000-0000-0000-000000000002', 'alice@template.local',  NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated'),
  ('00000000-0000-0000-0000-000000000003', 'bob@template.local',    NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Profiles (trigger creates them, but we upsert to set display_name + role)
INSERT INTO profiles (id, display_name, role)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Admin User', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'Alice Demo',  'user'),
  ('00000000-0000-0000-0000-000000000003', 'Bob Demo',    'user')
ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, role = EXCLUDED.role;

-- Mock items
INSERT INTO items (id, title, description, status, created_by)
VALUES
  (gen_random_uuid(), 'First active item',   'This is a sample active item with a longer description to show how text wraps.',   'active',   '00000000-0000-0000-0000-000000000001'),
  (gen_random_uuid(), 'Second active item',  'Another active item posted by the admin user. Ready to be viewed publicly.',        'active',   '00000000-0000-0000-0000-000000000001'),
  (gen_random_uuid(), 'Draft item by Alice', 'Alice created this item but has not published it yet.',                             'draft',    '00000000-0000-0000-0000-000000000002'),
  (gen_random_uuid(), 'Inactive item',       'This item was previously active but has been deactivated.',                        'inactive', '00000000-0000-0000-0000-000000000003'),
  (gen_random_uuid(), 'Third active item',   'A third active item to populate the list view with enough rows to look realistic.', 'active',   '00000000-0000-0000-0000-000000000002'),
  (gen_random_uuid(), 'Draft by Bob',        'Bob drafted this item but it is not yet published.',                               'draft',    '00000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;
