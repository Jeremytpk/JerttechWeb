// Server only. Sign-in sessions use a Firebase session cookie, checked on every request.
import { cookies } from 'next/headers';
import { adminAuth, firebaseConfigured } from '@/lib/firebase/admin';
import { getRow } from '@/lib/db';

export const SESSION_COOKIE = '__session';
export const SESSION_DAYS = 14; // Firebase's maximum

export type SessionUser = { id: string; email: string };

export async function currentUser(): Promise<SessionUser | null> {
  if (!firebaseConfigured()) return null;
  const cookie = cookies().get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try {
    const t = await adminAuth().verifySessionCookie(cookie, true);
    return { id: t.uid, email: (t.email || '').toLowerCase() };
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const user = await currentUser();
  if (!user) return null;
  const profile = await getRow('profiles', user.id);
  return profile?.role === 'admin' ? user : null;
}
