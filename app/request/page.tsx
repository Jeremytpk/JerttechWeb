import RequestForm from './RequestForm';
import { isPlan } from '@/lib/pricing';
import { currentUser } from '@/lib/auth';
import { getRow } from '@/lib/db';
import { RequestArt } from '@/components/Illustrations';
export const metadata = { title: 'Start your request' };
export const dynamic = 'force-dynamic';

export default async function RequestPage({ searchParams }: { searchParams: { plan?: string } }) {
  const plan = isPlan(searchParams.plan) ? searchParams.plan : 'standard';
  const user = await currentUser();
  const profile = user ? await getRow('profiles', user.id) : null;
  const account = user ? { email: user.email, name: profile?.full_name || '', phone: profile?.phone || '' } : null;
  return (
    <div className="wrap">
      <div className="page-head has-art"><div><h1>Start your request</h1><p>Tell us about your idea. We’ll review it and send your final quote, usually within two business days.</p></div><RequestArt /></div>
      <RequestForm initialPlan={plan} account={account} />
    </div>
  );
}
