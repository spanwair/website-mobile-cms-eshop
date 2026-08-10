#!/usr/bin/env bash
# Copies Supabase Storage objects referenced by already-cloned rows (store_media,
# product_images, product_videos) from local dev's storage to production storage at the
# same bucket/path, then rewrites the http://127.0.0.1:54321 URLs in production's DB to
# the real production Storage URL. clone-selected-orgs-to-production.sh only copies DB
# rows, not the underlying files — this closes that gap for a given set of org slugs.
# Requires: local Supabase stack running, PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
# in .env.production.
set -euo pipefail

SLUGS=("$@")
if [[ ${#SLUGS[@]} -eq 0 ]]; then
  echo "Usage: $0 <slug1> [slug2 ...]" >&2
  exit 1
fi

PROD_URL=$(grep '^PUBLIC_SUPABASE_URL=' .env.production 2>/dev/null | cut -d= -f2-)
SERVICE_KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' .env.production 2>/dev/null | cut -d= -f2-)
DST_DB_URL=$(grep '^SUPABASE_DB_URL_POOLER=' .env.production 2>/dev/null | cut -d= -f2-)
if [[ -z "$PROD_URL" || -z "$SERVICE_KEY" || -z "$DST_DB_URL" ]]; then
  echo "PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_DB_URL_POOLER missing in .env.production" >&2
  exit 1
fi

CONTAINER=$(docker ps --filter "name=supabase_db_" --format '{{.Names}}' | head -1)
if [[ -z "$CONTAINER" ]]; then
  echo "No running supabase_db_* container found — is 'supabase start' running?" >&2
  exit 1
fi

psql_local() { docker exec "$CONTAINER" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -tA "$@"; }

SLUG_LIST=$(printf "'%s'," "${SLUGS[@]}")
SLUG_LIST="${SLUG_LIST%,}"

WORKDIR=$(mktemp -d)
trap 'rm -rf "$WORKDIR"' EXIT

# Every column across the app that can hold a Supabase Storage URL for these orgs.
mapfile -t URLS < <(psql_local -c "
  select distinct url from (
    select sm.url from store_media sm join parties p on p.id = sm.party_id where p.slug in ($SLUG_LIST)
    union select pi.url from product_images pi join products pr on pr.id = pi.product_id join parties p on p.id = pr.party_id where p.slug in ($SLUG_LIST)
    union select b.featured_image_url from blog_posts b join parties p on p.id = b.party_id where p.slug in ($SLUG_LIST)
    union select c.image_url from categories c join parties p on p.id = c.party_id where p.slug in ($SLUG_LIST)
    union select h.image_url from hero_slides h join parties p on p.id = h.party_id where p.slug in ($SLUG_LIST)
    union select br.logo_url from brands br join parties p on p.id = br.party_id where p.slug in ($SLUG_LIST)
    union select parties.logo_url from parties where slug in ($SLUG_LIST)
    union select pr2.banner_image_url from promotions pr2 join parties p on p.id = pr2.party_id where p.slug in ($SLUG_LIST)
    union select t.photo_url from team_members t join parties p on p.id = t.party_id where p.slug in ($SLUG_LIST)
    union select sc.favicon_url from store_configs sc join parties p on p.id = sc.party_id where p.slug in ($SLUG_LIST)
    union select sc.logo_url from store_configs sc join parties p on p.id = sc.party_id where p.slug in ($SLUG_LIST)
    union select sc.store_map_url from store_configs sc join parties p on p.id = sc.party_id where p.slug in ($SLUG_LIST)
    union select sc.store_photo_url from store_configs sc join parties p on p.id = sc.party_id where p.slug in ($SLUG_LIST)
  ) x where url like 'http://127.0.0.1%' order by 1;
")

echo "Found ${#URLS[@]} local-storage files to copy for: ${SLUGS[*]}"

for src_url in "${URLS[@]}"; do
  path="${src_url#*/storage/v1/object/public/}"
  bucket="${path%%/*}"
  object="${path#*/}"
  echo "  $bucket/$object"
  local_file="$WORKDIR/$(basename "$object")"
  curl -sf "$src_url" -o "$local_file"
  content_type=$(file --mime-type -b "$local_file")
  curl -sf -X POST "$PROD_URL/storage/v1/object/$bucket/$object" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "apikey: $SERVICE_KEY" \
    -H "Content-Type: $content_type" \
    -H "x-upsert: true" \
    --data-binary "@$local_file" >/dev/null
done

echo "Rewriting URLs in production DB..."
docker exec -e PGSSLMODE=require "$CONTAINER" psql "$DST_DB_URL" -v ON_ERROR_STOP=1 -c "
  update store_media set url = replace(url, 'http://127.0.0.1:54321', '$PROD_URL') where url like 'http://127.0.0.1:54321%';
  update product_images set url = replace(url, 'http://127.0.0.1:54321', '$PROD_URL') where url like 'http://127.0.0.1:54321%';
  update blog_posts set featured_image_url = replace(featured_image_url, 'http://127.0.0.1:54321', '$PROD_URL') where featured_image_url like 'http://127.0.0.1:54321%';
  update categories set image_url = replace(image_url, 'http://127.0.0.1:54321', '$PROD_URL') where image_url like 'http://127.0.0.1:54321%';
  update hero_slides set image_url = replace(image_url, 'http://127.0.0.1:54321', '$PROD_URL') where image_url like 'http://127.0.0.1:54321%';
  update brands set logo_url = replace(logo_url, 'http://127.0.0.1:54321', '$PROD_URL') where logo_url like 'http://127.0.0.1:54321%';
  update parties set logo_url = replace(logo_url, 'http://127.0.0.1:54321', '$PROD_URL') where logo_url like 'http://127.0.0.1:54321%';
  update promotions set banner_image_url = replace(banner_image_url, 'http://127.0.0.1:54321', '$PROD_URL') where banner_image_url like 'http://127.0.0.1:54321%';
  update team_members set photo_url = replace(photo_url, 'http://127.0.0.1:54321', '$PROD_URL') where photo_url like 'http://127.0.0.1:54321%';
  update store_configs set favicon_url = replace(favicon_url, 'http://127.0.0.1:54321', '$PROD_URL') where favicon_url like 'http://127.0.0.1:54321%';
  update store_configs set logo_url = replace(logo_url, 'http://127.0.0.1:54321', '$PROD_URL') where logo_url like 'http://127.0.0.1:54321%';
  update store_configs set store_map_url = replace(store_map_url, 'http://127.0.0.1:54321', '$PROD_URL') where store_map_url like 'http://127.0.0.1:54321%';
  update store_configs set store_photo_url = replace(store_photo_url, 'http://127.0.0.1:54321', '$PROD_URL') where store_photo_url like 'http://127.0.0.1:54321%';
"

echo "Done: ${#URLS[@]} files copied and URLs rewritten."
