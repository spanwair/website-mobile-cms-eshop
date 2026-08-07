#!/usr/bin/env bash
# One-off uploader: pushes the real Kytka z Beskyd product/logo photos (cached in the
# scratchpad from the original onboarding scrape) into local dev Supabase Storage, and prints
# the resulting public URLs so they can be pasted into supabase/seed/kytka_store_*.sql.
# Requires: local Supabase stack running, SUPABASE_SERVICE_ROLE_KEY in .env.development.
set -euo pipefail

SRC_DIR="${1:?Usage: upload-kytka-media.sh <source-image-dir>}"
SUPABASE_URL="http://127.0.0.1:54321"
SERVICE_KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' .env.development | cut -d= -f2-)
PARTY_ID="a0000000-0000-0000-0000-000000000003"

upload() {
  local bucket="$1" path="$2" file="$3" ctype="$4"
  curl -sS -X POST "${SUPABASE_URL}/storage/v1/object/${bucket}/${path}" \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    -H "apikey: ${SERVICE_KEY}" \
    -H "Content-Type: ${ctype}" \
    --data-binary "@${file}" \
    -H "x-upsert: true" > /dev/null
  echo "${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}"
}

declare -A PRODUCT_MAP=(
  [product-1.jpeg]="podzimni-venec-bukove-listi"
  [product-2.jpg]="venec-slamenka-slunecnice"
  [product-3.jpg]="venec-eukalyptus-susene-kvety"
  [product-4.jpeg]="celorocni-venec-levandule"
  [product-5.jpeg]="svatebni-kytice-susene-ruze"
  [product-6.jpeg]="svatebni-kytice-boho"
  [product-7.jpg]="korsaz-a-butonnierka-set"
  [product-8.jpg]="smutecni-venec-bile-chryzantemy"
  [product-9.jpeg]="smutecni-kytice-fialova"
  [product-10.jpeg]="susena-kytice-do-vazy"
  [product-11.jpg]="mini-susena-dekorace-stul"
  [product-12.jpeg]="darkovy-set-mini-venecek"
)

echo "-- product image URLs --"
for f in "${!PRODUCT_MAP[@]}"; do
  slug="${PRODUCT_MAP[$f]}"
  ext="${f##*.}"
  ctype="image/jpeg"
  [ "$ext" = "png" ] && ctype="image/png"
  url=$(upload "product-images" "${PARTY_ID}/${slug}.${ext}" "${SRC_DIR}/${f}" "${ctype}")
  echo "${slug} ${url}"
done

echo "-- logo URL --"
logo_url=$(upload "store-media" "${PARTY_ID}/logo.jpg" "${SRC_DIR}/logo.jpg" "image/jpeg")
echo "logo ${logo_url}"
