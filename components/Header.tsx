import Link from 'next/link';
import NavLinks from './NavLinks';

export default function Header() {
  return (
    <header className="site-header">
      <div className="wrap hdr">
        <Link className="logo" href="/" aria-label="JertTech home">
          <img src="/jerttech-mark.png" alt="" style={{ height: 40, width: 'auto' }} />
          JertTech
        </Link>
        <NavLinks />
        <Link className="btn btn-primary btn-sm cta-top" href="/request">Start a request</Link>
      </div>
    </header>
  );
}
