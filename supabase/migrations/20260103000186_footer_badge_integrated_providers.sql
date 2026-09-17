-- Restrict shipping/payment footer badges to the providers that are actually integrated and
-- administered through the platform (PPL, Zásilkovna, card payment via Stripe). Admins used to
-- type arbitrary carriers/payment methods (GLS, Home Credit splátky, ...), advertising options
-- the platform can't fulfil. Now those two kinds are a fixed, platform-managed set seeded into
-- every org; social/store_feature badges stay free-form.
--
-- provider_key ties a badge row to a known integrated provider (NULL for free-form badges).

ALTER TABLE footer_badges ADD COLUMN IF NOT EXISTS provider_key TEXT;

-- At most one row per provider per party — the toggle model relies on this identity.
CREATE UNIQUE INDEX IF NOT EXISTS idx_footer_badges_party_provider
  ON footer_badges(party_id, provider_key)
  WHERE provider_key IS NOT NULL;

-- Wipe every existing shipping/payment badge (all free-form, off-list) and reseed the canonical
-- integrated set below. social/store_feature rows are untouched.
DELETE FROM footer_badges WHERE kind IN ('shipping', 'payment');

-- The integrated providers, as a reusable VALUES set.
CREATE OR REPLACE FUNCTION seed_integrated_footer_badges(target_party UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.footer_badges (party_id, kind, provider_key, label, icon, sort_order)
  VALUES
    (target_party, 'shipping', 'ppl',        'PPL',           '🚚', 1),
    (target_party, 'shipping', 'zasilkovna',  'Zásilkovna',    '📦', 2),
    (target_party, 'payment',  'stripe',      'Platba kartou', '💳', 1)
  ON CONFLICT (party_id, provider_key) WHERE provider_key IS NOT NULL DO NOTHING;
END;
$$;

-- Every new party gets the integrated set, mirroring create_default_store_config.
CREATE OR REPLACE FUNCTION seed_default_footer_badges()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM seed_integrated_footer_badges(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_party_created_seed_footer_badges ON parties;
CREATE TRIGGER on_party_created_seed_footer_badges
  AFTER INSERT ON parties
  FOR EACH ROW EXECUTE FUNCTION seed_default_footer_badges();

-- Backfill every existing party.
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN SELECT id FROM parties LOOP
    PERFORM seed_integrated_footer_badges(p.id);
  END LOOP;
END $$;
