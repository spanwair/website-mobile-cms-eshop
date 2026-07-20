-- Fix "Members read product_images" RLS policy so it only applies to authenticated users.
-- The anon role cannot SELECT from user_party_roles, causing the policy's USING clause
-- to throw "permission denied" even when the "Public read product_images" policy
-- (TO anon,authenticated USING true) would otherwise allow access.
-- Restricting this policy to authenticated-only fixes the conflict.

DROP POLICY IF EXISTS "Members read product_images" ON public.product_images;

CREATE POLICY "Members read product_images"
  ON public.product_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM products p
      JOIN user_party_roles upr ON upr.party_id = p.party_id
      WHERE p.id = product_images.product_id
        AND upr.user_id = auth.uid()
    )
  );
