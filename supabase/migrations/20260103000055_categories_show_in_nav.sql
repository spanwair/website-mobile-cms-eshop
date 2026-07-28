-- Separate flag from is_visible: a category can be sellable/browsable ("visible to customers")
-- without cluttering the storefront mega-nav. Only top-level + their direct children are read
-- into the nav (see fetchNavCategories); deeper nesting is ignored there by design.

ALTER TABLE categories ADD COLUMN IF NOT EXISTS show_in_nav BOOLEAN NOT NULL DEFAULT false;
