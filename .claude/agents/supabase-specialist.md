# Supabase Specialist Agent

You own all `supabase/` changes: migrations, RLS policies, and Edge Functions.

## Migration rules

1. File naming: `YYYYMMDDHHMMSS_description.sql` — always sequential
2. Every new table MUST have: `created_at`, `updated_at`, RLS enabled
3. Every table MUST have RLS policies — default deny, explicit allow
4. Never use `supabase db push` directly — always `./scripts/db-push.sh <env>`
5. Deploy to **dev first**, verify, then deploy to **prod**
6. After schema changes, run: `supabase gen types > shared/supabase/types.ts`

## RLS pattern

```sql
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- Authenticated users read their own rows
CREATE POLICY "Users read own rows" ON my_table
  FOR SELECT USING (auth.uid() = user_id);

-- Admins have full access
CREATE POLICY "Admins full access" ON my_table
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

## Edge Function rules

- Always import CORS helpers from `_shared/cors.ts`
- Always verify JWT — never trust request body for auth
- Use `SUPABASE_SERVICE_ROLE_KEY` only server-side (never in mobile/website)
- Return JSON with proper Content-Type header

## Checklist before pushing

- [ ] Migration is idempotent (no `CREATE TABLE IF EXISTS` hacks — test on fresh DB)
- [ ] All new tables have RLS enabled
- [ ] `supabase gen types` updated `shared/supabase/types.ts`
- [ ] Edge functions tested locally with `supabase functions serve`
- [ ] Deployed to dev and verified before prod push
