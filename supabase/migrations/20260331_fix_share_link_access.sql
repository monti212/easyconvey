-- Fix: Share links return "invalid" because getCaseByToken joins
-- case_share_tokens → cases → organizations, but cases and organizations
-- have RLS policies that only allow authenticated access.
--
-- Solution: A SECURITY DEFINER function that bypasses RLS to look up
-- case data via a valid share token, so anonymous users can open share links.

CREATE OR REPLACE FUNCTION get_case_by_share_token(p_token TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_token case_share_tokens%ROWTYPE;
  v_case cases%ROWTYPE;
  v_org_name TEXT;
BEGIN
  -- Look up the token
  SELECT * INTO v_token FROM case_share_tokens WHERE token = p_token;
  IF NOT FOUND THEN RETURN NULL; END IF;

  -- Look up the case
  SELECT * INTO v_case FROM cases WHERE id = v_token.case_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  -- Look up the organization name
  SELECT name INTO v_org_name FROM organizations WHERE id = v_case.organization_id;

  RETURN jsonb_build_object(
    'token_id', v_token.id,
    'role', v_token.role,
    'expired', (v_token.expires_at < now()),
    'used', (v_token.used_at IS NOT NULL),
    'case', jsonb_build_object(
      'id', v_case.id,
      'case_number', v_case.case_number,
      'case_type', v_case.case_type,
      'client_name', v_case.client_name,
      'status', v_case.status,
      'organization', jsonb_build_object(
        'name', v_org_name
      )
    )
  );
END;
$$;

-- Grant anon access to the function
GRANT EXECUTE ON FUNCTION get_case_by_share_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_case_by_share_token(TEXT) TO authenticated;
