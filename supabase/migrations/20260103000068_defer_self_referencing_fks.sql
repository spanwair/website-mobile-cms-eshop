-- categories.parent_id and nav_items.parent_id are self-referencing FKs, which pg_dump
-- flags as circular deps on --data-only restores. --disable-triggers needs superuser,
-- which Supabase's postgres role doesn't have. Marking these DEFERRABLE INITIALLY DEFERRED
-- lets a bulk-load transaction insert rows in any order and check FKs at COMMIT instead —
-- no behavior change for normal app writes, which already commit per-request.

ALTER TABLE categories
  ALTER CONSTRAINT categories_parent_id_fkey DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE nav_items
  ALTER CONSTRAINT nav_items_parent_id_fkey DEFERRABLE INITIALLY DEFERRED;
