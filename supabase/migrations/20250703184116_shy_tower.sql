/*
  # Add transaction audit logging

  1. New Tables
    - `transaction_audit_logs`
      - `id` (uuid, primary key)
      - `transaction_id` (uuid, references transactions)
      - `user_id` (uuid, references organization_users)
      - `organization_id` (uuid, references organizations)
      - `action` (text)
      - `description` (text)
      - `details` (jsonb)
      - `created_at` (timestamp with time zone)
  2. Security
    - Enable RLS on `transaction_audit_logs` table
    - Add policy for organizations to read their own transaction logs
*/

-- Transaction Audit Logs Table
CREATE TABLE IF NOT EXISTS transaction_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id text NOT NULL,
  user_id uuid REFERENCES organization_users(id),
  organization_id uuid REFERENCES organizations(id),
  action text NOT NULL,
  description text NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE transaction_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transaction_audit_logs
CREATE POLICY "Organizations can read their own transaction logs"
  ON transaction_audit_logs
  FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_users
    WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

-- Create index for faster querying
CREATE INDEX transaction_audit_logs_transaction_id_idx ON transaction_audit_logs(transaction_id);

-- Create function to easily log transaction audit events
CREATE OR REPLACE FUNCTION log_transaction_audit(
  p_transaction_id text,
  p_user_id uuid,
  p_organization_id uuid,
  p_action text,
  p_description text,
  p_details jsonb DEFAULT '{}'
) RETURNS uuid AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO transaction_audit_logs (
    transaction_id,
    user_id,
    organization_id,
    action,
    description,
    details,
    created_at
  ) VALUES (
    p_transaction_id,
    p_user_id,
    p_organization_id,
    p_action,
    p_description,
    p_details,
    now()
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;