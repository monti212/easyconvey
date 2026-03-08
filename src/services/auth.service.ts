import { supabase } from '../lib/supabase';
import type { Organization, OrganizationUser } from '../types/database';

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email: string, password: string, metadata?: { first_name?: string; last_name?: string }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

export async function getOrganizationsForUser(authUserId: string): Promise<(OrganizationUser & { organization: Organization })[]> {
  const { data, error } = await supabase
    .from('organization_users')
    .select('*, organization:organizations(*)')
    .eq('auth_user_id', authUserId)
    .eq('is_active', true);

  if (error) throw error;
  return (data || []) as (OrganizationUser & { organization: Organization })[];
}

export async function getOrganizationUserByEmail(email: string): Promise<(OrganizationUser & { organization: Organization })[]> {
  const { data, error } = await supabase
    .from('organization_users')
    .select('*, organization:organizations(*)')
    .eq('email', email)
    .eq('is_active', true);

  if (error) throw error;
  return (data || []) as (OrganizationUser & { organization: Organization })[];
}

export async function linkAuthUser(orgUserId: string, authUserId: string) {
  const { error } = await supabase
    .from('organization_users')
    .update({ auth_user_id: authUserId })
    .eq('id', orgUserId);

  if (error) throw error;
}

export async function updateLastLogin(orgUserId: string) {
  const { error } = await supabase
    .from('organization_users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', orgUserId);

  if (error) throw error;
}
