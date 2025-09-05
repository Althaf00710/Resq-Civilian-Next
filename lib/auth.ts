// (optional but helpful) mark this as client-only
'use client';

export const TOKEN_KEY = 'resq_jwt';
export const CIVILIAN_KEY = 'resq_civilian';

export type Civilian = {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  nicNumber: string;
  joinedDate: string;
  isRestrict: boolean;
  civilianStatusId: number;
  civilianStatus?: { role: string };
};

const isBrowser = typeof window !== 'undefined';

const safeStorage = {
  getItem(key: string): string | null {
    if (!isBrowser) return null;
    try { return window.localStorage.getItem(key); } catch { return null; }
  },
  setItem(key: string, val: string) {
    if (!isBrowser) return;
    try { window.localStorage.setItem(key, val); } catch {}
  },
  removeItem(key: string) {
    if (!isBrowser) return;
    try { window.localStorage.removeItem(key); } catch {}
  },
};

export function extractJwtFromMessage(message?: string | null): string | null {
  if (!message) return null;
  const m = message.match(/[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/);
  return m?.[0] ?? null;
}

export function saveSession(token: string, civilian: Civilian) {
  safeStorage.setItem(TOKEN_KEY, token);
  safeStorage.setItem(CIVILIAN_KEY, JSON.stringify(civilian));
}

export function loadSession(): { token: string | null; civilian: Civilian | null } {
  // SSR-safe: return nulls on the server
  const token = safeStorage.getItem(TOKEN_KEY);
  const raw = safeStorage.getItem(CIVILIAN_KEY);
  return { token, civilian: raw ? (JSON.parse(raw) as Civilian) : null };
}

export function clearSession() {
  safeStorage.removeItem(TOKEN_KEY);
  safeStorage.removeItem(CIVILIAN_KEY);
}
