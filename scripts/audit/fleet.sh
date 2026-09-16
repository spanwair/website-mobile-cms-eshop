#!/usr/bin/env bash
set -euo pipefail
SLICE="${1:-}"
DRY="${2:-}"
if [[ -z "$SLICE" ]]; then echo "Usage: ./scripts/audit/fleet.sh <slice> [--dry-run]"; echo "Slices: products categories orders inventory pricing customers users-roles audit-parties shop-customer cms-settings reports-billing"; exit 1; fi
echo "[fleet] Dispatch for slice: $SLICE $DRY"
echo "[fleet] Step 1: scan-rls + scan-permissions (read-only)"
./scripts/audit/scan-rls.sh
./scripts/audit/scan-permissions.sh
echo "[fleet] Step 2: per-agent scans would run here via Task tool dispatch"
echo "[fleet] See docs/superpowers/specs/quiet-audit-fleet-spec.md for agent roster"
if [[ "$DRY" == "--dry-run" ]]; then echo "[fleet] dry-run done"; exit 0; fi
echo "[fleet] To launch agents: use opencode Task dispatch per docs/superpowers/plans/2026-09-17-quiet-audit-fleet.md"
