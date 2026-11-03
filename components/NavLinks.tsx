'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [['/', 'Home'], ['/work', 'Our work'], ['/plans', 'Plans'], ['/about', 'About'], ['/portal', 'My projects']] as const;

export default function NavLinks() {
  const path = usePathname();
  return (
    <nav className="main" aria-label="Main">
      {LINKS.map(([href, label]) => (
        <Link key={href} href={href} aria-current={(href === '/' ? path === '/' : path.startsWith(href)) ? 'page' : undefined}>{label}</Link>
      ))}
    </nav>
  );
}
