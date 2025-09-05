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
      civilian?: { name?: string | null; phoneNumber?: string | null } | null;
    };
  };
};

const TEN_MIN_MS = 10 * 60 * 1000;
const CIVILIAN_KEY = 'resq_civilian';
// ✅ make key match the one the bottom nav uses:
const storageKey = (civilianId: number | string) => `c-${civilianId}-notification`;

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

  // Resolve civilian id from auth / user / localStorage
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

      // ✅ Store richer payload so the UI can render a detailed card
      const item = {
        id: String(e.id),
        type: 'nearby-emergency',
        title: 'Someone near needs your help',
        message: e.emergencySubCategory?.name ?? 'Emergency',
        createdAt: e.createdAt ?? new Date().toISOString(),
        createdAtClient: new Date().toISOString(),
        read: false,
        meta: {
          emergencyId: String(e.id),
          categoryName: e.emergencySubCategory?.name ?? null,
          address: e.address ?? null,
          civilianName: e.civilian?.name ?? null,
          phoneNumber: e.civilian?.phoneNumber ?? null,
          latitude: e.latitude,
          longitude: e.longitude,
          description: e.description ?? null,
        },
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

// Debug helpers
if (typeof window !== 'undefined') {
  (window as any).testNotificationStorage = (testCivilianId: number = 2) => {
    const key = storageKey(testCivilianId);
    const testItem = {
      id: 'test-' + Date.now(),
      type: 'nearby-emergency',
      title: 'Someone near needs your help',
      message: 'Heart Attack',
      createdAt: new Date().toISOString(),
      createdAtClient: new Date().toISOString(),
      read: false,
      meta: {
        emergencyId: 'test',
        categoryName: 'Heart Attack',
        address: '123 Main St',
        civilianName: 'John Doe',
        phoneNumber: '0771234567',
        latitude: 0,
        longitude: 0,
        description: 'Test',
      },
    };

    const current = readList(key);
    const next = [testItem, ...current].slice(0, 50);
    writeList(key, next);

    window.dispatchEvent(new CustomEvent('resq:notification-push', { detail: { key, item: testItem } }));
    console.log('🧪 Test notification stored for key:', key);
  };

  (window as any).checkNotifications = (civilianId: number = 2) => {
    const key = storageKey(civilianId);
    const notifications = readList(key);
    console.log('📊 Notifications for key', key, ':', notifications);
    return notifications;
  };

  (window as any).clearNotifications = (civilianId: number = 2) => {
    const key = storageKey(civilianId);
    localStorage.removeItem(key);
    console.log('🗑️ Cleared notifications for key:', key);
    window.dispatchEvent(new CustomEvent('resq:notifications-changed', { detail: { key } }));
  };
}
