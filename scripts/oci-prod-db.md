# Connecting to the production DB (self-hosted Supabase on Oracle)

Production Postgres is **not** exposed to the internet or even to the VM host directly.
Only the Supavisor **connection pooler** (`supabase-pooler`) is published on the VM, on
`5432` (session mode) and `6543` (transaction mode). The raw `supabase-db` container has no
host port mapping. So all prod DB access goes: your laptop → SSH tunnel → VM `5432` (pooler
session mode) → Postgres.

Verified working 2026-10-29 (first data write over the Oracle path).

## 1. Open the SSH tunnel on local port 5433

A local Postgres may already own `5432` on your laptop, so tunnel to a **different** local
port to remove all ambiguity:

```bash
ssh -i ~/.ssh/oci_phase0 -fN -L 5433:localhost:5432 ubuntu@api-oci.mamtodoma.cz
```

`-f` backgrounds it, `-N` opens no shell. Confirm: `ss -ltn | grep ':5433 '`.

## 2. Credentials

- Password: `POSTGRES_PASSWORD` — on the VM at `/opt/phase0/supabase/docker/.env`.
  Keep it in `.env.production` under the key `POSTGRES_PASSWORD` (never commit it).
- User **must include the pooler tenant**: `supabase_admin.mamtodoma`
  (tenant = `POOLER_TENANT_ID` from the same VM `.env`). Connecting as plain `supabase_admin`
  fails with `no tenant identifier provided`.
- Use **session mode (5432 → tunnelled 5433)**, not transaction mode (6543): session mode
  keeps session state, advisory locks and prepared statements, which DDL/migrations need.

## 3. Connect / run a seed

```bash
PW=$(grep '^POSTGRES_PASSWORD=' .env.production | cut -d= -f2- | tr -d '"'"'\r')
PGPASSWORD="$PW" PGSSLMODE=disable psql -h 127.0.0.1 -p 5433 \
  -U 'supabase_admin.mamtodoma' -d postgres \
  -v ON_ERROR_STOP=1 -f supabase/seed/<file>.sql
```

Gotcha: through the pooler, multiple `;`-separated statements in a single `-c` are sent as one
simple-query batch — on any error the whole batch returns nothing, and verification reads come
back oddly truncated. Run **one statement per `-c`** when verifying.

## 4. Migrations (`db-push.sh production`)

`scripts/db-push.sh production` reads `OCI_DB_URL` from `.env.production`. With this pooler
setup that string is:

```
OCI_DB_URL=postgresql://supabase_admin.mamtodoma:<POSTGRES_PASSWORD>@127.0.0.1:5433/postgres
```

(URL-encode any special chars in the password.) It must hit the **session** port (tunnelled
5433), never 6543. Still on `master` branch only. For one-off test data prefer a seed over the
tunnel (section 3) rather than a tracked migration.
