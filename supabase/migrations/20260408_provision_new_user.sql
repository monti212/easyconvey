-- SECURITY DEFINER function called via supabase.rpc() immediately after
-- auth.signUp(). Runs with elevated privileges so it works even when the
-- user's email hasn't been confirmed yet (no session established).

CREATE OR REPLACE FUNCTION provision_new_user(
  p_auth_user_id uuid,
  p_email        text,
  p_first_name   text,
  p_last_name    text,
  p_org_name     text,
  p_org_type     text,
  p_role         text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  -- Bail out if the auth user is already linked to an org (idempotent)
  IF EXISTS (
    SELECT 1 FROM organization_users
    WHERE auth_user_id = p_auth_user_id
  ) THEN
    RETURN json_build_object('success', true, 'already_exists', true);
  END IF;

  -- Create organisation
  INSERT INTO organizations (name, type)
  VALUES (p_org_name, p_org_type)
  RETURNING id INTO v_org_id;

  -- Create membership, linking the auth user immediately
  INSERT INTO organization_users
    (organization_id, email, first_name, last_name, role, is_active, auth_user_id)
  VALUES
    (v_org_id, p_email, p_first_name, p_last_name, p_role, true, p_auth_user_id);

  RETURN json_build_object('success', true, 'org_id', v_org_id);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Allow unauthenticated callers so it works before email confirmation
GRANT EXECUTE ON FUNCTION provision_new_user TO anon, authenticated;
