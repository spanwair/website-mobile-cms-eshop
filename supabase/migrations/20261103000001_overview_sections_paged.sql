-- Dashboard overview sections (top products, activity log, recent orders) became interactive:
-- every row links to its product/order/return, each section filters by a time range
-- (1 day / 7 days / 1 month / all), and a "show all" modal paginates the full set.
--
-- Two things were missing at the data layer:
--   1. A paginated, date-filtered top-products query. The old top_products CTE inside
--      get_product_overview_stats() was hardcoded to LIMIT 5 and all-time, with no total count.
--   2. The activity log returned no entity ids, so rows could not link anywhere, and it had no
--      date filter / offset / total count for pagination.

-- 1. Paginated, date-filtered best-selling products.
CREATE OR REPLACE FUNCTION get_top_products_paged(
  p_party_id UUID,
  p_from     TIMESTAMPTZ DEFAULT NULL,
  p_limit    INT DEFAULT 10,
  p_offset   INT DEFAULT 0
) RETURNS TABLE (
  id          UUID,
  title       TEXT,
  qty_sold    BIGINT,
  revenue     NUMERIC,
  profit      NUMERIC,
  total_count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (is_owner() OR is_admin_of(p_party_id) OR user_has_permission(auth.uid(), p_party_id, 8)) THEN
    RAISE EXCEPTION 'insufficient_permission' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH agg AS (
    SELECT
      p.id, p.title,
      SUM(oi.quantity)                                       AS qty_sold,
      SUM(oi.total_price)                                    AS revenue,
      SUM(oi.total_price) - SUM(oi.quantity * p.cost_price)  AS profit
    FROM order_items oi
    JOIN orders o   ON o.id = oi.order_id
    JOIN products p ON p.id = oi.product_id
    WHERE o.party_id = p_party_id
      AND o.status <> 'cancelled'
      AND (p_from IS NULL OR o.created_at >= p_from)
    GROUP BY p.id, p.title
  )
  SELECT a.id, a.title, a.qty_sold, a.revenue, a.profit, COUNT(*) OVER() AS total_count
  FROM agg a
  ORDER BY a.revenue DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION get_top_products_paged(UUID, TIMESTAMPTZ, INT, INT) TO authenticated;

-- 2. Activity log: add entity ids (order_id / return_id / product_id) so each row can link to its
-- detail page, plus date-range filter, offset, and a window total_count for pagination.
DROP FUNCTION IF EXISTS get_product_activity_log(UUID, INT);

CREATE OR REPLACE FUNCTION get_product_activity_log(
  p_party_id UUID,
  p_limit    INT DEFAULT 40,
  p_from     TIMESTAMPTZ DEFAULT NULL,
  p_offset   INT DEFAULT 0
)
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
  actor_id       UUID,
  order_id       UUID,
  return_id      UUID,
  product_id     UUID,
  total_count    BIGINT
) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (is_owner() OR is_admin_of(p_party_id) OR user_has_permission(auth.uid(), p_party_id, 8)) THEN
    RAISE EXCEPTION 'insufficient_permission' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH combined AS (
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
      h.changed_by AS actor_id,
      o.id AS order_id,
      NULL::UUID AS return_id,
      NULL::UUID AS product_id
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
      rr.processed_by,
      NULL::UUID,
      rr.id,
      NULL::UUID
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
      NULL::UUID,
      NULL::UUID,
      rr.id,
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
      sm.created_by,
      NULL::UUID,
      NULL::UUID,
      p.id
    FROM stock_movements sm
    JOIN inventory_items ii ON ii.id = sm.inventory_item_id
    JOIN products p ON p.id = ii.product_id
    LEFT JOIN profiles pr ON pr.id = sm.created_by
    WHERE sm.party_id = p_party_id
  ),
  filtered AS (
    SELECT * FROM combined
    WHERE (p_from IS NULL OR combined.event_time >= p_from)
  )
  SELECT f.*, COUNT(*) OVER() AS total_count
  FROM filtered f
  ORDER BY f.event_time DESC NULLS LAST
  LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION get_product_activity_log(UUID, INT, TIMESTAMPTZ, INT) TO authenticated;
