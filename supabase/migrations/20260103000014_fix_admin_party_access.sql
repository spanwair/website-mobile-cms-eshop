-- Fix admin party access broken by 20260103000012 (which deleted system roles
-- and all user_party_roles that referenced them, leaving existing admins with
-- role=4 in profiles but zero party memberships → they see "No organization").

-- 1. Ensure at least one global role exists for party membership assignment.
INSERT INTO public.roles (name, permissions, description)
SELECT 'Party Admin', 65535, 'System-managed role for party membership'
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE party_id IS NULL);

-- 2. Re-assign existing admins (role=4) who lost all party access
--    to every active party. Only runs for admins with zero user_party_roles
--    entries (i.e., those broken by step 1 of 20260103000012).
DO $$
DECLARE
  v_role_id UUID;
BEGIN
  SELECT id INTO v_role_id
  FROM public.roles
  WHERE party_id IS NULL
  ORDER BY permissions DESC
  LIMIT 1;

  INSERT INTO public.user_party_roles (user_id, party_id, role_id)
  SELECT p.id, pa.id, v_role_id
  FROM public.profiles p
  CROSS JOIN public.parties pa
  WHERE p.role = 4
    AND pa.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM public.user_party_roles upr
      WHERE upr.user_id = p.id
    )
  ON CONFLICT DO NOTHING;
END;
$$;
