import Link from 'next/link';
import { cookies } from 'next/headers';
import NavLinks from './NavLinks';
import { SESSION_COOKIE } from '@/lib/auth';

/** A simple head-and-shoulders avatar, in the same style as the logo's character. */
function Head() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="8.5" r="4" fill="currentColor" />
      <path d="M3.5 24.5c.8-5.4 4.3-9 8.5-9s7.7 3.6 8.5 9z" fill="currentColor" />
    </svg>
  );
}

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
          <Link className="btn btn-primary btn-sm cta-top" href="/request">Start a request</Link>
          <Link className={`avatar${signedIn ? ' on' : ''}`} href={signedIn ? '/portal' : '/login'}
            aria-label={signedIn ? 'My account' : 'Sign in or sign up'} title={signedIn ? 'My account' : 'Sign in or sign up'}>
            <Head />
          </Link>
        </div>
      </div>
    </header>
  );
}
