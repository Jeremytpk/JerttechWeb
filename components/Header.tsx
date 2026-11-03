import Link from 'next/link';
import { cookies } from 'next/headers';
import NavLinks from './NavLinks';
import { SESSION_COOKIE } from '@/lib/auth';

export default function Header() {
  // A session cookie means they're signed in (pages that show private data still verify it).
  const signedIn = !!cookies().get(SESSION_COOKIE)?.value;
  return (
    <header className="site-header">
      <div className="wrap hdr">
        <Link className="logo" href="/" aria-label="JertTech home">
          <img src="/jerttech-mark.png" alt="" style={{ height: 40, width: 'auto' }} />
          JertTech
        </Link>
        <NavLinks />
        <div className="hdr-actions">
          {signedIn ? (
            <form action="/auth/signout" method="post"><button className="btn btn-ghost btn-sm">Sign out</button></form>
          ) : (
            <>
              <Link className="btn btn-ghost btn-sm" href="/login">Sign in</Link>
              <Link className="btn btn-ghost btn-sm" href="/login?mode=signup">Sign up</Link>
            </>
          )}
          <Link className="btn btn-primary btn-sm cta-top" href="/request">Start a request</Link>
        </div>
      </div>
    </header>
  );
}
