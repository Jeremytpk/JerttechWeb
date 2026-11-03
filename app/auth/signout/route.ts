import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth';

// Only clears the JertTech session. Firebase tokens are not revoked, because the
// Firebase project's sign-in is shared with other apps.
export async function POST(request: NextRequest) {
  const res = NextResponse.redirect(new URL('/', request.url), { status: 303 });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
