#!/usr/bin/env bash
# One-off uploader: pushes the Repasado demo org's category-icon SVGs (already checked into
# website/public/demo-media/) into Supabase Storage and prints the resulting public URLs, so
# category.image_url can point at admin-manageable store_media rows instead of a hardcoded
# static file path. See supabase/seed/demo_store_org.sql for where these URLs get pasted in.
# Requires: local Supabase stack running, SUPABASE_SERVICE_ROLE_KEY in .env.development,
# store-media bucket must already allow image/svg+xml (see migration 20260103000059).
set -euo pipefail

SUPABASE_URL="http://127.0.0.1:54321"
SERVICE_KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' .env.development | cut -d= -f2-)
PARTY_ID="a0000000-0000-0000-0000-000000000001"
SRC_DIR="website/public/demo-media"

upload() {
  local path="$1" file="$2"
  curl -sS -X POST "${SUPABASE_URL}/storage/v1/object/store-media/${path}" \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Content-Type: image/svg+xml" \
    --data-binary "@${file}" \
    -H "x-upsert: true" > /dev/null
  echo "${SUPABASE_URL}/storage/v1/object/public/store-media/${path}"
}

echo "-- category icon URLs --"
for slug in prislusenstvi iphone ipad mac watch audio; do
  url=$(upload "${PARTY_ID}/category-${slug}.svg" "${SRC_DIR}/${slug}.svg")
  echo "${slug} ${url}"
done
