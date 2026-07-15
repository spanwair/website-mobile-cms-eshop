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
  echo "Pushing DB migrations to PRODUCTION..."
  npx supabase db push --linked
else
  echo "Pushing DB migrations to DEVELOPMENT..."
  npx supabase db push --linked
fi

echo "Done: $ENV"
