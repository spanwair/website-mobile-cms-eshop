---
name: storefront-tester
description: Verifies a newly seeded storefront org end to end — DB row counts, storefront page rendering (home/product/about/blog), placeholder images resolving, and admin visibility — after storefront-publisher applies the seed. Use as the final step before Product Agent reports completion.
tools: [terminal, read_file]
---

# Storefront Tester Agent

You confirm the new org actually works, not just that the SQL ran without error. Run every
check below and report PASS/FAIL per item — don't summarize away a failure.

## DB checks

```bash
DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
PGPASSWORD=postgres psql "$DB_URL" -c "SELECT slug,status FROM parties WHERE slug='<slug>';"
PGPASSWORD=postgres psql "$DB_URL" -c "SELECT count(*) FROM categories WHERE party_id=(SELECT id FROM parties WHERE slug='<slug>');"
PGPASSWORD=postgres psql "$DB_URL" -c "SELECT count(*) FROM products WHERE party_id=(SELECT id FROM parties WHERE slug='<slug>');"
PGPASSWORD=postgres psql "$DB_URL" -c "SELECT count(*) FROM content_pages WHERE party_id=(SELECT id FROM parties WHERE slug='<slug>');"
```
Counts must be non-zero and roughly match the planner's spec.

## Storefront rendering checks

Confirm the Astro dev server is up (`curl -s -o /dev/null -w '%{http_code}' http://localhost:4321/` → 200; if not 200, the dev server isn't running — start it, don't skip the check), then:

```bash
curl -s http://localhost:4321/eshop-<slug>/ -o /tmp/<slug>_home.html -w "home: %{http_code}\n"
curl -s http://localhost:4321/eshop-<slug>/<a-product-slug> -o /tmp/<slug>_product.html -w "product: %{http_code}\n"
curl -s http://localhost:4321/eshop-<slug>/stranka/<about-slug> -o /tmp/<slug>_about.html -w "about: %{http_code}\n"
curl -s http://localhost:4321/eshop-<slug>/blog -o /tmp/<slug>_blog.html -w "blog: %{http_code}\n"
curl -s -o /dev/null -w "image: %{http_code}\n" http://localhost:4321/<slug>-media/<a-product-image-slug>.svg
```
All must be 200. Then `grep` each saved HTML file for the brand name, a product title, and a
piece of seeded copy to confirm real data rendered (not an empty/error page that still
returns 200).

## Known bug classes to explicitly re-check every time

These two slipped through on the first Kytka z Beskyd build and were only caught by the user
looking at the actual page — don't rely on HTTP 200s alone to catch them:

1. **False "Vyprodáno"/out-of-stock badges.** `grep -c "Vyprodáno" <home.html>` and the
   category page for a made-to-order-heavy category. Any hit on a product you know should be
   orderable is a FAIL — check `inventory_items.track_inventory` per
   `storefront-database` rule 8 (made-to-order variants and their product-level rollup row
   must both be `false`).
2. **Missing hero/blog images.** `grep -o "storage/v1/object/public\|<slug>-media" <home.html>`
   for the hero section and `<blog.html>` for post cards — an empty result means
   `hero_slides.image_url` / `blog_posts.featured_image_url` were left `NULL` (rule 9). These
   fail silently (still 200, just visually blank), so an HTTP-code-only check misses them.

## Admin visibility check

Full interactive admin verification needs a logged-in browser session — if
`mcp__claude-in-chrome__*` tools are connected, use them to log in as an existing owner/admin
account (never enter a password yourself if that would require guessing/inventing
credentials — ask the user for a session or credentials if none are available) and confirm
the new party appears in the party switcher and `/admin/products` lists its catalog.

If browser tools aren't available, it's acceptable to substitute a DB-level proof: confirm at
least one `profiles.role >= 8` (owner) account exists — owners see all parties automatically
by design (`isGlobal = isOwner`, see `admin-permissions` skill), so a new party is guaranteed
visible to them without further seeding. State clearly in the report which verification method
was used.

## Output format

```
PASS/FAIL per check, e.g.:
DB counts: PASS (6 categories, 12 products, 11 content_pages)
Storefront home: PASS (200, brand name found)
Storefront product: PASS (200, price + variant found)
Storefront about: PASS (200)
Storefront blog: PASS (200)
Placeholder image: PASS (200)
Admin visibility: PASS (via DB — owner accounts exist, global access confirmed) | PASS (via browser — logged in as X, party visible)
```

## What NOT to do

- Never report PASS on a check you didn't actually run
- Never silently substitute a weaker check without saying so in the report
