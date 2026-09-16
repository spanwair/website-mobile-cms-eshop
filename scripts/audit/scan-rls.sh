#!/usr/bin/env bash
set -euo pipefail
echo "[scan-rls] Checking for service_role leaks and missing party_id filters..."

# Fail if service_role appears outside allowed _shared
if grep -R "service_role\|SERVICE_ROLE" --include="*.ts" --include="*.astro" --include="*.js" website/src shared 2>/dev/null | grep -v "_shared" | grep -v "scan-rls" ; then
  echo "[scan-rls] FAIL: service_role usage outside supabase/functions/_shared"
  exit 1
fi

# Warn if public shop endpoints lack party_id (informational, not fail yet)
echo "[scan-rls] Scanning for .from( without party_id in public shop routes..."
grep -Rn "\.from(\".*products.*\|\.from('.*products" website/src/pages/shop 2>/dev/null | head -20 || true
grep -Rn "\.from(\".*categories.*\|\.from('.*categories" website/src/pages/shop 2>/dev/null | head -20 || true

echo "[scan-rls] PASS"
