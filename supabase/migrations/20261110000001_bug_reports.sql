-- Admin-panel "Report a bug" widget: any admin-capable user (eshop_admin/admin/owner) can file
-- a report with an optional description, screenshot, and screen recording captured entirely via
-- browser APIs (getDisplayMedia/MediaRecorder) — no local tooling involved. Reports (and the
-- media they reference) are only ever readable by the platform owner, mirroring the existing
-- owner-only precedent for platform-wide, non-party-scoped admin surfaces (e.g. shipping config).

CREATE TABLE IF NOT EXISTS bug_reports (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_email  TEXT        NOT NULL,
  party_id        UUID        REFERENCES parties(id) ON DELETE SET NULL,
  page_url        TEXT        NOT NULL,
  description     TEXT,
  screenshot_path TEXT,
  video_path      TEXT,
  user_agent      TEXT,
  status          TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bug_reports_created ON bug_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status   ON bug_reports(status);

ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- Any admin-capable user may file a report about themselves — can_access_admin() already
-- gates the widget's own page access, this mirrors that at the DB layer.
CREATE POLICY "Admin users can file bug reports"
  ON bug_reports FOR INSERT
  TO authenticated
  WITH CHECK (can_access_admin() AND reporter_id = auth.uid());

-- Owner-only visibility — bug reports/screenshots can contain sensitive org data from any
-- party, so no party-scoped admin or eshop_admin may read them, regardless of permission bits.
CREATE POLICY "Owner reads bug reports"
  ON bug_reports FOR SELECT
  TO authenticated
  USING (is_owner());

CREATE POLICY "Owner updates bug reports"
  ON bug_reports FOR UPDATE
  TO authenticated
  USING (is_owner())
  WITH CHECK (is_owner());

GRANT SELECT, INSERT, UPDATE ON bug_reports TO authenticated;

-- Private bucket (public = false): screenshots/videos are only ever fetched via signed URLs
-- generated for the owner, never a public getPublicUrl() link.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bug-reports',
  'bug-reports',
  false,
  52428800,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'video/webm', 'video/mp4']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admin users upload bug report media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'bug-reports' AND can_access_admin());

CREATE POLICY "Owner reads bug report media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'bug-reports' AND is_owner());
