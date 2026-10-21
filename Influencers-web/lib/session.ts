import type { Account } from './types';

const KEY = 'atelier-session';

export type Session = { token: string; user: Account };

export function readSession(): Session | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed?.token || !parsed.user) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(token: string, user: Account) {
  localStorage.setItem(KEY, JSON.stringify({ token, user }));
}

export function clearSession() {
  localStorage.removeItem(KEY);
}
