---
name: oci-prod-migration
description: >
  Authoritative procedure for pushing supabase/migrations/ to PRODUCTION (the
  self-hosted Supabase stack on Oracle Cloud, api-oci.mamtodoma.cz).
  TRIGGER — load BEFORE running `scripts/db-push.sh production`, before touching
  scripts/oci-tunnel.sh, scripts/_prod-db-url.sh, scripts/repair-prod-history.sh, or
  scripts/oci-prod-db.md, and whenever the user says "push to prod", "migrate to
  Oracle Cloud", "deploy migrations to production", or similar. Covers two known
  failure modes (SSH blocked by a stale Security List rule; the Supabase CLI's
  false-positive "must be owner" error) that otherwise burn an hour of re-diagnosis
  each time. Do NOT skip because "we've done this before" — both failures recur.
---

# OCI Production Migration — Authoritative Procedure

Production is the self-hosted Supabase stack (Docker) on an Oracle Cloud VM
(`api-oci.mamtodoma.cz`), reached through the Supavisor connection pooler over an SSH
tunnel — never a direct connection, never a dashboard. Full architecture:
`scripts/oci-prod-db.md`. This skill is the troubleshooting layer on top of that doc.

---

## Step 1 — Tunnel preflight

```bash
./scripts/oci-tunnel.sh up
```

This is self-healing for the common case (another local Docker project squatting the
default port 5433 — it just tries the next port). If it prints a secured port, skip to
Step 2.

### Failure mode A: every port fails to bind ("ExitOnForwardFailure caught it")

This is NOT the port-squat case (that only fails the *first* port, then succeeds on
the next). If **every** port in the retry range fails, the SSH connection to the VM
itself is being refused or timing out — diagnose directly:

```bash
nc -zv -w 6 api-oci.mamtodoma.cz 22    # SSH
nc -zv -w 6 api-oci.mamtodoma.cz 443   # HTTPS, for comparison
```

If 443 succeeds but 22 times out, the VM is up and fine — an OCI **Security List**
ingress rule for port 22 is scoped to a specific CIDR (your home IP), and that IP has
changed since the rule was last set. Confirm and fix:

```bash
# 1. Point the OCI CLI at the API credentials already stored in .env.production
#    (OCI_TENANCY_OCID, OCI_USER_OCID, OCI_FINGERPRINT, OCI_REGION, OCI_PRIVATE_KEY).
#    Write a throwaway config + key file under the scratchpad dir, chmod 600 both.

# 2. Find the VM, its VNIC, subnet, and the Security List attached to that subnet:
oci compute instance list --compartment-id "$OCI_COMPARTMENT_OCID"
oci network vnic get --vnic-id <vnic-id>                      # → subnet-id
oci network subnet get --subnet-id <subnet-id>                # → security-list-ids
oci network security-list get --security-list-id <sl-id>      # → ingress rules

# 3. Find your current public IP:
curl -sS https://api.ipify.org

# 4. Update the port-22 ingress rule's source to your current IP (/32), leaving the
#    80/443 0.0.0.0/0 rules untouched — write the FULL ingress-security-rules array
#    (ports 22/80/443) to a JSON file and apply:
oci network security-list update --security-list-id <sl-id> \
  --ingress-security-rules file://ingress-rules.json --force
```

This is a production-firewall write. **Confirm with the user before running the
`update` call** — read-only `get`/`list` calls are fine to run freely. The actual
`security-list update` and any direct prod DB mutation are also blocked by the
Claude Code auto-mode classifier regardless of user confirmation — hand the exact
command back to the user to run with the `!` prefix rather than retrying it yourself.

Re-verify with `nc -zv api-oci.mamtodoma.cz 22`, then `./scripts/oci-tunnel.sh up`
again.

---

## Step 2 — Check what's actually pending

Don't push blind. Compare local vs. remote first:

```bash
SUPABASE_DB_URL=$(bash scripts/_prod-db-url.sh)
PGSSLMODE=disable npx supabase migration list --db-url "$SUPABASE_DB_URL"
```

Any row with an empty `"remote"` field is pending. Note the exact version/filenames —
you'll need them if Step 3's CLI path fails and you have to fall back to Step 4.

