-- `INSERT ... ON CONFLICT DO UPDATE` requires SELECT privilege on the table (Postgres needs to
-- read the conflicting row to evaluate the UPDATE), which anon intentionally doesn't have on
-- newsletter_subscribers (it holds emails — a SELECT grant would let anon enumerate the list).
-- Route the upsert through a SECURITY DEFINER function instead, same pattern as
-- resolve_active_party_id_by_slug / party_is_active.

CREATE OR REPLACE FUNCTION subscribe_to_newsletter(p_party_id UUID, p_email TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT party_is_active(p_party_id) THEN
    RAISE EXCEPTION 'Unknown or inactive store';
  END IF;
  INSERT INTO newsletter_subscribers (party_id, email, unsubscribed_at)
  VALUES (p_party_id, lower(trim(p_email)), NULL)
  ON CONFLICT (party_id, email) DO UPDATE SET unsubscribed_at = NULL, subscribed_at = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION subscribe_to_newsletter(UUID, TEXT) TO anon, authenticated;

-- The direct INSERT/UPDATE grants are no longer the write path (the function is, running as
-- its owner) — revoke them so anon has no residual direct table access.
REVOKE INSERT, UPDATE ON newsletter_subscribers FROM anon;
DROP POLICY IF EXISTS "Anon can subscribe to newsletter" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Anon can resubscribe" ON newsletter_subscribers;
