import { supabase } from '../lib/supabase';
import type { Case, CaseShareToken } from '../types/database';

export async function generateCaseNumber(): Promise<string> {
  const prefix = 'EC';
  const year = new Date().getFullYear().toString().slice(-2);
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${year}-${rand}`;
}

export async function createCase(data: Partial<Case> & { organization_id: string; case_type: string; client_name: string }): Promise<Case> {
  const caseNumber = await generateCaseNumber();
  const { data: created, error } = await supabase
    .from('cases')
    .insert({ ...data, case_number: caseNumber, status: data.status || 'initiated', priority: data.priority || 'medium', documents: data.documents || [] })
    .select('*')
    .single();
  if (error) throw error;
  return created as Case;
}

export async function getCase(id: string): Promise<Case> {
  const { data, error } = await supabase
    .from('cases')
    .select('*, conveyancer:organization_users(*), property:properties(*), organization:organizations(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Case;
}

export async function getCasesByOrg(organizationId: string): Promise<Case[]> {
  const { data, error } = await supabase
    .from('cases')
    .select('*, conveyancer:organization_users(*), property:properties(*)')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Case[];
}

export async function updateCase(id: string, updates: Partial<Case>): Promise<Case> {
  const { data, error } = await supabase
    .from('cases')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as Case;
}

export async function updateCaseStatus(id: string, status: Case['status']): Promise<Case> {
  return updateCase(id, { status });
}

export async function getCaseStats(organizationId: string) {
  const { data, error } = await supabase
    .from('cases')
    .select('status, priority')
    .eq('organization_id', organizationId);
  if (error) throw error;

  const cases = data || [];
  return {
    total: cases.length,
    initiated: cases.filter(c => c.status === 'initiated').length,
    inProgress: cases.filter(c => c.status === 'in_progress').length,
    completed: cases.filter(c => c.status === 'completed').length,
    cancelled: cases.filter(c => c.status === 'cancelled').length,
    highPriority: cases.filter(c => c.priority === 'high').length,
  };
}

// --- Case documents ---

export interface CaseDocument {
  id: string;
  case_id: string;
  document_name: string;
  document_type: string;
  file_path: string;
  mime_type: string;
}

export async function getCaseDocuments(caseId: string): Promise<CaseDocument[]> {
  const { data, error } = await supabase
    .from('case_documents')
    .select('id, case_id, document_name, document_type, file_path, mime_type')
    .eq('case_id', caseId);
  if (error) throw error;
  return (data || []) as CaseDocument[];
}

// --- Share token functions ---

function generateToken(): string {
  return crypto.randomUUID();
}

export async function createCaseWithTokens(
  data: Partial<Case> & { organization_id: string; case_type: string; client_name: string }
): Promise<{ case_: Case; buyerToken: string; sellerToken: string }> {
  const case_ = await createCase(data);
  const buyerToken = generateToken();
  const sellerToken = generateToken();

  const { error } = await supabase.from('case_share_tokens').insert([
    { case_id: case_.id, role: 'buyer', token: buyerToken },
    { case_id: case_.id, role: 'seller', token: sellerToken },
  ]);
  if (error) throw error;

  return { case_, buyerToken, sellerToken };
}

export async function getCaseByToken(token: string): Promise<{ case_: Case; role: string; expired: boolean; used: boolean } | null> {
  const { data, error } = await supabase
    .from('case_share_tokens')
    .select('*, case:cases(*)')
    .eq('token', token)
    .single();

  if (error || !data) return null;

  return {
    case_: data.case as Case,
    role: data.role,
    expired: new Date(data.expires_at) < new Date(),
    used: !!data.used_at,
  };
}

export async function submitPartyData(token: string, wizardData: object): Promise<{ success: boolean; error?: string; case_id?: string }> {
  const { data, error } = await supabase.rpc('submit_party_data', {
    p_token: token,
    p_data: wizardData,
  });

  if (error) return { success: false, error: error.message };
  if (data?.error) return { success: false, error: data.error };
  return { success: true, case_id: data?.case_id };
}

export async function getTokensForCase(caseId: string): Promise<CaseShareToken[]> {
  const { data, error } = await supabase
    .from('case_share_tokens')
    .select('*')
    .eq('case_id', caseId)
    .order('role');
  if (error) throw error;
  return (data || []) as CaseShareToken[];
}
