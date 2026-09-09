-- Customer overview for the /admin/reports "Přehled zákazníků" card: how many customers the
-- eshop has, how many hold a real account (user_id) vs guest checkouts, and new customers per
-- month. SECURITY INVOKER so it runs under the caller's RLS (own party only).
CREATE OR REPLACE FUNCTION report_customer_stats(p_party_id uuid, p_months int DEFAULT 12)
RETURNS jsonb
LANGUAGE sql STABLE
SET search_path = public
AS $$
  WITH base AS (
    SELECT user_id, created_at FROM customers WHERE party_id = p_party_id
  ),
  months AS (
    SELECT (date_trunc('month', now() AT TIME ZONE 'utc')::date - (interval '1 month' * gs))::date AS month
    FROM generate_series(0, GREATEST(p_months, 1) - 1) gs
  ),
  monthly AS (
    SELECT m.month,
           COUNT(b.created_at) FILTER (WHERE date_trunc('month', b.created_at)::date = m.month) AS cnt
    FROM months m LEFT JOIN base b ON true
    GROUP BY m.month
  )
  SELECT jsonb_build_object(
    'total', (SELECT COUNT(*) FROM base),
    'registered', (SELECT COUNT(*) FROM base WHERE user_id IS NOT NULL),
    'guests', (SELECT COUNT(*) FROM base WHERE user_id IS NULL),
    'monthly', (SELECT jsonb_agg(jsonb_build_object('month', month, 'count', cnt) ORDER BY month) FROM monthly)
  );
$$;

GRANT EXECUTE ON FUNCTION report_customer_stats(uuid, int) TO authenticated;
