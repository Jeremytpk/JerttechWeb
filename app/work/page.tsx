import Link from 'next/link';
import Work from '@/components/Work';
import { WorkArt } from '@/components/Illustrations';
export const metadata = { title: 'Our work' };

export default function WorkPage() {
  return (
    <div className="wrap">
      <div className="page-head has-art"><div><h1>Our work</h1><p>Every one of these apps was designed, built and launched by JertTech, backend and database included.</p></div><WorkArt /></div>
      <Work />
      <div style={{ padding: '44px 0 20px' }}><Link className="btn btn-primary" href="/request">Start your request</Link></div>
    </div>
  );
}
