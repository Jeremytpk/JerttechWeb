import RequestForm from './RequestForm';
import { RequestArt } from '@/components/Illustrations';
import { isPlan } from '@/lib/pricing';
export const metadata = { title: 'Start your request' };

export default function RequestPage({ searchParams }: { searchParams: { plan?: string } }) {
  const plan = isPlan(searchParams.plan) ? searchParams.plan : 'standard';
  return (
    <div className="wrap">
      <div className="page-head has-art"><div><h1>Start your request</h1><p>Tell us about your idea. We’ll review it and send your final quote, usually within two business days.</p></div><RequestArt /></div>
      <RequestForm initialPlan={plan} />
    </div>
  );
}
