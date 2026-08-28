-- Packeta "Consignment to Z-BOX": a 9-digit code (packetInfo's consignPassword) that lets
-- warehouse staff drop a labeled parcel directly into a Z-BOX keypad instead of visiting a
-- staffed pick-up point. Packeta-only — stays null for PPL shipments.

ALTER TABLE order_shipments
  ADD COLUMN IF NOT EXISTS consignment_code TEXT;
