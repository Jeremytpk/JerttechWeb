import Link from 'next/link';
import { LostArt } from '@/components/Illustrations';
export default function NotFound() {
  return <div className="wrap"><div className="page-head has-art"><div><h1>Page not found</h1><p>This page doesn’t exist. Head back home or start a request.</p></div><LostArt /></div><div className="btns" style={{ paddingBottom: 40 }}><Link className="btn btn-primary" href="/">Go home</Link><Link className="btn btn-ghost" href="/request">Start a request</Link></div></div>;
}
