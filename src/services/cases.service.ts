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
    .select('*, conveyancer:organization_users!cases_conveyancer_id_fkey(*), property:properties(*), organization:organizations!cases_organization_id_fkey(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  const c = data as Case;
  // The transaction wizard persists its full state as objects inside `documents`.
  // Pull out the latest wizard snapshot BEFORE sanitizing `documents` to strings,
  // so the conveyancer dashboard can read the selected parties, extracted
  // identity/property details and pricing captured during the wizard.
  const rawDocs = Array.isArray(c.documents) ? c.documents : [];
  const wizardEntry = [...rawDocs]
    .reverse()
    .find((d: any) => d && typeof d === 'object' && d.wizardData);
  c.wizardData = wizardEntry?.wizardData ?? null;
  // Sanitize documents — may contain wizard state objects instead of string arrays
  c.documents = rawDocs.filter((d: any) => typeof d === 'string');
  return c;
}

export async function getCasesByOrg(organizationId: string): Promise<Case[]> {
  const { data, error } = await supabase
    .from('cases')
    .select('*, conveyancer:organization_users!cases_conveyancer_id_fkey(*), property:properties(*)')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  // Sanitize documents field — it may contain wizard state objects instead of string arrays
  return ((data || []) as Case[]).map(c => ({
    ...c,
    documents: Array.isArray(c.documents)
      ? c.documents.filter((d: any) => typeof d === 'string')
      : [],
  }));
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

// --- Generated documents (AI document persistence) ---

export interface GeneratedDocument {
  id: string;
  case_id: string;
  document_type: string;
  document_name: string;
  content: string;
  status: 'generating' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export async function getGeneratedDocuments(caseId: string): Promise<GeneratedDocument[]> {
  const { data, error } = await supabase
    .from('generated_documents')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at');
  if (error) {
    console.warn('generated_documents table may not exist yet:', error.message);
    return [];
  }
  return (data || []) as GeneratedDocument[];
}

export async function upsertGeneratedDocument(
  caseId: string,
  documentType: string,
  documentName: string,
  content: string,
  status: 'generating' | 'completed' | 'failed',
  errorMessage?: string,
): Promise<GeneratedDocument | null> {
  const { data, error } = await supabase
    .from('generated_documents')
    .upsert(
      {
        case_id: caseId,
        document_type: documentType,
        document_name: documentName,
        content,
        status,
        error_message: errorMessage || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'case_id,document_type' }
    )
    .select('*')
    .single();
  if (error) {
    console.warn('Failed to upsert generated document:', error.message);
    return null;
  }
  return data as GeneratedDocument;
}

export async function deleteGeneratedDocument(caseId: string, documentType: string): Promise<void> {
  await supabase
    .from('generated_documents')
    .delete()
    .eq('case_id', caseId)
    .eq('document_type', documentType);
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
  // 1 year expiry — 30 days was too short for real transactions
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from('case_share_tokens').insert([
    { case_id: case_.id, role: 'buyer', token: buyerToken, expires_at: expiresAt },
    { case_id: case_.id, role: 'seller', token: sellerToken, expires_at: expiresAt },
  ]);
  if (error) throw error;

  return { case_, buyerToken, sellerToken };
}

export async function regenerateShareTokens(
  caseId: string
): Promise<{ buyerToken: string; sellerToken: string }> {
  // Delete old tokens for this case
  await supabase.from('case_share_tokens').delete().eq('case_id', caseId);

  const buyerToken = generateToken();
  const sellerToken = generateToken();
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from('case_share_tokens').insert([
    { case_id: caseId, role: 'buyer', token: buyerToken, expires_at: expiresAt },
    { case_id: caseId, role: 'seller', token: sellerToken, expires_at: expiresAt },
  ]);
  if (error) throw error;

  return { buyerToken, sellerToken };
}

export async function getCaseByToken(token: string): Promise<{ case_: Case; role: string; expired: boolean; used: boolean } | null> {
  // Use a SECURITY DEFINER RPC so anonymous users can look up case data
  // via share token without needing direct RLS access to cases/organizations.
  const { data, error } = await supabase.rpc('get_case_by_share_token', { p_token: token });

  if (error || !data) return null;

  return {
    case_: data.case as Case,
    role: data.role,
    expired: data.expired,
    used: data.used,
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

// --- Submitted parties (clients who completed a share link) ---

export interface SubmittedParty {
  caseId: string;
  caseNumber: string;
  caseType: string;
  role: 'buyer' | 'seller';
  name: string;
  data: any;
  submittedAt: string;
}

function derivePartyName(data: any): string {
  if (!data) return 'Unnamed party';
  const composed = `${data.firstName || ''} ${data.lastName || ''}`.trim();
  return (
    data.fullName ||
    composed ||
    data.extractedBuyerName ||
    data.extractedSellerName ||
    data.extractedClientName ||
    'Unnamed party'
  );
}

/**
 * Every buyer/seller across the organisation's cases who has completed their
 * share-link submission. Used by the conveyancer's client-selection step.
 */
export async function getSubmittedParties(organizationId: string): Promise<SubmittedParty[]> {
  const { data, error } = await supabase
    .from('cases')
    .select('id, case_number, case_type, buyer_data, seller_data, buyer_status, seller_status, updated_at')
    .eq('organization_id', organizationId)
    .order('updated_at', { ascending: false });
  if (error) {
    console.warn('Unable to load submitted parties:', error.message);
    return [];
  }
  const parties: SubmittedParty[] = [];
  for (const c of (data || []) as any[]) {
    if (c.buyer_status === 'completed' && c.buyer_data) {
      parties.push({
        caseId: c.id,
        caseNumber: c.case_number,
        caseType: c.case_type,
        role: 'buyer',
        name: derivePartyName(c.buyer_data),
        data: c.buyer_data,
        submittedAt: c.buyer_data.submittedAt || c.updated_at,
      });
    }
    if (c.seller_status === 'completed' && c.seller_data) {
      parties.push({
        caseId: c.id,
        caseNumber: c.case_number,
        caseType: c.case_type,
        role: 'seller',
        name: derivePartyName(c.seller_data),
        data: c.seller_data,
        submittedAt: c.seller_data.submittedAt || c.updated_at,
      });
    }
  }
  return parties;
}

/**
 * Conveyancer-side direct save of a party's details (manual entry — no share
 * token). Writes the same buyer_data/seller_data shape a link submission would.
 */
export async function savePartyData(caseId: string, role: 'buyer' | 'seller', partyData: object): Promise<void> {
  await updateCase(
    caseId,
    role === 'buyer'
      ? { buyer_data: partyData, buyer_status: 'completed' }
      : { seller_data: partyData, seller_status: 'completed' },
  );
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

export async function getTokensForOrg(organizationId: string): Promise<CaseShareToken[]> {
  const { data, error } = await supabase
    .from('case_share_tokens')
    .select('*')
    .in('case_id', supabase.from('cases').select('id').eq('organization_id', organizationId) as any)
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data || []) as CaseShareToken[];
}

// --- Link activity tracking ---

export interface LinkActivity {
  id: string;
  token: string;
  case_id: string;
  role: 'buyer' | 'seller';
  event_type: 'link_opened' | 'step_viewed' | 'step_completed' | 'submitted';
  step_number?: number;
  step_name?: string;
  duration_seconds?: number;
  metadata?: any;
  created_at: string;
}

export async function trackLinkActivity(activity: Omit<LinkActivity, 'id' | 'created_at'>): Promise<void> {
  const { error } = await supabase.from('case_link_activity').insert(activity);
  if (error) console.warn('Activity tracking unavailable:', error.message);
}

export async function getLinkActivityForCase(caseId: string): Promise<LinkActivity[]> {
  const { data, error } = await supabase
    .from('case_link_activity')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: true });
  if (error) return [];
  return (data || []) as LinkActivity[];
}

export async function getAllLinkActivity(organizationId: string): Promise<LinkActivity[]> {
  const { data, error } = await supabase
    .from('case_link_activity')
    .select('*')
    .in('case_id', supabase.from('cases').select('id').eq('organization_id', organizationId) as any)
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) return [];
  return (data || []) as LinkActivity[];
}
