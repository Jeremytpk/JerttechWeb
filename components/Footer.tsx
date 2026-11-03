import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap f">
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/jerttech-mark.png" alt="" style={{ height: 28, width: 'auto' }} />
          JertTech, founded by Jeremy Topaka. jerttech.com
        </span>
        <span><Link href="/about">About</Link> &nbsp; <Link href="/plans">Plans</Link> &nbsp; <Link href="/request">Start a request</Link> &nbsp; <Link href="/portal">My projects</Link></span>
      </div>
    </footer>
  );
}
