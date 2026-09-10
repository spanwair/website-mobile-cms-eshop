#!/usr/bin/env bash
# Re-registers local Supabase Storage objects after their DB metadata was lost (e.g. by
# `supabase db reset`, which truncates storage.objects but leaves the blobs on the storage
# volume). Reads every blob straight from the storage container's volume and re-uploads it
# through the storage API (newest version per object path), rebuilding storage.objects.
#
# Idempotent and safe to run any time. See scripts/reset-db-safe.sh, which runs this
# automatically after every reset so a reset never leaves storage broken.
set -uo pipefail

URL="http://127.0.0.1:54321"

C=$(docker ps --format '{{.Names}}' 2>/dev/null | grep -i 'supabase_storage' | head -1)
[ -z "$C" ] && { echo "restore-local-storage: storage container not running, nothing to do"; exit 0; }

KEY=$(npx --yes supabase status -o env 2>/dev/null | sed -n 's/^SERVICE_ROLE_KEY="\?\([^"]*\)"\?$/\1/p')
if [ -z "${KEY:-}" ]; then
  # Fallback: read from a project .env.development if present in cwd or repo root.
  for f in ".env.development" "$(git rev-parse --show-toplevel 2>/dev/null)/.env.development"; do
    [ -f "$f" ] && KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' "$f" | cut -d= -f2-) && [ -n "$KEY" ] && break
  done
fi
[ -z "${KEY:-}" ] && { echo "restore-local-storage: could not resolve service role key"; exit 1; }

MANIFEST=$(mktemp)
docker exec "$C" sh -c 'find /mnt/stub/stub -type f -exec stat -c "%Y|%n" {} +' 2>/dev/null \
| while IFS='|' read -r mt path; do
    rel=${path#/mnt/stub/stub/}
    bucket=${rel%%/*}
    rest=${rel#*/}
    name=${rest%/*}
    printf '%s\t%s\t%s\t%s\n' "$bucket" "$name" "$mt" "$path"
  done \
| sort -t$'\t' -k1,2 -k3,3nr \
| awk -F'\t' '!seen[$1"\t"$2]++' > "$MANIFEST"

total=$(wc -l < "$MANIFEST")
[ "$total" -eq 0 ] && { echo "restore-local-storage: no blobs on volume, nothing to restore"; rm -f "$MANIFEST"; exit 0; }
echo "restore-local-storage: restoring $total object(s)..."

ok=0; fail=0
while IFS=$'\t' read -r bucket name mt path; do
  case "${name##*.}" in
    jpg|jpeg) ct=image/jpeg ;; png) ct=image/png ;; webp) ct=image/webp ;;
    svg) ct=image/svg+xml ;; gif) ct=image/gif ;; mp4) ct=video/mp4 ;;
    webm) ct=video/webm ;; pdf) ct=application/pdf ;; *) ct=application/octet-stream ;;
  esac
  code=$(docker exec "$C" cat "$path" \
    | curl -sS -o /dev/null -w '%{http_code}' -X POST "${URL}/storage/v1/object/${bucket}/${name}" \
        -H "Authorization: Bearer ${KEY}" -H "apikey: ${KEY}" \
        -H "Content-Type: ${ct}" -H "x-upsert: true" --data-binary @- 2>/dev/null)
  if [ "$code" = "200" ]; then ok=$((ok+1)); else fail=$((fail+1)); echo "  FAIL($code): ${bucket}/${name}"; fi
done < "$MANIFEST"
rm -f "$MANIFEST"
echo "restore-local-storage: restored $ok, failed $fail"
