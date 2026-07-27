-- The reference footer layout has a third informational column ("Vše o nákupu" — warranty/
-- pricing/policy pages) distinct from the "Zákaznický servis" column (O nás/Kontakt/Kariéra/...).
-- Add it as a new allowed column_key rather than overloading the existing ones.

ALTER TABLE footer_links DROP CONSTRAINT IF EXISTS footer_links_column_key_check;
ALTER TABLE footer_links ADD CONSTRAINT footer_links_column_key_check
  CHECK (column_key IN ('shop', 'information', 'customer_service', 'purchase_info', 'custom'));