---

## Step 3 — Try the normal push

```bash
./scripts/db-push.sh production
```

In agent mode this may stop with `HostedMutationConsentRequiredError` ("This run
can't ask because it is running in agent mode"). That's expected — it's not the bug
below, it's just the CLI wanting `--yes`. Since this command itself mutates
production, hand it to the user to run with `!` rather than appending `--yes`
yourself and retrying, unless the user has already told you to proceed with the push
in this conversation.

### Failure mode B: `ERROR: must be owner of table <x> (SQLSTATE 42501)`

**This error is very likely a false positive from the CLI, not a real Postgres
permission problem**, on this self-hosted Supavisor-fronted stack. Confirmed root
cause (2026-11-20): the exact same statement, run directly via `psql` through the
same tunnel with the same pooler URL, succeeds immediately — and `docker logs
supabase-db` on the VM shows zero trace of the statement or the error ever reaching
the real Postgres backend. The CLI is rejecting the statement client-side before it
ever leaves your machine, most likely because the pooler's tenant-qualified username
(`supabase_admin.<tenant>`) doesn't match an unscoped owner name (`supabase_admin`)
in whatever local ownership check it runs.

**Do not spend time re-diagnosing this inside the CLI.** Verify it's the same false
positive (optional, keep it quick) by checking VM-side logs for the failing
statement:

```bash
ssh -i ~/.ssh/oci_phase0 ubuntu@api-oci.mamtodoma.cz \
  "docker logs supabase-db 2>&1 | grep -i 'must be owner\|42501'"
```

No hits confirms it never reached the server. Then go straight to Step 4.

---

## Step 4 — Manual fallback: apply via psql, then record history

This still goes through `supabase/migrations/` (CLAUDE.md's "all DB changes go
through migrations" rule) — it only swaps the broken CLI apply step for a direct
`psql -f`, applying the exact same migration files.

```bash
PW=$(grep '^POSTGRES_PASSWORD=' .env.production | cut -d= -f2- | tr -d '"\r')
TENANT=$(grep '^POOLER_TENANT_ID=' .env.production | cut -d= -f2- | tr -d '"\r')
PORT=$(./scripts/oci-tunnel.sh up)

for f in <version1_name1> <version2_name2> ...; do
  echo "=== applying $f ==="
  PGPASSWORD="$PW" PGSSLMODE=disable psql -h 127.0.0.1 -p "$PORT" \
    -U "supabase_admin.$TENANT" -d postgres -v ON_ERROR_STOP=1 \
    -f "supabase/migrations/${f}.sql" || { echo "FAILED on $f"; break; }
done
```

Then mark each applied file as known-applied in the CLI's history table, so future
`migration list` / `db push` runs see production as in sync:

```sql
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES
  ('<version1>', '<name1>', ARRAY['-- applied manually via psql']),
  ('<version2>', '<name2>', ARRAY['-- applied manually via psql'])
ON CONFLICT (version) DO NOTHING;
```

This is a real production write (both the migration bodies and the history insert) —
hand both commands to the user to run with `!`, same as Step 1's security-list fix.

---

## Step 5 — Verify

```bash
SUPABASE_DB_URL=$(bash scripts/_prod-db-url.sh)
PGSSLMODE=disable npx supabase migration list --db-url "$SUPABASE_DB_URL"
```

Confirm every row now has `local == remote`. Then spot-check the actual change landed
(a column exists, a row count changed, etc.) — don't rely on "no error" alone, since
Step 3's bug proved the CLI's own success/failure signal isn't fully trustworthy
against this stack.

---

## Reference

- `scripts/oci-prod-db.md` — pooler/tunnel architecture, credentials, manual-connection gotchas
- `scripts/oci-tunnel.sh` — self-healing SSH tunnel (port-squat auto-advance, real DB-probe verification)
- `scripts/_prod-db-url.sh` — builds the pooler URL, calls the tunnel automatically
- `scripts/repair-prod-history.sh` — bulk-mark ALL local migrations as applied (for a fresh/empty history table, not the targeted fix in Step 4)
- `scripts/db-push.sh production` — the normal path; falls back to Step 4 when it hits Failure mode B
