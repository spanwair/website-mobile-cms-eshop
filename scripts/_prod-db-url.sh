#!/usr/bin/env bash
# Resolve the production (self-hosted Supabase on Oracle Cloud) pooler connection URL and print it
# on stdout. Access goes through the Supavisor pooler (session mode) over an SSH tunnel to the VM:
#   ssh -o ServerAliveInterval=20 -o ServerAliveCountMax=3 -i ~/.ssh/oci_phase0 -fN \
#       -L 5433:localhost:5432 ubuntu@api-oci.mamtodoma.cz
# See scripts/oci-prod-db.md for the full procedure.
#
# Resolution (first match wins):
#   1. Build from POSTGRES_PASSWORD + POOLER_TENANT_ID (source-of-truth keys from the VM's
#      /opt/phase0/supabase/docker/.env). The pooler user MUST carry the tenant
#      (supabase_admin.<tenant>), and the password is URL-encoded so special characters can't
#      corrupt the URL. Override the tunnelled port with OCI_TUNNEL_PORT (default 5433).
#   2. Otherwise fall back to a full, ready-to-use OCI_DB_URL (you encode it yourself).
set -euo pipefail

ENV_FILE="${PROD_ENV_FILE:-.env.production}"

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

PG_PW=$(unquote "$(grep '^POSTGRES_PASSWORD=' "$ENV_FILE" 2>/dev/null | cut -d= -f2-)")
TENANT=$(unquote "$(grep '^POOLER_TENANT_ID=' "$ENV_FILE" 2>/dev/null | cut -d= -f2-)")
if [[ -n "$PG_PW" && -n "$TENANT" ]]; then
  PORT="${OCI_TUNNEL_PORT:-5433}"
  printf 'postgresql://supabase_admin.%s:%s@127.0.0.1:%s/postgres' "$TENANT" "$(urlencode "$PG_PW")" "$PORT"
else
  URL=$(unquote "$(grep '^OCI_DB_URL=' "$ENV_FILE" 2>/dev/null | cut -d= -f2-)")
  if [[ -z "$URL" ]]; then
    echo "Missing prod DB credentials in $ENV_FILE." >&2
    echo "  Provide both POSTGRES_PASSWORD and POOLER_TENANT_ID (preferred), or a full OCI_DB_URL." >&2
    echo "  (Read them from the VM: /opt/phase0/supabase/docker/.env - see scripts/oci-prod-db.md)" >&2
    exit 1
  fi
  printf '%s' "$URL"
fi
