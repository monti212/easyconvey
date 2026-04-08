import { supabase } from '../lib/supabase';
import type { Organization, OrganizationUser } from '../types/database';

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  metadata?: { first_name?: string; last_name?: string },
  organizationType?: string,
  loginRole?: string,
  organizationName?: string,
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });
  if (error) throw error;

  // Provision org + membership via SECURITY DEFINER RPC so it works
  // regardless of whether email confirmation is required.
  if (data.user) {
    const firstName = metadata?.first_name || '';
    const lastName  = metadata?.last_name  || '';
    const fullName  = [firstName, lastName].filter(Boolean).join(' ') || email;
    const orgName   = organizationName?.trim() || `${fullName}'s Organization`;
    const orgType   = organizationType || 'conveyancer';
    const role      = loginRole       || 'super_admin';

    const { data: result, error: rpcError } = await supabase.rpc('provision_new_user', {
      p_auth_user_id: data.user.id,
      p_email:        email,
      p_first_name:   firstName,
      p_last_name:    lastName,
      p_org_name:     orgName,
      p_org_type:     orgType,
      p_role:         role,
    });

    if (rpcError) {
      console.error('provision_new_user RPC error:', rpcError);
    } else if (result && !(result as any).success) {
      console.error('provision_new_user returned failure:', (result as any).error);
    }
  }

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
