#!/usr/bin/env bash
# Copies every object in the storage buckets used by this project (product-images,
# product-videos, store-media) from local dev Supabase Storage to the production project.
# Run AFTER `./scripts/db-push.sh production` (buckets/policies are created by migrations).
# Requires: local Supabase stack running, jq, and real values in .env.production
# (PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
set -euo pipefail

BUCKETS=(product-images product-videos store-media)

SRC_URL="http://127.0.0.1:54321"
SRC_KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' .env.development | cut -d= -f2-)

DST_URL=$(grep '^PUBLIC_SUPABASE_URL=' .env.production | cut -d= -f2-)
DST_KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' .env.production | cut -d= -f2-)

if [[ -z "$DST_URL" || -z "$DST_KEY" || "$DST_URL" == *127.0.0.1* ]]; then
  echo "PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing or still pointing at localhost in .env.production" >&2
  exit 1
fi

# Recursively lists every object path under $2 in $1's bucket $3 (Storage list API is one level at a time).
list_paths() {
  local base_url="$1" key="$2" bucket="$3" prefix="$4"
  local body
  body=$(jq -n --arg prefix "$prefix" '{prefix:$prefix, limit:1000, sortBy:{column:"name",order:"asc"}}')
  local entries
  entries=$(curl -sS -X POST "${base_url}/storage/v1/object/list/${bucket}" \
    -H "Authorization: Bearer ${key}" -H "apikey: ${key}" -H "Content-Type: application/json" \
    -d "$body")
  echo "$entries" | jq -c '.[]' | while read -r entry; do
    name=$(echo "$entry" | jq -r '.name')
    id=$(echo "$entry" | jq -r '.id')
    path="${prefix:+$prefix/}$name"
    if [[ "$id" == "null" ]]; then
      list_paths "$base_url" "$key" "$bucket" "$path"
    else
      echo "$path"
    fi
  done
}

for bucket in "${BUCKETS[@]}"; do
  echo ""
  echo "${bucket}: listing objects..."
  mapfile -t paths < <(list_paths "$SRC_URL" "$SRC_KEY" "$bucket" "")
  echo "${bucket}: ${#paths[@]} objects to copy"

  copied=0
  for path in "${paths[@]}"; do
    tmpfile=$(mktemp)
    if ! curl -sS -f "${SRC_URL}/storage/v1/object/${bucket}/${path}" \
      -H "Authorization: Bearer ${SRC_KEY}" -H "apikey: ${SRC_KEY}" -o "$tmpfile"; then
      echo "  FAILED download ${path}" >&2
      rm -f "$tmpfile"
      continue
    fi
    ctype=$(file -b --mime-type "$tmpfile")
    if ! curl -sS -f -X POST "${DST_URL}/storage/v1/object/${bucket}/${path}" \
      -H "Authorization: Bearer ${DST_KEY}" -H "apikey: ${DST_KEY}" \
      -H "Content-Type: ${ctype}" -H "x-upsert: true" \
      --data-binary "@${tmpfile}" > /dev/null; then
      echo "  FAILED upload ${path}" >&2
      rm -f "$tmpfile"
      continue
    fi
    rm -f "$tmpfile"
    copied=$((copied + 1))
  done
  echo "${bucket}: done (${copied}/${#paths[@]} copied)"
done

echo ""
echo "Storage clone complete."
