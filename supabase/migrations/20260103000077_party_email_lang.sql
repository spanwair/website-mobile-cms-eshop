-- Language a party's e-shop communicates in: source of truth for any email tied to the
-- organization itself rather than to a specific customer (monthly platform fee notice,
-- payout-limit-reached notice) — those previously had no language signal to read and fell
-- back to hardcoded Czech.
ALTER TABLE parties
  ADD COLUMN lang TEXT NOT NULL DEFAULT 'cs'
  CONSTRAINT parties_lang_check CHECK (lang IN ('cs', 'en'));
