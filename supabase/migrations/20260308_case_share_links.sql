-- Add buyer/seller data columns to cases
ALTER TABLE cases ADD COLUMN IF NOT EXISTS buyer_data JSONB DEFAULT NULL;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS seller_data JSONB DEFAULT NULL;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS buyer_status TEXT DEFAULT 'pending';
ALTER TABLE cases ADD COLUMN IF NOT EXISTS seller_status TEXT DEFAULT 'pending';

-- Share tokens table
CREATE TABLE IF NOT EXISTS case_share_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('buyer', 'seller')),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE case_share_tokens ENABLE ROW LEVEL SECURITY;

-- Anon can look up tokens (to validate share links)
CREATE POLICY "anon_select_tokens" ON case_share_tokens
  FOR SELECT TO anon USING (true);

-- Authenticated users manage tokens for their org's cases
CREATE POLICY "auth_all_tokens" ON case_share_tokens
  FOR ALL TO authenticated
  USING (case_id IN (SELECT id FROM cases WHERE organization_id IN (
    SELECT organization_id FROM organization_users WHERE auth_user_id = auth.uid()
  )));

-- RPC for unauthenticated party data submission
CREATE OR REPLACE FUNCTION submit_party_data(p_token TEXT, p_data JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_token case_share_tokens%ROWTYPE;
BEGIN
  SELECT * INTO v_token FROM case_share_tokens WHERE token = p_token;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Invalid token'); END IF;
  IF v_token.expires_at < now() THEN RETURN jsonb_build_object('error', 'Token expired'); END IF;
  IF v_token.used_at IS NOT NULL THEN RETURN jsonb_build_object('error', 'Token already used'); END IF;

  IF v_token.role = 'buyer' THEN
    UPDATE cases SET buyer_data = p_data, buyer_status = 'completed', updated_at = now() WHERE id = v_token.case_id;
  ELSE
    UPDATE cases SET seller_data = p_data, seller_status = 'completed', updated_at = now() WHERE id = v_token.case_id;
  END IF;

  UPDATE case_share_tokens SET used_at = now() WHERE id = v_token.id;
  RETURN jsonb_build_object('success', true, 'case_id', v_token.case_id);
END;
$$;

-- Grant anon access to the RPC
GRANT EXECUTE ON FUNCTION submit_party_data(TEXT, JSONB) TO anon;
