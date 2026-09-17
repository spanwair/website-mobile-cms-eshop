create index if not exists idx_orders_party_id on public.orders(party_id);
create index if not exists idx_products_party_id on public.products(party_id);
create index if not exists idx_inventory_items_party_id on public.inventory_items(party_id);
