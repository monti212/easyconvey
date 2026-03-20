-- Track real-time client activity through share links
CREATE TABLE IF NOT EXISTS case_link_activity (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  token       TEXT        NOT NULL,
  case_id     uuid        REFERENCES cases(id) ON DELETE CASCADE,
  role        TEXT        NOT NULL CHECK (role IN ('buyer', 'seller')),
  event_type  TEXT        NOT NULL,  -- 'link_opened' | 'step_viewed' | 'step_completed' | 'submitted'
  step_number INTEGER,
  step_name   TEXT,
  duration_seconds INTEGER,         -- seconds spent on this step
  metadata    JSONB       DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE case_link_activity ENABLE ROW LEVEL SECURITY;

-- Anonymous clients can insert their own activity events
CREATE POLICY "anon_insert_activity" ON case_link_activity
  FOR INSERT TO anon WITH CHECK (true);

-- Authenticated conveyancers can read activity for their org's cases
CREATE POLICY "auth_select_activity" ON case_link_activity
  FOR SELECT TO authenticated
  USING (case_id IN (
    SELECT id FROM cases WHERE organization_id IN (
      SELECT organization_id FROM organization_users WHERE auth_user_id = auth.uid()
    )
  ));

CREATE INDEX IF NOT EXISTS case_link_activity_token_idx   ON case_link_activity(token);
CREATE INDEX IF NOT EXISTS case_link_activity_case_id_idx ON case_link_activity(case_id);
CREATE INDEX IF NOT EXISTS case_link_activity_created_idx ON case_link_activity(created_at DESC);
