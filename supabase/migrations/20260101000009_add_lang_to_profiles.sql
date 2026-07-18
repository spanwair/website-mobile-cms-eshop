ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS lang VARCHAR(2) NOT NULL DEFAULT 'cs'
    CHECK (lang IN ('cs', 'en'));
