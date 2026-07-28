-- get_product_activity_log() used to bake pre-formatted English sentences ("Order X: a → b",
-- "Purchase · iPhone 13 · 4 units", fallback actor names "System"/"Customer") directly into a
-- `description` TEXT column. That hardcodes UI copy inside Postgres, bypassing shared/i18n
-- entirely — the website has no way to render it in Czech. Replace `description` with the raw
-- structured fields the website layer needs, and let ProductActivityFeed.astro build the
-- localized sentence via shared/i18n/locales/{en,cs}.ts.

DROP FUNCTION IF EXISTS get_product_activity_log(UUID, INT);

CREATE OR REPLACE FUNCTION get_product_activity_log(p_party_id UUID, p_limit INT DEFAULT 40)
RETURNS TABLE (
  event_time     TIMESTAMPTZ,
  event_type     TEXT,
  entity_number  TEXT,
  from_status    TEXT,
  to_status      TEXT,
  note           TEXT,
  product_title  TEXT,
  quantity       INT,
  refund_amount  NUMERIC,
  refund_method  TEXT,
  reason         TEXT,
  actor_name     TEXT,
  actor_id       UUID
) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (is_owner() OR is_admin_of(p_party_id) OR user_has_permission(auth.uid(), p_party_id, 8)) THEN
    RAISE EXCEPTION 'insufficient_permission' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT * FROM (
  SELECT
    h.created_at AS event_time,
    'order_status'::TEXT AS event_type,
    o.order_number AS entity_number,
    h.from_status AS from_status,
    h.to_status AS to_status,
    h.note AS note,
    NULL::TEXT AS product_title,
    NULL::INT AS quantity,
    NULL::NUMERIC AS refund_amount,
    NULL::TEXT AS refund_method,
    NULL::TEXT AS reason,
    COALESCE(pr.display_name, pr.full_name, pr.email) AS actor_name,
    h.changed_by AS actor_id
  FROM order_status_history h
  JOIN orders o ON o.id = h.order_id
  LEFT JOIN profiles pr ON pr.id = h.changed_by
  WHERE o.party_id = p_party_id

  UNION ALL

  SELECT
    rr.completed_at,
    'return_completed'::TEXT,
    rr.return_number,
    NULL::TEXT,
    NULL::TEXT,
    NULL::TEXT,
    NULL::TEXT,
    NULL::INT,
    rr.refund_amount,
    rr.refund_method,
    NULL::TEXT,
    COALESCE(pr.display_name, pr.full_name, pr.email),
    rr.processed_by
  FROM return_requests rr
  LEFT JOIN profiles pr ON pr.id = rr.processed_by
  WHERE rr.party_id = p_party_id AND rr.status = 'completed' AND rr.completed_at IS NOT NULL

  UNION ALL

  SELECT
    rr.created_at,
    'return_requested'::TEXT,
    rr.return_number,
    NULL::TEXT,
    NULL::TEXT,
    NULL::TEXT,
    NULL::TEXT,
    NULL::INT,
    NULL::NUMERIC,
    NULL::TEXT,
    rr.reason,
    cu.first_name || ' ' || cu.last_name,
    NULL::UUID
  FROM return_requests rr
  LEFT JOIN customers cu ON cu.id = rr.customer_id
  WHERE rr.party_id = p_party_id

  UNION ALL

  SELECT
    sm.created_at,
    'stock_' || sm.type,
    NULL::TEXT,
    NULL::TEXT,
    NULL::TEXT,
    sm.note,
    p.title,
    sm.quantity,
    NULL::NUMERIC,
    NULL::TEXT,
    NULL::TEXT,
    COALESCE(pr.display_name, pr.full_name, pr.email),
    sm.created_by
  FROM stock_movements sm
  JOIN inventory_items ii ON ii.id = sm.inventory_item_id
  JOIN products p ON p.id = ii.product_id
  LEFT JOIN profiles pr ON pr.id = sm.created_by
  WHERE sm.party_id = p_party_id
  ) combined
  ORDER BY event_time DESC NULLS LAST
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_product_activity_log(UUID, INT) TO authenticated;
