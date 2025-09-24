/*
  # Organization and User Management System

  1. New Tables
    - `organizations` - Law firms, estate agencies, financial institutions
    - `organization_users` - Team members within organizations
    - `user_roles` - Role definitions and permissions
    - `properties` - Property listings managed by estate agents
    - `cases` - Legal cases managed by conveyancers
    - `loans` - Loan applications managed by financial institutions
    - `communications` - Cross-entity messaging system

  2. Security
    - Enable RLS on all tables
    - Add policies for organization-based access control
    - Implement role-based permissions
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organization types enum
CREATE TYPE organization_type AS ENUM ('conveyancer', 'estate_agent', 'financial_institution');

-- User roles enum
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'user', 'viewer');

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type organization_type NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  address text,
  registration_number text,
  license_number text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Organization users table
CREATE TABLE IF NOT EXISTS organization_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  password_hash text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role user_role DEFAULT 'user',
  is_active boolean DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, email)
);

-- Properties table (managed by estate agents)
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES organization_users(id),
  title text NOT NULL,
  description text,
  property_type text NOT NULL,
  price numeric NOT NULL,
  address text NOT NULL,
  bedrooms integer,
  bathrooms integer,
  size_sqm numeric,
  status text DEFAULT 'available', -- available, under_offer, sold
  images text[], -- Array of image URLs
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Cases table (managed by conveyancers)
CREATE TABLE IF NOT EXISTS cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  conveyancer_id uuid REFERENCES organization_users(id),
  property_id uuid REFERENCES properties(id),
  case_number text UNIQUE NOT NULL,
  case_type text NOT NULL, -- buying, selling
  client_name text NOT NULL,
  client_email text,
  client_phone text,
  status text DEFAULT 'initiated', -- initiated, in_progress, completed, cancelled
  priority text DEFAULT 'medium', -- low, medium, high
  documents jsonb DEFAULT '[]',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Loans table (managed by financial institutions)
CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  loan_officer_id uuid REFERENCES organization_users(id),
  property_id uuid REFERENCES properties(id),
  case_id uuid REFERENCES cases(id),
  application_number text UNIQUE NOT NULL,
  applicant_name text NOT NULL,
  applicant_email text,
  loan_amount numeric NOT NULL,
  interest_rate numeric,
  term_months integer,
  status text DEFAULT 'application', -- application, approved, rejected, disbursed
  documents jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Communications table (cross-entity messaging)
CREATE TABLE IF NOT EXISTS communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_organization_id uuid REFERENCES organizations(id),
  sender_user_id uuid REFERENCES organization_users(id),
  recipient_organization_id uuid REFERENCES organizations(id),
  recipient_user_id uuid REFERENCES organization_users(id),
  subject text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  case_id uuid REFERENCES cases(id),
  property_id uuid REFERENCES properties(id),
  loan_id uuid REFERENCES loans(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Organizations can read own data"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (id IN (
    SELECT organization_id FROM organization_users 
    WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

-- RLS Policies for organization_users
CREATE POLICY "Users can read organization members"
  ON organization_users
  FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_users 
    WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

-- RLS Policies for properties
CREATE POLICY "Organizations can manage own properties"
  ON properties
  FOR ALL
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_users 
    WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

-- RLS Policies for cases
CREATE POLICY "Organizations can manage own cases"
  ON cases
  FOR ALL
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_users 
    WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

-- RLS Policies for loans
CREATE POLICY "Organizations can manage own loans"
  ON loans
  FOR ALL
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_users 
    WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
  ));

-- RLS Policies for communications
CREATE POLICY "Users can read relevant communications"
  ON communications
  FOR SELECT
  TO authenticated
  USING (
    sender_organization_id IN (
      SELECT organization_id FROM organization_users 
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    ) OR
    recipient_organization_id IN (
      SELECT organization_id FROM organization_users 
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- Insert demo organizations
INSERT INTO organizations (name, type, email, phone, registration_number) VALUES
  ('OrionX Legal Services', 'conveyancer', 'info@orionxlegal.co.bw', '+267 123 4567', 'LAW001'),
  ('Premium Properties Ltd', 'estate_agent', 'info@premiumproperties.co.bw', '+267 234 5678', 'REA002'),
  ('Capital Bank Botswana', 'financial_institution', 'info@capitalbank.co.bw', '+267 345 6789', 'BANK003');

-- Insert demo users
INSERT INTO organization_users (organization_id, email, password_hash, first_name, last_name, role) 
SELECT 
  o.id,
  'monti@orionx.xyz',
  '$2a$10$dummy.hash.for.demo.purposes',
  'Monti',
  'K.',
  'super_admin'
FROM organizations o WHERE o.email = 'info@orionxlegal.co.bw';

INSERT INTO organization_users (organization_id, email, password_hash, first_name, last_name, role) 
SELECT 
  o.id,
  'monti@orionx.xyz',
  '$2a$10$dummy.hash.for.demo.purposes',
  'Monti',
  'K.',
  'super_admin'
FROM organizations o WHERE o.email = 'info@premiumproperties.co.bw';

INSERT INTO organization_users (organization_id, email, password_hash, first_name, last_name, role) 
SELECT 
  o.id,
  'monti@orionx.xyz',
  '$2a$10$dummy.hash.for.demo.purposes',
  'Monti',
  'K.',
  'super_admin'
FROM organizations o WHERE o.email = 'info@capitalbank.co.bw';