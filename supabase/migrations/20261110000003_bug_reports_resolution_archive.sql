-- Extends bug_reports with an archive flag (independent of status - open or resolved cases can
-- both be archived) and a resolution note, captured via a modal when a report is marked
-- resolved and emailed back to the reporter so they know the case is handled.

ALTER TABLE bug_reports
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS resolution_note TEXT,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_bug_reports_archived ON bug_reports(archived);
