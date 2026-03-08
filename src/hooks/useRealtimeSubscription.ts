import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

type EventType = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface SubscriptionConfig {
  table: string;
  schema?: string;
  event?: EventType;
  filter?: string;
}

export function useRealtimeSubscription(
  config: SubscriptionConfig,
  callback: (payload: any) => void,
  enabled: boolean = true
) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel(`realtime-${config.table}-${Date.now()}`)
      .on(
        'postgres_changes' as any,
        {
          event: config.event || '*',
          schema: config.schema || 'public',
          table: config.table,
          filter: config.filter,
        },
        (payload: any) => {
          callback(payload);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [config.table, config.event, config.filter, enabled]);
}
