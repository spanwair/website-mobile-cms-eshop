# Connecting to the production DB (self-hosted Supabase on Oracle)

Production Postgres is **not** exposed to the internet or even to the VM host directly.
Only the Supavisor **connection pooler** (`supabase-pooler`) is published on the VM, on
`5432` (session mode) and `6543` (transaction mode). The raw `supabase-db` container has no
host port mapping. So all prod DB access goes: your laptop → SSH tunnel → VM `5432` (pooler
session mode) → Postgres.

## Nothing to set up by hand

`scripts/db-push.sh production`, `scripts/repair-prod-history.sh`, and anything else that
calls `scripts/_prod-db-url.sh` **establish and verify the tunnel automatically** via
`scripts/oci-tunnel.sh`. Just run the command you want:

```bash
./scripts/db-push.sh production
```

`oci-tunnel.sh` is idempotent and self-healing:

- Reuses an already-open tunnel, but only after confirming it actually answers a real query
  (not just "a process with the right command line exists" — `ssh -f` can background even when
  its port bind failed, leaving a useless zombie that looks alive to a plain `pgrep`).
- If the preferred local port (default `5433`, override with `OCI_TUNNEL_PORT`) is already held
  by *anything* — another local Docker project, a stray process, whatever — it automatically
  tries the next few ports instead of failing. This laptop runs other projects' Postgres
  containers that can and do squat low ports; this used to produce a misleading
  `password authentication failed` instead of a clear "port's taken" message. It no longer does.
- Only ever reports success after `select 1` actually round-trips through the tunnel.
- Uses `-o ExitOnForwardFailure=yes` so a failed bind makes `ssh` exit immediately instead of
  silently backgrounding a non-functional tunnel — the root cause of the old zombie-tunnel bug.

Useful subcommands:

```bash
./scripts/oci-tunnel.sh status   # is the tracked tunnel actually healthy right now?
./scripts/oci-tunnel.sh down     # tear it down (e.g. before a long break)
```

If `oci-tunnel.sh up` ever fails outright, it prints exactly what's listening on the ports it
tried (via `ss -ltn` and `docker ps`) — that's the first thing to read, not the Postgres error.

## Credentials

- Password: `POSTGRES_PASSWORD` — on the VM at `/opt/phase0/supabase/docker/.env`.
  Keep it in `.env.production` under the key `POSTGRES_PASSWORD` (never commit it).
- User **must include the pooler tenant**: `supabase_admin.mamtodoma`
  (tenant = `POOLER_TENANT_ID` from the same VM `.env`, also kept in `.env.production`).
  Connecting as plain `supabase_admin` fails with `no tenant identifier provided`.
- Session mode (`5432` on the VM, tunnelled), not transaction mode (`6543`): session mode keeps
  session state, advisory locks and prepared statements, which DDL/migrations need.

## Manual connection (ad hoc exploration)

For one-off `psql` work outside the scripts, you can still drive the tunnel directly — just
remember to verify it, don't trust the process existing:

```bash
./scripts/oci-tunnel.sh up          # prints the local port it secured, e.g. 5434
PORT=$(./scripts/oci-tunnel.sh status | grep -oP 'port=\K\d+')
PW=$(grep '^POSTGRES_PASSWORD=' .env.production | cut -d= -f2- | tr -d '"\r'"'"'')
PGPASSWORD="$PW" PGSSLMODE=disable psql -h 127.0.0.1 -p "$PORT" \
  -U 'supabase_admin.mamtodoma' -d postgres -c 'SELECT current_user;'
```

Gotcha: through the pooler, multiple `;`-separated statements in a single `-c` are sent as one
simple-query batch — on any error the whole batch returns nothing, and verification reads come
back oddly truncated. Run **one statement per `-c`** when verifying by hand.

## Migrations (`db-push.sh production`)

Still `master` branch only. For one-off test data prefer a seed over the tunnel (section above)
rather than a tracked migration.
