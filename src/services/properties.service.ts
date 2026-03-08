import { supabase } from '../lib/supabase';
import type { Property } from '../types/database';

export async function createProperty(data: Partial<Property> & { organization_id: string; title: string; property_type: string; price: number; address: string }): Promise<Property> {
  const { data: created, error } = await supabase
    .from('properties')
    .insert({ ...data, status: data.status || 'available' })
    .select('*')
    .single();
  if (error) throw error;
  return created as Property;
}

export async function getProperty(id: string): Promise<Property> {
  const { data, error } = await supabase
    .from('properties')
    .select('*, agent:organization_users(*), organization:organizations(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Property;
}

export async function getPropertiesByOrg(organizationId: string): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*, agent:organization_users(*)')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Property[];
}

export async function updateProperty(id: string, updates: Partial<Property>): Promise<Property> {
  const { data, error } = await supabase
    .from('properties')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as Property;
}

export async function deleteProperty(id: string): Promise<void> {
  const { error } = await supabase.from('properties').delete().eq('id', id);
  if (error) throw error;
}
