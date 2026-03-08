import { useState, useEffect, useCallback } from 'react';
import { useCommunications } from './useCommunications';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export function useNotifications(organizationId: string | undefined) {
  const { messages, unreadCount, refetch, markRead } = useCommunications(organizationId);
  const [hasNewNotification, setHasNewNotification] = useState(false);

  // Subscribe to real-time notifications
  useRealtimeSubscription(
    {
      table: 'communications',
      event: 'INSERT',
      filter: organizationId ? `recipient_organization_id=eq.${organizationId}` : undefined,
    },
    () => {
      setHasNewNotification(true);
      refetch();
    },
    !!organizationId
  );

  const clearNewNotification = useCallback(() => {
    setHasNewNotification(false);
  }, []);

  return {
    notifications: messages,
    unreadCount,
    hasNewNotification,
    clearNewNotification,
    markRead,
    refetch,
  };
}
