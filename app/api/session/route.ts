import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, firebaseConfigured } from '@/lib/firebase/admin';
import { col, getRow, now, updateRow } from '@/lib/db';
import { SESSION_COOKIE, SESSION_DAYS } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** Turns a fresh Firebase sign-in (ID token) into a JertTech session cookie. */
export async function POST(req: NextRequest) {
  if (!firebaseConfigured()) return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  const { idToken, name } = await req.json().catch(() => ({}));
  if (typeof idToken !== 'string') return NextResponse.json({ error: 'bad-request' }, { status: 400 });

  let uid: string, email: string;
  try {
    const t = await adminAuth().verifyIdToken(idToken, true);
    if (Date.now() / 1000 - t.auth_time > 5 * 60) return NextResponse.json({ error: 'stale' }, { status: 401 });
    uid = t.uid;
    email = (t.email || '').toLowerCase();
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 401 });
  }

  // First sign-in on JertTech: create their profile. Everyone starts as a customer;
  // an admin can switch them to admin from the dashboard.
  const fullName = typeof name === 'string' ? name.trim().slice(0, 120) : '';
  const profile = await getRow('profiles', uid);
  if (!profile) {
    await col('profiles').doc(uid).set({ email, full_name: fullName || null, phone: null, role: 'customer', stripe_customer_id: null, created_at: now() });
  } else if (fullName && !profile.full_name) {
    await updateRow('profiles', uid, { full_name: fullName });
  }

  const expiresIn = SESSION_DAYS * 86400 * 1000;
  const cookie = await adminAuth().createSessionCookie(idToken, { expiresIn });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, cookie, {
    maxAge: expiresIn / 1000, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/',
  });
  return res;
}
