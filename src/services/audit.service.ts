import { supabase } from '../lib/supabase';

export interface AuditLogEntry {
  id: string;
  transaction_id: string;
  action: string;
  details: any;
  user_email: string;
  ip_address?: string;
  created_at: string;
}

export async function logAction(data: {
  transaction_id: string;
  action: string;
  details?: any;
  user_email: string;
  ip_address?: string;
}): Promise<void> {
  const { error } = await supabase.rpc('log_transaction_audit', {
    p_transaction_id: data.transaction_id,
    p_action: data.action,
    p_details: data.details || {},
    p_user_email: data.user_email,
    p_ip_address: data.ip_address || null,
  });
  if (error) {
    // Fallback: insert directly if RPC not available
    const { error: insertError } = await supabase
      .from('transaction_audit_logs')
      .insert({
        transaction_id: data.transaction_id,
        action: data.action,
        details: data.details || {},
        user_email: data.user_email,
        ip_address: data.ip_address,
      });
    if (insertError) throw insertError;
  }
}

export async function getAuditLogs(transactionId?: string): Promise<AuditLogEntry[]> {
  let query = supabase
    .from('transaction_audit_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (transactionId) {
    query = query.eq('transaction_id', transactionId);
  }

  const { data, error } = await query.limit(200);
  if (error) throw error;
  return (data || []) as AuditLogEntry[];
}

export async function getAuditLogsByAction(action: string): Promise<AuditLogEntry[]> {
  const { data, error } = await supabase
    .from('transaction_audit_logs')
    .select('*')
    .eq('action', action)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data || []) as AuditLogEntry[];
}
