# Backend migration plan - Supabase Cloud → self-hosted Supabase on OCI

Date: 2026-10-22.
Strategy: **A - self-host the identical Supabase stack on an OCI compute VM** (eu-frankfurt-1).
Status: PLAN ONLY. Nothing provisioned. Awaiting approval to start Phase 0.

## Decisions locked with Jan
- This is the live mamtodoma.cz repo. smalljobs-looking values are mamtodoma's - do not chase them.
- Email stays on OCI Email Delivery, untouched. Resend is dead config to remove later.
- Region: eu-frankfurt-1 (matches existing OCI email region, EU residency).
- Supabase stays a warm rollback (back door) for weeks after cutover.

## Why Strategy A (not B)
DB requires pg_cron, pg_net, superuser `ALTER DATABASE ... SET app.settings.*`, and the GoTrue
`auth` schema (62 of 130 migrations touch `auth.*`; 57 SECURITY DEFINER fns). OCI managed
PostgreSQL / ADB provide none of these → the DB MUST run inside the self-host stack. B = full
auth/storage/auto-API rewrite, ~5x effort, no parity gain. Rejected.

## What moves vs. stays
- MOVES: Postgres 15, GoTrue auth, Storage, PostgREST auto-API, pg_cron/pg_net jobs, 2 Edge Functions.
- STAYS: Cloudflare Worker website (incl. /api/stripe/webhook - does NOT move), mobile client,
  Stripe, OCI Email Delivery, PPL/Packeta.
- Realtime: effectively unused (only auth.onAuthStateChange) → near-zero parity risk.

## Secret topology (rule 5)
- NEW backend OWN secrets (fresh copies, set only on OCI): DB password, anon/service keys,
  Stripe keys, webhook secret, SEND_EMAIL_HOOK_SECRET, OCI email creds.
- EXCEPTION - JWT secret: COPY the existing Supabase JWT secret to OCI (do NOT regenerate).
  Reason: anon/service keys are JWTs signed by it and user sessions depend on it. Same secret ⇒
  existing anon key + all live sessions stay valid ⇒ cutover is a single URL flip and rollback
  doesn't log anyone out. Needs Jan's explicit sign-off (bends "fresh copies" deliberately).
- CLIENT env (PUBLIC_SUPABASE_URL + anon key on website/mobile): stay pointed at OLD Supabase
  until the Phase 3 flip. Phase 0/1 change NEITHER client nor old backend.

## Green-light gate (run after every step, against the NEW backend)
`cd website && pnpm playwright test` (all 38 specs) + Stripe test-mode round-trip +
file upload/download + auth-state-change check. No phase advances until green.

## Phases (one experienced engineer)

### Phase 0 - read-only spike, breaks nothing. 2-3 days.
> PROGRESS 2026-10-22: compatibility gate PROVEN locally (local CLI stack = the self-host stack).
> pg_cron 1.6 + pg_net 0.14.0 installed and all 3 cron jobs scheduled; supabase_admin is
> superuser so ALTER DATABASE app.settings works; auth schema (23 tables) + handle_new_user
> trigger present. Artifacts + version pins in migration/oci-selfhost/. STILL OUTSTANDING:
> fresh clean-apply of 130 migrations on a throwaway OCI VM (needs Jan's OCI access).
- Confirm hosting truth; pick compute shape (Ampere A1, ~4 OCPU/24 GB).
- Least-privilege bootstrap: Jan does ONE interactive OCI browser login; then create scoped IAM
  user `supabase-migrator` + group + compartment policy + API signing key. No root use after.
- Export managed settings + secret NAMES (not values): auth config, redirect URLs, JWT expiry,
  confirmations, storage buckets+policies, roles, extensions, pg_cron jobs, app.settings,
  edge-fn list, send-email hook. Via dashboard + `supabase db dump`.
- PROVE DB-compat on a THROWAWAY VM: boot supabase/postgres stack, confirm pg_cron+pg_net install,
  `ALTER DATABASE ... SET app.settings.*` works, schema-only dump of all 130 migrations restores
  clean. Tear VM down. GATES everything.

### Phase 1 - provision target, no client touches it. 3-4 days.
- Real OCI VM in eu-frankfurt-1: block volume for PGDATA+storage, security lists, TLS on a NEW
  host (e.g. api-oci.mamtodoma.cz) - nothing points here yet.
- Deploy self-hosted Supabase; set NEW-backend own secrets (+ copied JWT secret per exception).
- Apply 130 migrations, app.settings, buckets, 2 edge fns; ADD new-host Google OAuth redirect
  (additional, not replacing).
- Gate: point a scratch website build at new backend; full green-light gate. Zero prod impact.

### Phase 2 - data sync + dry runs. 2-3 days.
- Continuous logical replication Supabase(prod) → OCI; validate row + storage-object parity
  (watch the db-reset storage-vs-objects gotcha).
- Full green-light gate against replicated backend; rehearse cutover on staging hosts.
- Reversibility still 100% free here (no real write has hit OCI).

### Phase 3 - cutover = single flip. 1-day window.
- Freeze, stop prod→OCI replication at known LSN, verify OCI caught up.
- Flip CLIENT env PUBLIC_SUPABASE_URL (+ anon key only if JWT secret NOT copied) in Cloudflare
  Worker secrets + mobile build. Stripe webhook URL unchanged (lives on the Worker).
- ⚠️ REVERSIBILITY-LOST LINE = FIRST REAL USER WRITE TO OCI. After this, rollback loses
  post-cutover writes UNLESS reverse replication is running.
- Immediately start REVERSE replication OCI → Supabase to keep the back door warm.
- Green-light gate against the flipped production system.

### Phase 4 - warm rollback window, then decommission. weeks + 1 day.
- Keep Supabase live + reverse replication running for the agreed weeks; monitor.
- Rollback runbook: flip env var back (valid while reverse replication healthy).
- Close the back door (loud callout) → stop reverse replication, pause Supabase, remove dead
  RESEND_API_KEY + stale config, fix privacy-policy email-processor text.

Total hands-on: ~9-12 working days + multi-week soak. Strategy B ≈ x5.

## Top risks
- Auth re-config (HIGH): GoTrue version parity vs 62 auth-coupled migrations; JWT secret handling;
  Google OAuth redirect/consent.
- Data/storage parity + replication lag at cutover (MEDIUM).
- Email deliverability (LOW): unchanged OCI path; only verify new GoTrue hook signature + copied
  SEND_EMAIL_HOOK_SECRET.
- Payment webhook (LOW/NONE): webhook stays on the Worker; only the DB it writes to changes.
- Realtime parity (LOW): unused.

## What only Jan can do
OCI signup/card/identity; the one interactive OCI browser login; Supabase dashboard exports;
final DNS/env flip; Stripe + Google OAuth consent ownership; approving the JWT-secret-copy exception.
