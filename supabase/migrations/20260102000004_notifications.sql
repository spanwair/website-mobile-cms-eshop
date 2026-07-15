CREATE TYPE notification_type AS ENUM (
  'low_inventory',
  'new_order',
  'failed_payment',
  'new_registration',
  'system_alert',
  'role_invitation'
);

CREATE TABLE IF NOT EXISTS notifications (
  id          UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id    UUID              REFERENCES parties(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  title       TEXT,
  body        TEXT,
  metadata    JSONB             NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_party ON notifications(party_id, created_at DESC);

CREATE TABLE IF NOT EXISTS user_notifications (
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id  UUID        NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  read_at          TIMESTAMPTZ,
  PRIMARY KEY (user_id, notification_id)
);

-- Partial index for efficient unread-count queries per user.
CREATE INDEX IF NOT EXISTS idx_user_notif_unread
  ON user_notifications(user_id, read_at)
  WHERE read_at IS NULL;

ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Users read notifications delivered to them via user_notifications join.
CREATE POLICY "Users read own notifications"
  ON notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_notifications
      WHERE user_id = auth.uid()
        AND notification_id = notifications.id
    )
  );

-- MANAGE_USERS (2) is the minimum party role that can broadcast notifications.
CREATE POLICY "Party admins create notifications"
  ON notifications FOR INSERT
  WITH CHECK (
    party_id IS NOT NULL
    AND user_has_permission(auth.uid(), party_id, 2)
  );

CREATE POLICY "Users read own user_notifications"
  ON user_notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users update own user_notifications"
  ON user_notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Party admins fan out a notification to specific users.
CREATE POLICY "Party admins insert user_notifications"
  ON user_notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.id = notification_id
        AND user_has_permission(auth.uid(), n.party_id, 2)
    )
  );

GRANT SELECT ON notifications      TO authenticated;
GRANT INSERT ON notifications      TO authenticated;
GRANT SELECT ON user_notifications TO authenticated;
GRANT INSERT, UPDATE ON user_notifications TO authenticated;
