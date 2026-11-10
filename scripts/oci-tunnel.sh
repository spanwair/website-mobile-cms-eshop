#!/usr/bin/env bash
# Self-healing SSH tunnel to the OCI prod Postgres pooler.
#
# This replaces the old "open a tunnel by hand in another terminal, hope it bound, hope it's
# still the one port-forwarding, decode a generic auth error if not" workflow. It is called
# automatically by scripts/_prod-db-url.sh, so `db-push.sh production` etc. need zero manual
# setup. It is idempotent and safe to call many times (e.g. once per script invocation):
#
#   - Reuses an already-healthy tunnel (verified with a real DB round trip, not just "process
#     exists" - ssh -f can background even when its port bind failed, leaving a useless zombie).
#   - If the preferred port is held by something else (any local Docker project can squat a
#     low port like 5433), it tries the next few ports automatically instead of failing.
#   - Only ever reports success after an actual `select 1` succeeds through the tunnel.
#
# Usage: scripts/oci-tunnel.sh [up|status|down]
#   up (default) - ensure a healthy tunnel exists, print its local port on stdout
#   status       - print up/down + pid/port, exit 0 if healthy else 1
#   down         - tear down the tracked tunnel
set -euo pipefail

cd "$(dirname "$0")/.."

SSH_KEY="${OCI_SSH_KEY:-$HOME/.ssh/oci_phase0}"
VM_HOST="ubuntu@api-oci.mamtodoma.cz"
REMOTE_PORT=5432
BASE_PORT="${OCI_TUNNEL_PORT:-5433}"
MAX_PORT_TRIES=8
ENV_FILE="${PROD_ENV_FILE:-.env.production}"

STATE_DIR="/tmp/oci-phase0-tunnel"
mkdir -p "$STATE_DIR"
PID_FILE="$STATE_DIR/tunnel.pid"
PORT_FILE="$STATE_DIR/tunnel.port"

unquote() { local v="${1%$'\r'}"; v="${v%\"}"; v="${v#\"}"; v="${v%\'}"; v="${v#\'}"; printf '%s' "$v"; }

port_is_listening() {
  ss -ltn 2>/dev/null | awk '{print $4}' | grep -qE ":$1\$"
}

tunnel_pid_alive() {
  [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null
}

db_probe() {
  local port="$1" pw tenant
  pw=$(unquote "$(grep '^POSTGRES_PASSWORD=' "$ENV_FILE" 2>/dev/null | cut -d= -f2-)")
  tenant=$(unquote "$(grep '^POOLER_TENANT_ID=' "$ENV_FILE" 2>/dev/null | cut -d= -f2-)")
  [[ -n "$pw" && -n "$tenant" ]] || return 1
  PGPASSWORD="$pw" PGSSLMODE=disable psql -h 127.0.0.1 -p "$port" \
    -U "supabase_admin.$tenant" -d postgres -tAc 'select 1' >/dev/null 2>&1
}

print_diagnostics() {
  local from="$1" to="$2" pattern
  pattern=":($(seq -s'|' "$from" "$to"))"
  echo "Diagnostics - what's actually listening on ports ${from}-${to}:" >&2
  ss -ltn 2>/dev/null | grep -E "$pattern" >&2 || echo "  (nothing found via ss -ltn)" >&2
  echo "Docker containers publishing a port in that range:" >&2
  docker ps --format '{{.Names}} {{.Ports}}' 2>/dev/null | grep -E "$pattern" >&2 || echo "  (no matching docker containers)" >&2
}

cmd_status() {
  if tunnel_pid_alive; then
    local p; p=$(cat "$PORT_FILE" 2>/dev/null || echo "")
    if [[ -n "$p" ]] && port_is_listening "$p" && db_probe "$p"; then
      echo "up: pid=$(cat "$PID_FILE") port=$p"
      return 0
    fi
  fi
  echo "down"
  return 1
}

cmd_up() {
  if tunnel_pid_alive; then
    local p; p=$(cat "$PORT_FILE" 2>/dev/null || echo "")
    if [[ -n "$p" ]] && port_is_listening "$p" && db_probe "$p"; then
      echo "$p"
      return 0
    fi
    echo "Existing tunnel (pid $(cat "$PID_FILE")) is dead or not forwarding - restarting." >&2
    kill "$(cat "$PID_FILE")" 2>/dev/null || true
    rm -f "$PID_FILE" "$PORT_FILE"
  fi

  local port="$BASE_PORT" tries=0
  while (( tries < MAX_PORT_TRIES )); do
    if port_is_listening "$port"; then
      echo "Port $port is already in use by something else on this machine - trying $((port + 1))." >&2
      port=$((port + 1)); tries=$((tries + 1)); continue
    fi

    ssh -o ServerAliveInterval=20 -o ServerAliveCountMax=3 -o ExitOnForwardFailure=yes \
        -i "$SSH_KEY" -fN -L "${port}:localhost:${REMOTE_PORT}" "$VM_HOST" 2>/dev/null || true
    sleep 1

    if port_is_listening "$port"; then
      local pid
      pid=$(pgrep -f "L ${port}:localhost:${REMOTE_PORT}.*${VM_HOST}" | head -1)
      if [[ -n "$pid" ]] && db_probe "$port"; then
        echo "$pid" > "$PID_FILE"
        echo "$port" > "$PORT_FILE"
        echo "$port"
        return 0
      fi
      echo "Port $port bound but the pooler didn't answer a real query - trying next port." >&2
      [[ -n "${pid:-}" ]] && kill "$pid" 2>/dev/null || true
    else
      echo "Port $port failed to bind (ExitOnForwardFailure caught it) - trying next port." >&2
    fi
    port=$((port + 1)); tries=$((tries + 1))
  done

  echo "ERROR: could not establish a working OCI tunnel after $MAX_PORT_TRIES attempts starting from $BASE_PORT." >&2
  print_diagnostics "$BASE_PORT" "$port"
  return 1
}

cmd_down() {
  if tunnel_pid_alive; then
    kill "$(cat "$PID_FILE")"
    echo "Tunnel (pid $(cat "$PID_FILE")) stopped."
  else
    echo "No tracked tunnel running."
  fi
  rm -f "$PID_FILE" "$PORT_FILE"
}

case "${1:-up}" in
  up) cmd_up ;;
  status) cmd_status ;;
  down) cmd_down ;;
  *) echo "Usage: $0 [up|status|down]" >&2; exit 1 ;;
esac
