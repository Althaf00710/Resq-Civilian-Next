'use client';

import { useEffect, useMemo } from 'react';
import { useSubscription } from '@apollo/client';
import { ON_NEARBY_EMERGENCY } from '@/graphql/subscriptions/civilianSubscriptions';
import { useAuth } from '@/context/AuthContext';

type Payload = {
  onNearbyEmergency: {
    civilianId: number;
    emergency: {
      id: string | number;
      address?: string | null;
      createdAt?: string | null;
      description?: string | null;
      emergencySubCategoryId: number;
      latitude: number;
      longitude: number;
      proofImageURL?: string | null;
      status?: string | null;
      emergencySubCategory?: { name?: string | null } | null;
      civilian?: { name?: string | null } | null;
    };
  };
};

const TEN_MIN_MS = 10 * 60 * 1000;
const CIVILIAN_KEY = 'resq_civilian';
const storageKey = (civilianId: number | string) => `notification`;

const safeParse = <T,>(s: string | null): T | null => {
  if (!s) return null;
  try {
    const first = JSON.parse(s);
    return typeof first === 'string' ? JSON.parse(first) : first;
  } catch {
    return null;
  }
};

const readList = (key: string) => {
  try { 
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : []; 
  } catch { 
    return []; 
  }
};

const writeList = (key: string, list: any[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('resq:notifications-changed', { detail: { key } }));
    console.log('💾 Saved to localStorage. Key:', key, 'Count:', list.length);
  } catch (error) {
    console.error('❌ Failed to write to localStorage:', error);
  }
};

const parseTs = (n: any) => {
  const cands = [n.createdAt, n.createdAtClient, n.created_at, n.timestamp];
  for (const c of cands) {
    if (typeof c === 'string') {
      const t = Date.parse(c);
      if (!Number.isNaN(t)) return t;
    }
  }
  return Date.now();
};

const pruneOld = (list: any[]) => {
  const now = Date.now();
  return Array.isArray(list) ? list.filter((n) => now - parseTs(n) <= TEN_MIN_MS) : [];
};

export default function NearbyEmergencySubscriber() {
  const { isLoggedIn, civilian, user } = useAuth() as any;

  // Robust civilian id resolution (auth → user → LS)
  const civilianId = useMemo<number | null>(() => {
    const direct = Number.parseInt(String(civilian?.id ?? user?.id ?? ''), 10);
    if (Number.isFinite(direct)) return direct;
    if (typeof window !== 'undefined') {
      const ls = safeParse<any>(localStorage.getItem(CIVILIAN_KEY));
      const fromLs = Number.parseInt(String(ls?.id ?? ls?.loginCivilian?.civilian?.id ?? ''), 10);
      if (Number.isFinite(fromLs)) return fromLs;
    }
    return null;
  }, [civilian?.id, user?.id]);

  // Don't over-gate; just require we've resolved an id
  const shouldSubscribe = Boolean(isLoggedIn && civilianId);

  useEffect(() => {
    console.log('🔍 NearbyEmergencySubscriber mounted');
    console.log('👤 Civilian ID:', civilianId);
    console.log('📡 Should subscribe:', shouldSubscribe);
  }, [civilianId, shouldSubscribe]);

  useSubscription<Payload>(ON_NEARBY_EMERGENCY, {
    variables: { civilianId: civilianId ?? 0 },
    skip: !shouldSubscribe,
    fetchPolicy: 'no-cache',
    onData: ({ data: result }) => {
      console.log('📡 Subscription received data:', result);
      
      const payload = result.data?.onNearbyEmergency;
      const e = payload?.emergency;
      if (!payload || !e) {
        console.log('❌ No payload or emergency data');
        return;
      }

      console.log('🚨 Processing emergency:', e.id);
      
      const key = storageKey(payload.civilianId);
      const item = {
        id: String(e.id),
        title: `Emergency nearby: ${e.emergencySubCategory?.name ?? 'Emergency'}`,
        message:
          (e.description && e.description.trim()) ||
          (e.address ? `Reported at ${e.address}` : 'A nearby emergency was reported'),
        createdAt: e.createdAt ?? new Date().toISOString(),
        createdAtClient: new Date().toISOString(),
        read: false,
      };

      console.log('📋 Notification item:', item);
      console.log('🔑 Storage key:', key);

      // 1) push immediately so UI can react without waiting for LS
      window.dispatchEvent(new CustomEvent('resq:notification-push', { detail: { key, item } }));
      console.log('🎯 Dispatched push event');

      // 2) persist
      try {
        const current = pruneOld(readList(key));
        console.log('📂 Current notifications in LS:', current.length);
        
        const next = current.find((n: any) => n.id === item.id)
          ? current
          : [item, ...current].slice(0, 50);
        
        writeList(key, next);
        
      } catch (err) {
        console.warn('❌ Failed to persist notification', err);
      }
    },
    onError: (error) => {
      console.error('❌ Subscription error:', error);
    },
    onComplete: () => {
      console.log('✅ Subscription completed');
    },
  });

  // periodic prune keeps LS fresh even if no new events
  useEffect(() => {
    if (!civilianId) return;
    
    const key = storageKey(civilianId);
    const tick = () => {
      const current = readList(key);
      const pruned = pruneOld(current);
      if (pruned.length !== current.length) {
        writeList(key, pruned);
        console.log('🧹 Pruned old notifications. Before:', current.length, 'After:', pruned.length);
      }
    };
    
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [civilianId]);

  return null;
}

// Add test function to window for debugging
if (typeof window !== 'undefined') {
  (window as any).testNotificationStorage = (testCivilianId: number = 2) => {
    const testItem = {
      id: 'test-' + Date.now(),
      title: 'Test Emergency',
      message: 'This is a test notification from console',
      createdAt: new Date().toISOString(),
      createdAtClient: new Date().toISOString(),
      read: false,
    };
    
    const key = storageKey(testCivilianId);
    const current = readList(key);
    const next = [testItem, ...current].slice(0, 50);
    writeList(key, next);
    console.log('🧪 Test notification stored for civilian:', testCivilianId);
    
    // Also dispatch push event
    window.dispatchEvent(new CustomEvent('resq:notification-push', { 
      detail: { key, item: testItem } 
    }));
  };

  (window as any).checkNotifications = (civilianId: number = 2) => {
    const key = storageKey(civilianId);
    const notifications = readList(key);
    console.log('📊 Notifications for civilian', civilianId, ':', notifications);
    return notifications;
  };

  (window as any).clearNotifications = (civilianId: number = 2) => {
    const key = storageKey(civilianId);
    localStorage.removeItem(key);
    console.log('🗑️ Cleared notifications for civilian:', civilianId);
    window.dispatchEvent(new CustomEvent('resq:notifications-changed', { detail: { key } }));
  };
}