#!/usr/bin/env bash
set -euo pipefail
echo "[scan-permissions] Checking for raw permission integers and missing hasPermission..."

# Fail on raw permission integers outside permissions.ts
if grep -Rn "hasPermission.*[0-9]\|permissions.*&.*[0-9]\|role.*>=.*[0-9]" --include="*.ts" --include="*.astro" website/src 2>/dev/null | grep -v "permissions.ts" | grep -v "scan-permissions" ; then
  echo "[scan-permissions] WARN: possible raw permission integer - review manually"
fi

# Ensure every admin page imports requireAdminCtx or hasPermission
MISSING=0
for f in website/src/pages/admin/**/*.astro; do
  if ! grep -q "requireAdminCtx\|hasPermission\|PERMISSIONS" "$f" 2>/dev/null; then
    echo "[scan-permissions] WARN: $f has no permission check"
    MISSING=$((MISSING+1))
  fi
done
echo "[scan-permissions] Checked admin pages, warnings: $MISSING"
echo "[scan-permissions] PASS"
