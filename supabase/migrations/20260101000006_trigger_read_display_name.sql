-- Update handle_new_user to capture display_name from signup metadata.
-- This is the only reliable path when email confirmation is enabled:
-- the trigger fires atomically on INSERT INTO auth.users, so the profile
-- row is created with display_name before any client callback runs.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), '')
  );
  RETURN NEW;
END;
$$;
