-- Add eshop_admin to the role enum before touching the profiles table.
-- Cannot use IF NOT EXISTS on ALTER TYPE ADD VALUE in older PG; guard via catalog query.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'eshop_admin'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
  ) THEN
    ALTER TYPE app_role ADD VALUE 'eshop_admin';
  END IF;
END;
$$;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS full_name      TEXT,
  ADD COLUMN IF NOT EXISTS email          TEXT,
  ADD COLUMN IF NOT EXISTS phone          TEXT,
  ADD COLUMN IF NOT EXISTS google_id      TEXT,
  ADD COLUMN IF NOT EXISTS is_active      BOOLEAN     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_login_at  TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Overwrite handle_new_user to populate all available metadata on signup.
-- COALESCE ensures user-customized values are never overwritten on re-insert.
-- NULLIFs strip empty strings that OAuth providers sometimes send.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name     TEXT;
  v_display_name  TEXT;
  v_avatar_url    TEXT;
  v_google_id     TEXT;
BEGIN
  v_full_name    := NULLIF(TRIM(
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name'
    )
  ), '');
  v_display_name := NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), '');
  v_avatar_url   := NULLIF(TRIM(NEW.raw_user_meta_data->>'avatar_url'), '');
  -- provider_id is set by Google OAuth; used to detect Google-linked accounts.
  v_google_id    := CASE
    WHEN NEW.raw_app_meta_data->>'provider' = 'google'
    THEN NEW.raw_user_meta_data->>'sub'
    ELSE NULL
  END;

  INSERT INTO public.profiles (id, full_name, display_name, avatar_url, email, google_id)
  VALUES (
    NEW.id,
    v_full_name,
    COALESCE(v_display_name, v_full_name),
    v_avatar_url,
    NULLIF(TRIM(NEW.email), ''),
    v_google_id
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name    = COALESCE(profiles.full_name,    EXCLUDED.full_name),
    display_name = COALESCE(profiles.display_name, EXCLUDED.display_name),
    avatar_url   = COALESCE(profiles.avatar_url,   EXCLUDED.avatar_url),
    email        = COALESCE(profiles.email,         EXCLUDED.email),
    google_id    = COALESCE(profiles.google_id,     EXCLUDED.google_id);

  RETURN NEW;
END;
$$;
