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
  # Connection resolution (first match wins):
  #   1. Build from POSTGRES_PASSWORD + POOLER_TENANT_ID (the source-of-truth keys from the VM's
  #      /opt/phase0/supabase/docker/.env). The pooler user MUST carry the tenant
  #      (supabase_admin.<tenant>), and the password is URL-encoded here so special characters
  #      can't corrupt the URL. Override the tunnelled port with OCI_TUNNEL_PORT (default 5433).
  #      This is preferred because the encoding is automatic — no hand-encoding to get wrong.
  #   2. Otherwise fall back to a full, ready-to-use OCI_DB_URL (you encode it yourself).
  # The pooler does not accept TLS, so default PGSSLMODE=disable (override by exporting PGSSLMODE).
  urlencode() {
    local s="$1" out="" c i
    for (( i=0; i<${#s}; i++ )); do
      c="${s:i:1}"
      case "$c" in
        [a-zA-Z0-9.~_-]) out+="$c" ;;
        *) printf -v c '%%%02X' "'$c"; out+="$c" ;;
      esac
    done
    printf '%s' "$out"
  }
  unquote() { local v="${1%$'\r'}"; v="${v%\"}"; v="${v#\"}"; v="${v%\'}"; v="${v#\'}"; printf '%s' "$v"; }
  PG_PW=$(unquote "$(grep '^POSTGRES_PASSWORD=' .env.production 2>/dev/null | cut -d= -f2-)")
  TENANT=$(unquote "$(grep '^POOLER_TENANT_ID=' .env.production 2>/dev/null | cut -d= -f2-)")
  if [[ -n "$PG_PW" && -n "$TENANT" ]]; then
    PORT="${OCI_TUNNEL_PORT:-5433}"
    SUPABASE_DB_URL="postgresql://supabase_admin.${TENANT}:$(urlencode "$PG_PW")@127.0.0.1:${PORT}/postgres"
  else
    SUPABASE_DB_URL=$(unquote "$(grep '^OCI_DB_URL=' .env.production 2>/dev/null | cut -d= -f2-)")
  fi
  if [[ -z "$SUPABASE_DB_URL" ]]; then
    echo "Missing prod DB credentials in .env.production." >&2
    echo "  Provide both POSTGRES_PASSWORD and POOLER_TENANT_ID (preferred), or a full OCI_DB_URL." >&2
    echo "  (Read them from the VM: /opt/phase0/supabase/docker/.env — see scripts/oci-prod-db.md)" >&2
    exit 1
  fi
  echo "Pushing DB migrations to PRODUCTION (self-hosted Supabase on Oracle)..."
  PGSSLMODE="${PGSSLMODE:-disable}" npx supabase db push --db-url "$SUPABASE_DB_URL" --include-all
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
