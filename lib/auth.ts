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

export function extractJwtFromMessage(message?: string | null): string | null {
  if (!message) return null;
  const m = message.match(/[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/);
  return m?.[0] ?? null;
}

export function saveSession(token: string, civilian: Civilian) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(CIVILIAN_KEY, JSON.stringify(civilian));
}

export function loadSession(): { token: string | null; civilian: Civilian | null } {
  const token = localStorage.getItem(TOKEN_KEY);
  const raw = localStorage.getItem(CIVILIAN_KEY);
  return { token, civilian: raw ? (JSON.parse(raw) as Civilian) : null };
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CIVILIAN_KEY);
}
