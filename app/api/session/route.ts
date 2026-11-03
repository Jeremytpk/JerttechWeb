import { NextResponse, type NextRequest } from 'next/server';
import { adminAuth, firebaseConfigured } from '@/lib/firebase/admin';
import { getRow } from '@/lib/db';
import { SESSION_COOKIE, SESSION_DAYS } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** Turns a fresh Firebase sign-in (ID token) into a JertTech session cookie. */
export async function POST(req: NextRequest) {
  if (!firebaseConfigured()) return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  const { idToken } = await req.json().catch(() => ({}));
  if (typeof idToken !== 'string') return NextResponse.json({ error: 'bad-request' }, { status: 400 });

  let uid: string;
  try {
    const t = await adminAuth().verifyIdToken(idToken, true);
    if (Date.now() / 1000 - t.auth_time > 5 * 60) return NextResponse.json({ error: 'stale' }, { status: 401 });
    uid = t.uid;
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 401 });
  }

  // The Firebase project's sign-in is shared with other apps, so a Firebase account alone isn't enough:
  // only people with a JertTech profile (created by sending a request) can sign in here.
  if (!(await getRow('profiles', uid))) return NextResponse.json({ error: 'no-account' }, { status: 403 });

  const expiresIn = SESSION_DAYS * 86400 * 1000;
  const cookie = await adminAuth().createSessionCookie(idToken, { expiresIn });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, cookie, {
    maxAge: expiresIn / 1000, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/',
  });
  return res;
}
