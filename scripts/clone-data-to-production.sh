#!/usr/bin/env bash
# Copies storefront content (parties, catalog, CMS, inventory) from local dev Postgres
# to the production Supabase Postgres. Deliberately excludes user/account/order data
# (profiles, auth.users, customers, addresses, carts, orders, reviews, wishlists,
# notifications, audit_logs) — those are dev/test fixtures, not production content.
# Run AFTER `./scripts/db-push.sh production` (tables must already exist).
# Requires: local Supabase stack running, pg_dump/psql, and SUPABASE_DB_URL_POOLER in .env.production.
set -euo pipefail

# Parent-first order — matters here: COPY blocks land in this order inside one transaction,
# and only the two self-referencing FKs (categories.parent_id, nav_items.parent_id) are
# deferrable, so every other FK is still checked immediately as its table's COPY runs.
TABLES=(
  parties store_configs store_domains party_color_presets product_conditions brands
  categories products product_variants product_images product_categories product_tags
  warehouses inventory_items stock_movements roles price_lists price_list_items
  discount_rules coupons promotions commissionaire_agreements content_pages blog_posts
  faq_items footer_links footer_badges hero_slides nav_items benefit_items team_members
  media_categories store_media media_category_assignments
)

DST_URL=$(grep '^SUPABASE_DB_URL_POOLER=' .env.production 2>/dev/null | cut -d= -f2-)
if [[ -z "$DST_URL" || "$DST_URL" == *127.0.0.1* ]]; then
  echo "SUPABASE_DB_URL_POOLER missing or still pointing at localhost in .env.production" >&2
  exit 1
fi

# Local Supabase's Postgres is 15.x — the host pg_dump/psql may be an older major
# version and pg_dump refuses to talk to a newer server. Run both ends inside the
# local db container, whose client tools match the server exactly and which already
# has outbound network access to the Supabase pooler.
CONTAINER=$(docker ps --filter "name=supabase_db_" --format '{{.Names}}' | head -1)
if [[ -z "$CONTAINER" ]]; then
  echo "No running supabase_db_* container found — is 'supabase start' running?" >&2
  exit 1
fi

TABLE_ARGS=()
for t in "${TABLES[@]}"; do
  TABLE_ARGS+=(--table="public.$t")
done

echo "Dumping content tables from local dev (container: $CONTAINER)..."
echo "Loading into production..."
# --disable-triggers needs superuser to disable FK-enforcing system triggers, which the
# Supabase postgres role doesn't have — deferring the two self-referencing FKs instead
# (see migration 20260103000068) lets --single-transaction check them at COMMIT.
{
  echo "SET CONSTRAINTS ALL DEFERRED;"
  docker exec "$CONTAINER" pg_dump -U postgres -d postgres \
    --data-only --no-owner --no-privileges \
    "${TABLE_ARGS[@]}"
} | docker exec -i -e PGSSLMODE=require "$CONTAINER" \
    psql "$DST_URL" -v ON_ERROR_STOP=1 --single-transaction -f -

echo ""
echo "Data clone complete: ${#TABLES[@]} tables."
