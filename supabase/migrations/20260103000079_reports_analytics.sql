-- Analytics RPCs powering the /admin/reports KPI-card charts. SECURITY INVOKER: they run
-- under the caller's RLS, so the reports page can call them with the viewer's own session
-- client (not the service-role client) and only ever see their own party's rows.

CREATE OR REPLACE FUNCTION report_monthly_series(p_party_id uuid, p_months int DEFAULT 12)
RETURNS TABLE (month date, revenue numeric, orders bigint)
LANGUAGE sql STABLE
SET search_path = public
AS $$
  WITH months AS (
    SELECT (date_trunc('month', now() AT TIME ZONE 'utc')::date - (interval '1 month' * gs))::date AS month
    FROM generate_series(0, GREATEST(p_months, 1) - 1) gs
  )
  SELECT m.month,
         COALESCE(SUM(o.total_amount) FILTER (WHERE o.payment_status = 'paid'), 0)::numeric AS revenue,
         COUNT(o.id) AS orders
  FROM months m
  LEFT JOIN orders o
    ON o.party_id = p_party_id
   AND date_trunc('month', o.created_at)::date = m.month
  GROUP BY m.month
  ORDER BY m.month;
$$;

CREATE OR REPLACE FUNCTION report_top_products(p_party_id uuid, p_months int DEFAULT 12, p_limit int DEFAULT 5)
RETURNS TABLE (product_id uuid, title text, units bigint, revenue numeric)
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT oi.product_id,
         MAX(COALESCE(p.title, oi.title)) AS title,
         SUM(oi.quantity)::bigint AS units,
         SUM(oi.total_price)::numeric AS revenue
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  LEFT JOIN products p ON p.id = oi.product_id
  WHERE o.party_id = p_party_id
    AND o.payment_status = 'paid'
    AND o.created_at >= date_trunc('month', now() AT TIME ZONE 'utc') - (interval '1 month' * (GREATEST(p_months, 1) - 1))
  GROUP BY oi.product_id
  ORDER BY units DESC
  LIMIT GREATEST(p_limit, 1);
$$;

GRANT EXECUTE ON FUNCTION report_monthly_series(uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION report_top_products(uuid, int, int) TO authenticated;
