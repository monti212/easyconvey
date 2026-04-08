-- Store AI-generated conveyancing documents so users can leave and return
CREATE TABLE IF NOT EXISTS generated_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES cases(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  document_name text NOT NULL,
  content text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (case_id, document_type)
);

-- Index for fast lookup by case
CREATE INDEX IF NOT EXISTS idx_generated_documents_case_id ON generated_documents(case_id);

-- RLS
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;

-- Conveyancers can read/write their org's case documents
CREATE POLICY "org_members_manage_generated_docs" ON generated_documents
  FOR ALL
  USING (
    case_id IN (
      SELECT c.id FROM cases c
      JOIN organization_users ou ON ou.organization_id = c.organization_id
      WHERE ou.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    case_id IN (
      SELECT c.id FROM cases c
      JOIN organization_users ou ON ou.organization_id = c.organization_id
      WHERE ou.auth_user_id = auth.uid()
    )
  );
