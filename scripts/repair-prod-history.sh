#!/usr/bin/env bash
# One-time repair of the production migration-history table.
#
# After the Oct-2026 cutover from Supabase Cloud to the self-hosted OCI stack, prod's
# supabase_migrations.schema_migrations was left essentially empty even though every migration in
# supabase/migrations/ is already applied to the prod schema. That desync makes
# `supabase db push --include-all` want to replay ALL migrations.
#
# This script marks every local migration version as "applied" (non-destructive: it only writes to
# the history table, it never runs the migration bodies) so that db-push.sh production afterward
# only ever sees genuinely-new migrations as pending.
#
# Requires the keepalive SSH tunnel up on port 5433 (see scripts/oci-prod-db.md).
set -euo pipefail

cd "$(dirname "$0")/.."

SUPABASE_DB_URL=$(bash scripts/_prod-db-url.sh)

VERSIONS=()
for f in supabase/migrations/*.sql; do
  b=$(basename "$f")
  VERSIONS+=("${b%%_*}")
done

if [[ ${#VERSIONS[@]} -eq 0 ]]; then
  echo "No migration files found in supabase/migrations/." >&2
  exit 1
fi

echo "Marking ${#VERSIONS[@]} migrations as applied in prod schema_migrations..."
PGSSLMODE="${PGSSLMODE:-disable}" npx supabase migration repair \
  --status applied --remote="$SUPABASE_DB_URL" "${VERSIONS[@]}"

echo "Done. Verify with:"
echo "  PGSSLMODE=disable npx supabase db push --remote=\"\$(bash scripts/_prod-db-url.sh)\" --include-all --dry-run"
