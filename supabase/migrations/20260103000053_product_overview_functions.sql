-- Products dashboard overview spans products + orders + returns + inventory,
-- each gated by its own RLS permission bit (8/32/64). A party member holding only
-- MANAGE_PRODUCTS (8) would see empty results querying those tables directly.
-- These SECURITY DEFINER functions perform their own MANAGE_PRODUCTS check and
-- then read across domains, mirroring the get_user_permissions()/audit_log() pattern.

CREATE OR REPLACE FUNCTION get_product_overview_stats(p_party_id UUID, p_days INT DEFAULT 30)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_since  TIMESTAMPTZ := date_trunc('day', NOW()) - ((p_days - 1) || ' days')::INTERVAL;
BEGIN
  IF NOT (is_owner() OR is_admin_of(p_party_id) OR user_has_permission(auth.uid(), p_party_id, 8)) THEN
    RAISE EXCEPTION 'insufficient_permission' USING ERRCODE = '42501';
  END IF;

  WITH product_stage AS (
    SELECT
      COUNT(*) FILTER (WHERE status = 'draft')    AS draft_count,
      COUNT(*) FILTER (WHERE status = 'active')   AS active_count,
      COUNT(*) FILTER (WHERE status = 'inactive') AS inactive_count,
      COUNT(*)                                    AS total_count
    FROM products WHERE party_id = p_party_id
  ),
  -- Valued at the product's cost_price ("Nákupní cena") — what it actually costs the
  -- business to buy the item, the same field used for COGS on sold units.
  purchased AS (
    SELECT
      COALESCE(SUM(sm.quantity), 0)               AS qty,
      COALESCE(SUM(sm.quantity * p.cost_price), 0) AS cost
    FROM stock_movements sm
    JOIN inventory_items ii ON ii.id = sm.inventory_item_id
    JOIN products p ON p.id = ii.product_id
    WHERE sm.party_id = p_party_id AND sm.type = 'purchase'
  ),
  damaged AS (
    SELECT COALESCE(SUM(sm.quantity), 0) AS qty
    FROM stock_movements sm WHERE sm.party_id = p_party_id AND sm.type = 'damage'
  ),
  sold AS (
    SELECT
      COALESCE(SUM(oi.quantity), 0)                AS qty,
      COALESCE(SUM(oi.total_price), 0)              AS revenue,
      COALESCE(SUM(oi.quantity * p.cost_price), 0)  AS cogs
    FROM order_items oi
    JOIN orders o   ON o.id = oi.order_id
    JOIN products p ON p.id = oi.product_id
    WHERE o.party_id = p_party_id AND o.status <> 'cancelled'
  ),
  delivered AS (
    SELECT COALESCE(SUM(oi.quantity), 0) AS qty
    FROM order_items oi JOIN orders o ON o.id = oi.order_id
    WHERE o.party_id = p_party_id AND o.status = 'delivered'
  ),
  -- Sourced from stock_movements, not return_items: a unit counts as "refunded" whether it
  -- came back through the formal /admin/returns flow (which restocks via a 'return' movement
  -- tagged reference_type='return_request') or a plain manual stock adjustment logged as
  -- type='return' on the product page (reference_type NULL). Using return_items here would
  -- miss the manual path entirely and double-count the formal one.
  refunded_qty AS (
    SELECT COALESCE(SUM(sm.quantity), 0) AS qty
    FROM stock_movements sm
    WHERE sm.party_id = p_party_id AND sm.type = 'return'
  ),
  -- Manual returns carry no price, so their $ value is estimated at the product's current
  -- sale price. Formal returns (reference_type='return_request') are excluded here — their
  -- real refund_amount is already counted from return_requests below.
  manual_returns_value AS (
    SELECT COALESCE(SUM(sm.quantity * COALESCE(p.discount_price, p.price)), 0) AS amount
    FROM stock_movements sm
    JOIN inventory_items ii ON ii.id = sm.inventory_item_id
    JOIN products p ON p.id = ii.product_id
    WHERE sm.party_id = p_party_id AND sm.type = 'return'
      AND sm.reference_type IS DISTINCT FROM 'return_request'
  ),
  refunded_amount AS (
    SELECT
      COALESCE((SELECT SUM(rr.refund_amount) FROM return_requests rr
                WHERE rr.party_id = p_party_id AND rr.status = 'completed'), 0)
      + (SELECT amount FROM manual_returns_value) AS amount
  ),
  -- Damaged stock is a pure loss — never sold, so its cost never flows through COGS.
  -- Valued at cost_price (what it cost the business), not sale price.
  damaged_loss AS (
    SELECT COALESCE(SUM(sm.quantity * p.cost_price), 0) AS amount
    FROM stock_movements sm
    JOIN inventory_items ii ON ii.id = sm.inventory_item_id
    JOIN products p ON p.id = ii.product_id
    WHERE sm.party_id = p_party_id AND sm.type = 'damage'
  ),
  top_products AS (
    SELECT
      p.id, p.title,
      SUM(oi.quantity)                                       AS qty_sold,
      SUM(oi.total_price)                                    AS revenue,
      SUM(oi.total_price) - SUM(oi.quantity * p.cost_price)  AS profit
    FROM order_items oi
    JOIN orders o   ON o.id = oi.order_id
    JOIN products p ON p.id = oi.product_id
    WHERE o.party_id = p_party_id AND o.status <> 'cancelled'
    GROUP BY p.id, p.title
    ORDER BY revenue DESC
    LIMIT 5
  ),
  days AS (
    SELECT generate_series(v_since, date_trunc('day', NOW()), '1 day'::interval)::date AS day
  ),
  daily_orders AS (
    SELECT date_trunc('day', o.created_at)::date AS day,
           COUNT(*) AS orders_count,
           COALESCE(SUM(o.total_amount), 0) AS revenue
    FROM orders o
    WHERE o.party_id = p_party_id AND o.created_at >= v_since AND o.status <> 'cancelled'
    GROUP BY 1
  ),
  daily_refunds AS (
    SELECT day, SUM(refunds_count) AS refunds_count, SUM(refund_amount) AS refund_amount
    FROM (
      SELECT date_trunc('day', rr.completed_at)::date AS day,
             COUNT(*) AS refunds_count,
             COALESCE(SUM(rr.refund_amount), 0) AS refund_amount
      FROM return_requests rr
      WHERE rr.party_id = p_party_id AND rr.status = 'completed' AND rr.completed_at >= v_since
      GROUP BY 1

      UNION ALL

      SELECT date_trunc('day', sm.created_at)::date AS day,
             COUNT(*) AS refunds_count,
             COALESCE(SUM(sm.quantity * COALESCE(p.discount_price, p.price)), 0) AS refund_amount
      FROM stock_movements sm
      JOIN inventory_items ii ON ii.id = sm.inventory_item_id
      JOIN products p ON p.id = ii.product_id
      WHERE sm.party_id = p_party_id AND sm.type = 'return'
        AND sm.reference_type IS DISTINCT FROM 'return_request'
        AND sm.created_at >= v_since
      GROUP BY 1
    ) combined_refunds
    GROUP BY day
  ),
  timeseries AS (
    SELECT jsonb_agg(jsonb_build_object(
      'date', d.day,
      'orders', COALESCE(o.orders_count, 0),
      'revenue', COALESCE(o.revenue, 0),
      'refunds', COALESCE(r.refunds_count, 0),
      'refund_amount', COALESCE(r.refund_amount, 0)
    ) ORDER BY d.day) AS series
    FROM days d
    LEFT JOIN daily_orders  o ON o.day = d.day
    LEFT JOIN daily_refunds r ON r.day = d.day
  )
  SELECT jsonb_build_object(
    'stage_counts', jsonb_build_object(
      'draft', ps.draft_count, 'active', ps.active_count,
      'inactive', ps.inactive_count, 'total', ps.total_count
    ),
    'lifecycle', jsonb_build_object(
      'purchased_qty', pu.qty, 'sold_qty', s.qty, 'delivered_qty', dl.qty,
      'refunded_qty', rfq.qty, 'damaged_qty', dm.qty
    ),
    'financials', jsonb_build_object(
      'gross_revenue', s.revenue, 'cogs', s.cogs,
      'refunded_amount', rfa.amount,
      'damaged_loss', dmgl.amount,
      'purchase_cost', pu.cost,
      -- cogs (cost_price × units sold) is shown for reference but excluded here: purchase_cost
      -- (cost_price × units actually bought) already captures that same spend as real cash out,
      -- so subtracting both would double-count every unit that was purchased and then sold.
      'net_profit', s.revenue - rfa.amount - dmgl.amount - pu.cost
    ),
    'timeseries', COALESCE(ts.series, '[]'::jsonb),
    'top_products', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id', tp.id, 'title', tp.title, 'qty_sold', tp.qty_sold,
        'revenue', tp.revenue, 'profit', tp.profit
      )) FROM top_products tp),
      '[]'::jsonb
    )
  ) INTO v_result
  FROM product_stage ps, purchased pu, damaged dm, sold s, delivered dl,
       refunded_qty rfq, refunded_amount rfa, damaged_loss dmgl, timeseries ts;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_product_overview_stats(UUID, INT) TO authenticated;

