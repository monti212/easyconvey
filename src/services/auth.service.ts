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
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  });
  if (error) throw error;

  // Auto-provision organization and membership for the new user
  if (data.user) {
    try {
      const fullName = [metadata?.first_name, metadata?.last_name].filter(Boolean).join(' ') || email;
      const orgType = organizationType || 'conveyancer';
      const role = loginRole || 'super_admin';

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: `${fullName}'s Organization`,
          type: orgType,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Create organization_users membership
      const { error: memberError } = await supabase
        .from('organization_users')
        .insert({
          organization_id: org.id,
          email,
          first_name: metadata?.first_name || '',
          last_name: metadata?.last_name || '',
          role,
          is_active: true,
          auth_user_id: data.user.id,
        });

      if (memberError) throw memberError;
    } catch (provisionError) {
      console.error('Failed to auto-provision organization:', provisionError);
      // Don't block signup — user can be linked manually later
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
