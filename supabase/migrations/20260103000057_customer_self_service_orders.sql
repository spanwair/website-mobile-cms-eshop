-- customers/orders/order_items had no self-service SELECT policy — only staff
-- (MANAGE_CUSTOMERS/MANAGE_ORDERS) could read them. That silently breaks any
-- feature needing a signed-in shopper to read their own purchase history,
-- e.g. review verified-purchase detection (resolveReviewIdentity).
-- Mirrors the existing "Customers read own returns" idiom in returns.sql.

CREATE POLICY "Customers read own record"
  ON customers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Customers read own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid()));

CREATE POLICY "Customers read own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders WHERE customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    )
  );