CREATE OR REPLACE FUNCTION get_product_activity_log(p_party_id UUID, p_limit INT DEFAULT 40)
RETURNS TABLE (
  event_time  TIMESTAMPTZ,
  event_type  TEXT,
  description TEXT,
  actor_name  TEXT,
  actor_id    UUID
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
    'Order ' || o.order_number || ': ' || COALESCE(h.from_status, '—') || ' → ' || h.to_status
      || COALESCE(' (' || h.note || ')', '') AS description,
    COALESCE(pr.display_name, pr.full_name, pr.email, 'System') AS actor_name,
    h.changed_by AS actor_id
  FROM order_status_history h
  JOIN orders o ON o.id = h.order_id
  LEFT JOIN profiles pr ON pr.id = h.changed_by
  WHERE o.party_id = p_party_id

  UNION ALL

  SELECT
    rr.completed_at,
    'return_completed'::TEXT,
    'Return ' || rr.return_number || ' completed — refund ' || COALESCE(rr.refund_amount::TEXT, '0')
      || COALESCE(' via ' || rr.refund_method, ''),
    COALESCE(pr.display_name, pr.full_name, pr.email, 'System'),
    rr.processed_by
  FROM return_requests rr
  LEFT JOIN profiles pr ON pr.id = rr.processed_by
  WHERE rr.party_id = p_party_id AND rr.status = 'completed' AND rr.completed_at IS NOT NULL

  UNION ALL

  SELECT
    rr.created_at,
    'return_requested'::TEXT,
    'Return ' || rr.return_number || ' requested — ' || rr.reason,
    COALESCE(cu.first_name || ' ' || cu.last_name, 'Customer'),
    NULL::UUID
  FROM return_requests rr
  LEFT JOIN customers cu ON cu.id = rr.customer_id
  WHERE rr.party_id = p_party_id

  UNION ALL

  SELECT
    sm.created_at,
    'stock_' || sm.type,
    INITCAP(sm.type) || ' · ' || p.title || ' · ' || sm.quantity || ' units'
      || COALESCE(' — ' || sm.note, ''),
    COALESCE(pr.display_name, pr.full_name, pr.email, 'System'),
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
