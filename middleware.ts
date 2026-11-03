import { NextResponse, type NextRequest } from 'next/server';

// Quick gate: no session cookie means straight to sign-in. The pages themselves verify the cookie with Firebase.
export function middleware(request: NextRequest) {
  if (!request.cookies.get('__session')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/portal/:path*', '/admin/:path*'] };
