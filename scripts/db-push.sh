#!/usr/bin/env bash
set -euo pipefail

ENV="${1:-development}"

if [[ "$ENV" != "development" && "$ENV" != "production" ]]; then
  echo "Usage: ./scripts/db-push.sh [development|production]" >&2
  exit 1
fi

if [[ "$ENV" == "production" ]]; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
  if [[ "$BRANCH" != "master" ]]; then
    echo "Production push requires master branch (you are on '$BRANCH')" >&2
    exit 1
  fi
  # Production is the SELF-HOSTED Supabase stack on the Oracle Cloud VM (api-oci.mamtodoma.cz),
  # NOT Supabase Cloud. Raw Postgres on the VM is not exposed publicly: access goes through the
  # Supavisor pooler (session mode) over an SSH tunnel to the VM, e.g.
  #   ssh -i ~/.ssh/oci_phase0 -fN -L 5433:localhost:5432 ubuntu@api-oci.mamtodoma.cz
  # See scripts/oci-prod-db.md for the full procedure.
  #
  # The pooler connection URL is resolved by scripts/_prod-db-url.sh (shared with the history-repair
  # script). The pooler does not accept TLS, so default PGSSLMODE=disable (override by exporting it).
  SUPABASE_DB_URL=$(bash "$(dirname "$0")/_prod-db-url.sh")
  echo "Pushing DB migrations to PRODUCTION (self-hosted Supabase on Oracle)..."
  PGSSLMODE="${PGSSLMODE:-disable}" npx supabase db push --remote="$SUPABASE_DB_URL" --include-all
else
  # Local Supabase: derive DB port from supabase/config.toml (default 54322)
  DB_PORT=$(awk '/^\[db\]/{f=1} f && /^port/{print $3; exit}' supabase/config.toml)
  DB_PORT="${DB_PORT:-54322}"
  echo "Pushing DB migrations to DEVELOPMENT (localhost:${DB_PORT})..."
  PGSSLMODE=disable npx supabase db push \
    --remote="postgresql://postgres:postgres@127.0.0.1:${DB_PORT}/postgres" \
    --include-all
fi

echo "Done: $ENV"
