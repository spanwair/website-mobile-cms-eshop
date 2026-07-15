CREATE TABLE IF NOT EXISTS audit_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  action       TEXT        NOT NULL,
  table_name   TEXT        NOT NULL,
  record_id    UUID,
  party_id     UUID        REFERENCES parties(id) ON DELETE SET NULL,
  user_id      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address   INET,
  device_info  TEXT,
  old_value    JSONB,
  new_value    JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Composite indexes chosen for the two dominant access patterns: party timeline and user timeline.
CREATE INDEX IF NOT EXISTS idx_audit_party_time  ON audit_logs(party_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user_time   ON audit_logs(user_id,  created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_record      ON audit_logs(table_name, record_id);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- No UPDATE/DELETE policies — rows are append-only by design.
-- MANAGE_SETTINGS (4096) gates audit log visibility; ops-level permission avoids exposing
-- sensitive history to lower-privileged party members.
CREATE POLICY "Party settings admins can read audit logs"
  ON audit_logs FOR SELECT
  USING (
    party_id IS NOT NULL
    AND user_has_permission(auth.uid(), party_id, 4096)
  );

-- Only the audit_log() function (SECURITY DEFINER) may insert rows.
-- Direct INSERT from authenticated users is intentionally blocked.
CREATE POLICY "Service role inserts audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (false);

-- Convenience function for application code to emit audit events.
-- ip_address falls back to NULL if the header is missing rather than failing silently.
CREATE OR REPLACE FUNCTION audit_log(
  p_action      TEXT,
  p_table_name  TEXT,
  p_record_id   UUID,
  p_party_id    UUID,
  p_old_val     JSONB DEFAULT NULL,
  p_new_val     JSONB DEFAULT NULL
)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ip        INET;
  v_device    TEXT;
  v_headers   JSONB;
BEGIN
  BEGIN
    v_headers := current_setting('request.headers', true)::JSONB;
    v_ip      := (v_headers->>'x-forwarded-for')::INET;
    v_device  := v_headers->>'user-agent';
  EXCEPTION WHEN OTHERS THEN
    v_ip     := NULL;
    v_device := NULL;
  END;

  INSERT INTO public.audit_logs
    (action, table_name, record_id, party_id, user_id, ip_address, device_info, old_value, new_value)
  VALUES
    (p_action, p_table_name, p_record_id, p_party_id, auth.uid(), v_ip, v_device, p_old_val, p_new_val);
END;
$$;

GRANT SELECT ON audit_logs TO authenticated;
-- INSERT granted only to allow the SECURITY DEFINER function to bypass RLS restriction.
GRANT INSERT ON audit_logs TO authenticated;
