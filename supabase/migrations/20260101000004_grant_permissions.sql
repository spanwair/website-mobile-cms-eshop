-- Grant table access to authenticated and anon roles.
-- RLS policies then filter what each role can actually see.

GRANT SELECT ON items TO anon, authenticated;
GRANT INSERT, UPDATE ON items TO authenticated;
GRANT DELETE ON items TO authenticated;

GRANT SELECT ON profiles TO anon, authenticated;
GRANT UPDATE ON profiles TO authenticated;
