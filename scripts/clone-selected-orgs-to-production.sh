#!/usr/bin/env bash
# Clones specific storefront orgs (by slug) from local dev to production, scoped to just
# those orgs' rows. Unlike clone-data-to-production.sh (which copies every party in local
# dev), this is for promoting a handful of real orgs while local dev also holds test/demo
# orgs and users that must never reach production. Deliberately copies zero rows from
# auth.users/profiles/user_party_roles — real users should sign in to production directly
# (magic link / Google OAuth) so Supabase Auth creates a correctly-structured account;
# role can then be set with a single UPDATE.
# Run AFTER `./scripts/db-push.sh production` (tables + FK-defer migration must exist).
# Requires: local Supabase stack running, SUPABASE_DB_URL_POOLER in .env.production.
set -euo pipefail

SLUGS=("$@")
if [[ ${#SLUGS[@]} -eq 0 ]]; then
  echo "Usage: $0 <slug1> [slug2 ...]" >&2
  exit 1
fi

DST_URL=$(grep '^SUPABASE_DB_URL_POOLER=' .env.production 2>/dev/null | cut -d= -f2-)
if [[ -z "$DST_URL" || "$DST_URL" == *127.0.0.1* ]]; then
  echo "SUPABASE_DB_URL_POOLER missing or still pointing at localhost in .env.production" >&2
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
PARTY_IDS=$(psql_local -c "select string_agg(quote_literal(id::text), ',') from parties where slug in ($SLUG_LIST);")
if [[ -z "$PARTY_IDS" ]]; then
  echo "No parties found for slugs: ${SLUGS[*]}" >&2
  exit 1
fi
echo "Target parties (${SLUGS[*]}): $PARTY_IDS"

declare -A FILTERS=(
  [parties]="id in ($PARTY_IDS)"
  [store_configs]="party_id in ($PARTY_IDS)"
  [store_domains]="party_id in ($PARTY_IDS)"
  [party_color_presets]="party_id in ($PARTY_IDS)"
  [product_conditions]="party_id in ($PARTY_IDS)"
  [brands]="party_id in ($PARTY_IDS)"
  [categories]="party_id in ($PARTY_IDS)"
  [products]="party_id in ($PARTY_IDS)"
  [product_variants]="product_id in (select id from products where party_id in ($PARTY_IDS))"
  [product_images]="product_id in (select id from products where party_id in ($PARTY_IDS))"
  [product_categories]="product_id in (select id from products where party_id in ($PARTY_IDS))"
  [product_tags]="product_id in (select id from products where party_id in ($PARTY_IDS))"
  [warehouses]="party_id in ($PARTY_IDS)"
  [inventory_items]="party_id in ($PARTY_IDS)"
  [stock_movements]="party_id in ($PARTY_IDS)"
  [price_lists]="party_id in ($PARTY_IDS)"
  [price_list_items]="price_list_id in (select id from price_lists where party_id in ($PARTY_IDS))"
  [discount_rules]="party_id in ($PARTY_IDS)"
  [coupons]="party_id in ($PARTY_IDS)"
  [promotions]="party_id in ($PARTY_IDS)"
  [content_pages]="party_id in ($PARTY_IDS)"
  [blog_posts]="party_id in ($PARTY_IDS)"
  [faq_items]="party_id in ($PARTY_IDS)"
  [footer_links]="party_id in ($PARTY_IDS)"
  [footer_badges]="party_id in ($PARTY_IDS)"
  [hero_slides]="party_id in ($PARTY_IDS)"
  [nav_items]="party_id in ($PARTY_IDS)"
  [benefit_items]="party_id in ($PARTY_IDS)"
  [team_members]="party_id in ($PARTY_IDS)"
  [media_categories]="party_id in ($PARTY_IDS)"
  [store_media]="party_id in ($PARTY_IDS)"
  [media_category_assignments]="media_id in (select id from store_media where party_id in ($PARTY_IDS))"
)

# Parent-first order (FK dependency order; categories/nav_items self-refs are deferrable
# per migration 20260103000068, so within-table order doesn't matter).
TABLES_ORDER=(parties store_configs store_domains party_color_presets product_conditions brands
  categories products product_variants product_images product_categories product_tags
  warehouses inventory_items stock_movements price_lists price_list_items discount_rules
  coupons promotions content_pages blog_posts faq_items footer_links footer_badges
  hero_slides nav_items benefit_items team_members media_categories store_media
  media_category_assignments)

WORKDIR=$(mktemp -d)
trap 'rm -rf "$WORKDIR"' EXIT
docker exec "$CONTAINER" mkdir -p /tmp/org_clone
trap 'rm -rf "$WORKDIR"; docker exec "$CONTAINER" rm -rf /tmp/org_clone' EXIT

# These AFTER INSERT triggers auto-create rows (default store_configs/roles on new parties,
# default inventory_items on new products/variants) or apply side effects (stock_movements
# adjusting inventory_items.qty_on_hand) — all of which either collide with the real rows
# we're about to load, or double-apply deltas on top of already-final data. Disabled for the
# load, re-enabled before commit. These are plain user triggers (table owner can toggle them),
# unlike the FK-enforcing system triggers pg_dump's --disable-triggers needs superuser for.
SIDE_EFFECT_TRIGGERS=(
  "parties:on_party_created_seed_store_config"
  "parties:on_party_created_seed_role"
  "parties:on_party_created_assign_admin"
  "products:trg_auto_inventory_on_product"
  "product_variants:trg_auto_inventory_on_variant"
  "stock_movements:stock_movements_apply"
)

LOAD_SCRIPT="$WORKDIR/load.sql"
echo "SET CONSTRAINTS ALL DEFERRED;" > "$LOAD_SCRIPT"
for te in "${SIDE_EFFECT_TRIGGERS[@]}"; do
  echo "ALTER TABLE ${te%%:*} DISABLE TRIGGER ${te##*:};" >> "$LOAD_SCRIPT"
done

# We never clone auth.users, so any column FK'd to it must be nulled in the dump —
# otherwise it references a user id that doesn't exist in production.
declare -A COLUMN_OVERRIDES=(
  ["stock_movements:created_by"]="NULL::uuid"
  ["party_color_presets:created_by"]="NULL::uuid"
)

echo "Dumping filtered rows from local dev..."
for t in "${TABLES_ORDER[@]}"; do
  mapfile -t col_names < <(psql_local -c "select column_name from information_schema.columns where table_schema='public' and table_name='$t' and is_generated='NEVER' order by ordinal_position;")
  cols=$(IFS=,; echo "${col_names[*]}")
  select_exprs=""
  for c in "${col_names[@]}"; do
    override="${COLUMN_OVERRIDES[$t:$c]:-}"
    expr="${override:-\"$c\"}"
    select_exprs="${select_exprs:+$select_exprs,}$expr"
  done
  where="${FILTERS[$t]}"
  n=$(psql_local -c "select count(*) from $t where $where;")
  echo "  $t: $n rows"
  if [[ "$n" != "0" ]]; then
    docker exec "$CONTAINER" psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
      -c "\\copy (select $select_exprs from $t where $where) to '/tmp/org_clone/$t.csv'"
    echo "\\copy $t ($cols) FROM '/tmp/org_clone/$t.csv'" >> "$LOAD_SCRIPT"
  fi
done

for te in "${SIDE_EFFECT_TRIGGERS[@]}"; do
  echo "ALTER TABLE ${te%%:*} ENABLE TRIGGER ${te##*:};" >> "$LOAD_SCRIPT"
done

echo "Loading into production..."
docker exec -i -e PGSSLMODE=require "$CONTAINER" \
  psql "$DST_URL" -v ON_ERROR_STOP=1 --single-transaction -f - < "$LOAD_SCRIPT"

echo ""
echo "Selected-org clone complete: ${SLUGS[*]}"
