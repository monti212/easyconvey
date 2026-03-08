import { supabase } from '../lib/supabase';
import type { Organization, OrganizationUser } from '../types/database';

export async function getOrganization(id: string): Promise<Organization> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Organization;
}

export async function getOrgsByType(type: Organization['type']): Promise<Organization[]> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('type', type)
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return (data || []) as Organization[];
}

export async function getOrgMembers(organizationId: string): Promise<OrganizationUser[]> {
  const { data, error } = await supabase
    .from('organization_users')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('first_name');
  if (error) throw error;
  return (data || []) as OrganizationUser[];
}

export async function getAllOrganizations(): Promise<Organization[]> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return (data || []) as Organization[];
}
