import { useState, useEffect, useCallback } from 'react';
import * as auditService from '../services/audit.service';
import type { AuditLogEntry } from '../services/audit.service';

export function useAuditLogs(transactionId?: string) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await auditService.getAuditLogs(transactionId);
      setLogs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  useEffect(() => { fetch(); }, [fetch]);

  const log = async (data: Parameters<typeof auditService.logAction>[0]) => {
    await auditService.logAction(data);
    await fetch();
  };

  return { logs, loading, error, refetch: fetch, log };
}
