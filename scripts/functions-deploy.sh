#!/usr/bin/env bash
set -euo pipefail

ENV="${1:-development}"

if [[ "$ENV" == "production" ]]; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
  if [[ "$BRANCH" != "master" ]]; then
    echo "Production deploy requires master branch (you are on '$BRANCH')" >&2
    exit 1
  fi

  # Production is the SELF-HOSTED Supabase stack on the Oracle Cloud VM — NOT Supabase Cloud.
  # `supabase functions deploy --project-ref` is a Supabase Cloud API call and does NOT apply.
  # Self-hosted deploy = copy the function sources into the stack's edge-runtime volume on the
  # VM and restart that service. Done over SSH. All connection details are overridable via env.
  #
  # ⚠️ VERIFY BEFORE FIRST USE: confirm the VM paths/service name match your stack. The sync is
  # intentionally additive (NO --delete) so it can never wipe the self-host `main` router that
  # the edge runtime needs in volumes/functions/main/.
  OCI_SSH_HOST="${OCI_SSH_HOST:-api-oci.mamtodoma.cz}"
  OCI_SSH_USER="${OCI_SSH_USER:-ubuntu}"
  OCI_SSH_KEY="${OCI_SSH_KEY:-$HOME/.ssh/oci_phase0}"
  OCI_STACK_DIR="${OCI_STACK_DIR:-/opt/phase0/supabase/docker}"
  OCI_FUNCTIONS_SERVICE="${OCI_FUNCTIONS_SERVICE:-functions}"

  echo "Deploying Edge Functions to PRODUCTION (self-hosted Supabase on Oracle)"
  echo "  target : $OCI_SSH_USER@$OCI_SSH_HOST:$OCI_STACK_DIR/volumes/functions/"
  echo "  key    : $OCI_SSH_KEY"
  echo "  service: $OCI_FUNCTIONS_SERVICE"

  rsync -az -e "ssh -i $OCI_SSH_KEY" \
    supabase/functions/ "$OCI_SSH_USER@$OCI_SSH_HOST:$OCI_STACK_DIR/volumes/functions/"
  ssh -i "$OCI_SSH_KEY" "$OCI_SSH_USER@$OCI_SSH_HOST" \
    "cd '$OCI_STACK_DIR' && docker compose restart '$OCI_FUNCTIONS_SERVICE'"

  echo "Done: production (functions synced + edge runtime restarted)"
  exit 0
fi

# Development: functions are normally served automatically by the local `supabase start` stack
# from supabase/functions/. This path targets a linked project only if one exists.
PROJECT_REF=$(cat supabase/.temp/project-ref 2>/dev/null || echo "")
if [[ -z "$PROJECT_REF" ]]; then
  echo "No linked project ref found at supabase/.temp/project-ref — run 'npx supabase link' first" >&2
  exit 1
fi

echo "Deploying Edge Functions to $ENV (project-ref: $PROJECT_REF)..."
npx supabase functions deploy --project-ref "$PROJECT_REF"
echo "Done: $ENV"
