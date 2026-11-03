import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const path = request.nextUrl.pathname;
  const configured = /^https?:\/\//.test(process.env.NEXT_PUBLIC_SUPABASE_URL || '') && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!configured) {
    // Accounts aren't connected yet: send protected pages to /login, which explains it.
    if (path.startsWith('/portal') || path.startsWith('/admin')) return NextResponse.redirect(new URL('/login', request.url));
    return response;
  }
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && (path.startsWith('/portal') || path.startsWith('/admin'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = { matcher: ['/portal/:path*', '/admin/:path*', '/login', '/auth/:path*'] };
