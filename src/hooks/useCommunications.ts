import { useState, useEffect, useCallback } from 'react';
import * as commsService from '../services/communications.service';
import type { Communication } from '../types/database';

export function useCommunications(organizationId: string | undefined) {
  const [messages, setMessages] = useState<Communication[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!organizationId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const [msgs, count] = await Promise.all([
        commsService.getMessages(organizationId),
        commsService.getUnreadCount(organizationId),
      ]);
      setMessages(msgs);
      setUnreadCount(count);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => { fetch(); }, [fetch]);

  const send = async (data: Parameters<typeof commsService.sendMessage>[0]) => {
    const created = await commsService.sendMessage(data);
    return created;
  };

  const markRead = async (id: string) => {
    await commsService.markAsRead(id);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return { messages, unreadCount, loading, error, refetch: fetch, send, markRead };
}
