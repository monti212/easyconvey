import { supabase } from '../lib/supabase';
import type { Loan } from '../types/database';

export async function createLoan(data: Partial<Loan> & { organization_id: string; applicant_name: string; loan_amount: number }): Promise<Loan> {
  const appNumber = `LN${new Date().getFullYear().toString().slice(-2)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const { data: created, error } = await supabase
    .from('loans')
    .insert({ ...data, application_number: appNumber, status: data.status || 'application', documents: data.documents || [] })
    .select('*')
    .single();
  if (error) throw error;
  return created as Loan;
}

export async function getLoan(id: string): Promise<Loan> {
  const { data, error } = await supabase
    .from('loans')
    .select('*, loan_officer:organization_users(*), property:properties(*), case:cases(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Loan;
}

export async function getLoansByOrg(organizationId: string): Promise<Loan[]> {
  const { data, error } = await supabase
    .from('loans')
    .select('*, loan_officer:organization_users(*), property:properties(*)')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Loan[];
}

export async function updateLoan(id: string, updates: Partial<Loan>): Promise<Loan> {
  const { data, error } = await supabase
    .from('loans')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as Loan;
}

export async function getLoanStats(organizationId: string) {
  const { data, error } = await supabase
    .from('loans')
    .select('status, loan_amount')
    .eq('organization_id', organizationId);
  if (error) throw error;

  const loans = data || [];
  return {
    total: loans.length,
    applications: loans.filter(l => l.status === 'application').length,
    approved: loans.filter(l => l.status === 'approved').length,
    rejected: loans.filter(l => l.status === 'rejected').length,
    disbursed: loans.filter(l => l.status === 'disbursed').length,
    totalAmount: loans.reduce((sum, l) => sum + (l.loan_amount || 0), 0),
  };
}
