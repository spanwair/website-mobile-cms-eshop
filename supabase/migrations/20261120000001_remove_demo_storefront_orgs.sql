-- eshop-repasado-dark and eshop-delegate-it were internal theme/demo samples, never real
-- customers. Both were fully public and indexed in sitemap.xml -- repasado-dark is a byte-for-
-- byte catalog clone of eshop-repasado (same product/blog/page slugs), which is almost certainly
-- the source of the site's "duplicate title tag" / "duplicate content" SEO findings; delegate-it's
-- products are literally named "ukazkovy-produkt-N" (Czech for "sample product"), contributing
-- thin/placeholder content to the index. Confirmed no real orders/customers on either -- cascading
-- party_id FKs remove every dependent row (products, content_pages, blog_posts, orders, etc.).
DELETE FROM parties WHERE slug IN ('repasado-dark', 'delegate-it');
