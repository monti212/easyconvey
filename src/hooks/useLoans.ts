import { useState, useEffect, useCallback } from 'react';
import * as loansService from '../services/loans.service';
import type { Loan } from '../types/database';

export function useLoans(organizationId: string | undefined) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!organizationId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await loansService.getLoansByOrg(organizationId);
      setLoans(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (data: Parameters<typeof loansService.createLoan>[0]) => {
    const created = await loansService.createLoan(data);
    setLoans(prev => [created, ...prev]);
    return created;
  };

  const update = async (id: string, updates: Partial<Loan>) => {
    const updated = await loansService.updateLoan(id, updates);
    setLoans(prev => prev.map(l => l.id === id ? updated : l));
    return updated;
  };

  return { loans, loading, error, refetch: fetch, create, update };
}
