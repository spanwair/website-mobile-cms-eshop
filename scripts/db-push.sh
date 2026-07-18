#!/usr/bin/env bash
set -euo pipefail

ENV="${1:-development}"

if [[ "$ENV" != "development" && "$ENV" != "production" ]]; then
  echo "Usage: ./scripts/db-push.sh [development|production]" >&2
  exit 1
fi

if [[ "$ENV" == "production" ]]; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
  if [[ "$BRANCH" != "main" ]]; then
    echo "Production push requires main branch (you are on '$BRANCH')" >&2
    exit 1
  fi
  # Read only SUPABASE_DB_URL from env file (avoids sourcing issues with spaces/special chars)
  SUPABASE_DB_URL=$(grep '^SUPABASE_DB_URL=' .env.production 2>/dev/null | cut -d= -f2-)
  if [[ -z "$SUPABASE_DB_URL" ]]; then
    echo "SUPABASE_DB_URL missing — add it to .env.production" >&2
    echo "  Find it at: Supabase dashboard → Settings → Database → Connection string" >&2
    exit 1
  fi
  echo "Pushing DB migrations to PRODUCTION..."
  PGSSLMODE=require npx supabase db push --db-url "$SUPABASE_DB_URL" --include-all
else
  # Local Supabase: derive DB port from supabase/config.toml (default 54322)
  DB_PORT=$(awk '/^\[db\]/{f=1} f && /^port/{print $3; exit}' supabase/config.toml)
  DB_PORT="${DB_PORT:-54322}"
  echo "Pushing DB migrations to DEVELOPMENT (localhost:${DB_PORT})..."
  PGSSLMODE=disable npx supabase db push \
    --db-url "postgresql://postgres:postgres@127.0.0.1:${DB_PORT}/postgres" \
    --include-all
fi

echo "Done: $ENV"
