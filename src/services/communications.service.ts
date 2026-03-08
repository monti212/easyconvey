import { supabase } from '../lib/supabase';
import type { Communication } from '../types/database';

export async function sendMessage(data: {
  sender_organization_id: string;
  sender_user_id: string;
  recipient_organization_id: string;
  recipient_user_id?: string;
  subject: string;
  message: string;
  case_id?: string;
  property_id?: string;
  loan_id?: string;
}): Promise<Communication> {
  const { data: created, error } = await supabase
    .from('communications')
    .insert({ ...data, is_read: false })
    .select('*')
    .single();
  if (error) throw error;
  return created as Communication;
}

export async function getMessages(organizationId: string): Promise<Communication[]> {
  const { data, error } = await supabase
    .from('communications')
    .select('*, sender_organization:organizations!sender_organization_id(*), sender_user:organization_users!sender_user_id(*)')
    .eq('recipient_organization_id', organizationId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Communication[];
}

export async function getUnreadCount(organizationId: string): Promise<number> {
  const { count, error } = await supabase
    .from('communications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_organization_id', organizationId)
    .eq('is_read', false);
  if (error) throw error;
  return count || 0;
}

export async function markAsRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('communications')
    .update({ is_read: true })
    .eq('id', id);
  if (error) throw error;
}

export async function markAllAsRead(organizationId: string): Promise<void> {
  const { error } = await supabase
    .from('communications')
    .update({ is_read: true })
    .eq('recipient_organization_id', organizationId)
    .eq('is_read', false);
  if (error) throw error;
}
