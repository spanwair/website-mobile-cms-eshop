-- Admins can now name their own footer column (e.g. "Návody") instead of being limited to the
-- fixed system buckets. Drop the closed enum check in favor of a simple non-empty guard; the
-- app still treats 'shop'/'information'/'purchase_info'/'customer_service'/'custom' as the known
-- system columns with translated labels (see SYSTEM_FOOTER_COLUMNS), everything else renders
-- under its own column using column_key as the literal label.

ALTER TABLE footer_links DROP CONSTRAINT IF EXISTS footer_links_column_key_check;
ALTER TABLE footer_links ADD CONSTRAINT footer_links_column_key_check
  CHECK (length(trim(column_key)) > 0);
