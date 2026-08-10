#!/usr/bin/env bash
set -euo pipefail

ENV="${1:-development}"

if [[ "$ENV" == "production" ]]; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
  if [[ "$BRANCH" != "master" ]]; then
    echo "Production deploy requires master branch (you are on '$BRANCH')" >&2
    exit 1
  fi
fi

if [[ "$ENV" == "production" ]]; then
  PROJECT_REF=$(grep '^PUBLIC_SUPABASE_URL=' .env.production 2>/dev/null | cut -d= -f2- | sed -E 's#https?://([^.]+)\.supabase\.co.*#\1#')
  if [[ -z "$PROJECT_REF" ]]; then
    echo "Could not derive project ref from PUBLIC_SUPABASE_URL in .env.production" >&2
    exit 1
  fi
else
  PROJECT_REF=$(cat supabase/.temp/project-ref 2>/dev/null || echo "")
  if [[ -z "$PROJECT_REF" ]]; then
    echo "No linked project ref found at supabase/.temp/project-ref — run 'npx supabase link' first" >&2
    exit 1
  fi
fi

echo "Deploying Edge Functions to $ENV (project-ref: $PROJECT_REF)..."
npx supabase functions deploy --project-ref "$PROJECT_REF"
echo "Done: $ENV"
