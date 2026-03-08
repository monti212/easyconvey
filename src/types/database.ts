// Database type definitions
export interface Organization {
  id: string;
  name: string;
  type: 'conveyancer' | 'estate_agent' | 'financial_institution';
  email: string;
  phone?: string;
  address?: string;
  registration_number?: string;
  license_number?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationUser {
  id: string;
  organization_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'super_admin' | 'admin' | 'user' | 'viewer';
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  organization?: Organization;
}

export interface Property {
  id: string;
  organization_id: string;
  agent_id?: string;
  title: string;
  description?: string;
  property_type: string;
  price: number;
  address: string;
  bedrooms?: number;
  bathrooms?: number;
  size_sqm?: number;
  status: 'available' | 'under_offer' | 'sold';
  images?: string[];
  created_at: string;
  updated_at: string;
  agent?: OrganizationUser;
  organization?: Organization;
}

export interface Case {
  id: string;
  organization_id: string;
  conveyancer_id?: string;
  property_id?: string;
  case_number: string;
  case_type: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  status: 'initiated' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  documents: any[];
  notes?: string;
  buyer_data?: any;
  seller_data?: any;
  buyer_status?: 'pending' | 'completed';
  seller_status?: 'pending' | 'completed';
  created_at: string;
  updated_at: string;
  conveyancer?: OrganizationUser;
  property?: Property;
  organization?: Organization;
}

export interface CaseShareToken {
  id: string;
  case_id: string;
  role: 'buyer' | 'seller';
  token: string;
  expires_at: string;
  used_at?: string;
  created_at: string;
}

export interface Loan {
  id: string;
  organization_id: string;
  loan_officer_id?: string;
  property_id?: string;
  case_id?: string;
  application_number: string;
  applicant_name: string;
  applicant_email?: string;
  loan_amount: number;
  interest_rate?: number;
  term_months?: number;
  status: 'application' | 'approved' | 'rejected' | 'disbursed';
  documents: any[];
  created_at: string;
  updated_at: string;
  loan_officer?: OrganizationUser;
  property?: Property;
  case?: Case;
  organization?: Organization;
}

export interface Communication {
  id: string;
  sender_organization_id: string;
  sender_user_id: string;
  recipient_organization_id: string;
  recipient_user_id?: string;
  subject: string;
  message: string;
  is_read: boolean;
  case_id?: string;
  property_id?: string;
  loan_id?: string;
  created_at: string;
  sender_organization?: Organization;
  sender_user?: OrganizationUser;
  recipient_organization?: Organization;
  recipient_user?: OrganizationUser;
}