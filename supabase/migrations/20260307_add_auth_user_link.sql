-- Link organization_users to Supabase Auth
ALTER TABLE organization_users ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_org_users_auth_id ON organization_users(auth_user_id);

-- Allow authenticated users to read organizations (needed for login flow)
CREATE POLICY "Authenticated users can read organizations"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to read their own org_user records
CREATE POLICY "Users can read own org_user records by auth_id"
  ON organization_users
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Allow service role to insert org_user records (for signup flow)
CREATE POLICY "Service can insert org_user records"
  ON organization_users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

-- Allow users to update their own last_login_at
CREATE POLICY "Users can update own last_login"
  ON organization_users
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());
