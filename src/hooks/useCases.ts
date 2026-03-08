import { useState, useEffect, useCallback } from 'react';
import * as casesService from '../services/cases.service';
import type { Case } from '../types/database';

export function useCases(organizationId: string | undefined) {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!organizationId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await casesService.getCasesByOrg(organizationId);
      setCases(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (data: Parameters<typeof casesService.createCase>[0]) => {
    const created = await casesService.createCase(data);
    setCases(prev => [created, ...prev]);
    return created;
  };

  const update = async (id: string, updates: Partial<Case>) => {
    const updated = await casesService.updateCase(id, updates);
    setCases(prev => prev.map(c => c.id === id ? updated : c));
    return updated;
  };

  return { cases, loading, error, refetch: fetch, create, update };
}
