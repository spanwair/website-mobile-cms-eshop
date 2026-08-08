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

echo "Deploying Edge Functions to $ENV..."
supabase functions deploy --project-ref "$(cat supabase/.temp/project-ref 2>/dev/null || echo 'YOUR_PROJECT_REF')"
echo "Done: $ENV"
