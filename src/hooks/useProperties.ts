import { useState, useEffect, useCallback } from 'react';
import * as propertiesService from '../services/properties.service';
import type { Property } from '../types/database';

export function useProperties(organizationId: string | undefined) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!organizationId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await propertiesService.getPropertiesByOrg(organizationId);
      setProperties(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (data: Parameters<typeof propertiesService.createProperty>[0]) => {
    const created = await propertiesService.createProperty(data);
    setProperties(prev => [created, ...prev]);
    return created;
  };

  const update = async (id: string, updates: Partial<Property>) => {
    const updated = await propertiesService.updateProperty(id, updates);
    setProperties(prev => prev.map(p => p.id === id ? updated : p));
    return updated;
  };

  const remove = async (id: string) => {
    await propertiesService.deleteProperty(id);
    setProperties(prev => prev.filter(p => p.id !== id));
  };

  return { properties, loading, error, refetch: fetch, create, update, remove };
}
