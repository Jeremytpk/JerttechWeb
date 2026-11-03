import Link from 'next/link';
import { EmptyArt } from '@/components/Illustrations';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { getRow, findRows, newest, type Row } from '@/lib/db';
import { PLANS, STAGES, MAINTENANCE_CENTS, money, planPrice, type PlanId } from '@/lib/pricing';
import { Pill, STATUS, PAY, CH, CODE, CH_TYPE, URG, fdate } from '@/lib/labels';
import { startPlan, requestChange, requestBuyout, payBuyout, requestCancel, billingPortal } from './actions';

export const metadata = { title: 'My projects' };
export const dynamic = 'force-dynamic';

export default async function Portal({ searchParams }: { searchParams: { paid?: string } }) {
  const user = await currentUser();
  if (!user) redirect('/login');
  // Only this customer's rows: every query is filtered by their Firebase uid.
  const [profile, projectRows, payments, changes, codes, cancels] = await Promise.all([
    getRow('profiles', user.id),
    findRows('projects', 'customer_id', user.id),
    findRows('payments', 'customer_id', user.id),
    findRows('change_requests', 'customer_id', user.id),
    findRows('code_requests', 'customer_id', user.id),
    findRows('cancellations', 'customer_id', user.id),
  ]);
  const of = (list: Row[], id: string) => list.filter(r => r.project_id === id);
  const projects = projectRows.sort(newest).map(p => ({
    ...p, payments: of(payments, p.id), change_requests: of(changes, p.id), code_requests: of(codes, p.id), cancellations: of(cancels, p.id),
  }));

  return (
    <div className="wrap">
      <div className="page-head" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div><h1>My projects</h1><p>Signed in as {profile?.email || user.email}.</p></div>
        <div className="btns">
          {profile?.stripe_customer_id && <form action={billingPortal}><button className="btn btn-ghost btn-sm">Update card and invoices</button></form>}
          <form action="/auth/signout" method="post"><button className="btn btn-ghost btn-sm">Sign out</button></form>
        </div>
      </div>
      {searchParams.paid && <p className="form-msg ok">Payment received. Thank you! It can take a minute to show up below.</p>}
      {!projects?.length && (
        <div className="app-panel"><div className="empty-art"><EmptyArt /></div><h2 style={{ fontSize: 24 }}>No projects yet</h2><p className="muted" style={{ margin: '8px 0 16px' }}>Send us your idea and it will show up here.</p><Link className="btn btn-primary" href="/request">Start a request</Link></div>
      )}
      {projects?.map(p => <ProjectPanel key={p.id} p={p} />)}
    </div>
  );
}

function ProjectPanel({ p }: { p: any }) {
  const plan = PLANS[p.plan as PlanId];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const changes = [...p.change_requests].sort((a: any, b: any) => +new Date(b.created_at) - +new Date(a.created_at));
  const pays = [...p.payments].sort((a: any, b: any) => +new Date(b.created_at) - +new Date(a.created_at));
  const thisMonth = changes.filter((c: any) => new Date(c.created_at) >= monthStart);
  const used = thisMonth.filter((c: any) => c.included).length;
  const urgentUsed = thisMonth.filter((c: any) => c.urgent_included).length;
  const code = p.code_requests.find((c: any) => c.status === 'pending' || c.status === 'approved');
  const cancel = p.cancellations.find((c: any) => c.status === 'pending');
  const failed = pays.find((x: any) => x.status === 'failed');
  const active = ['building', 'live', 'maintenance'].includes(p.status);
  const needsPayment = !p.stripe_subscription_id && p.stage >= 2 && p.status === 'building';
  const minEnd = new Date(new Date(p.created_at).getTime() + plan.minMonths * 30 * 86400000);
  const id = <input type="hidden" name="projectId" value={p.id} />;

  return (
    <article className="app-panel">
      <div className="app-head">
        <div><h2>{p.name}</h2><p className="muted">Tracking code {p.tracking}. {p.type} on the {plan.name} plan.</p></div>
        <Pill map={STATUS} k={p.status} />
      </div>
      <ol className="timeline">{STAGES.map((s, i) => <li key={s} className={i < p.stage || p.stage === 6 ? 'done' : i === p.stage ? 'current' : ''}>{s}</li>)}</ol>

      {needsPayment && (
        <div className="notice" style={{ background: 'var(--brand-soft)' }}>
          <strong>Your quote is ready.</strong> {money(p.quote_cents)} due today, then {planPrice(plan)}. We start designing as soon as it’s paid.
          <form action={startPlan} style={{ marginTop: 12 }}>{id}<button className="btn btn-primary btn-sm">Approve quote and pay</button></form>
        </div>
      )}
      {failed && <div className="notice" style={{ background: 'var(--bad-soft)' }}>A payment of {money(failed.amount_cents)} didn’t go through on {fdate(failed.created_at)}. Use “Update card and invoices” above to fix it.</div>}
      {p.status === 'closing' && p.offline_at && <div className="notice">Your project goes offline on {fdate(p.offline_at)}. We’ll email you an export of your content and data before then.</div>}
      {cancel && <div className="notice">We received your cancellation request. We’ll confirm by email.</div>}
      {code?.status === 'pending' && <div className="notice" style={{ background: 'var(--brand-soft)' }}>Your code buyout request ({money(code.price_cents)}) is being reviewed.</div>}
      {code?.status === 'approved' && (
        <div className="notice" style={{ background: 'var(--brand-soft)' }}>Your code buyout is approved: {money(code.price_cents)}.
          <form action={payBuyout} style={{ marginTop: 12 }}>{id}<button className="btn btn-primary btn-sm">Pay and get my code</button></form>
        </div>
      )}

      <div className="app-grid">
        <div>
          <h3>This month</h3>
          {p.status === 'maintenance' ? <p>Maintenance only ({money(MAINTENANCE_CENTS)}/week): changes are billed per change.</p>
            : <p>Included changes used: <strong>{used} of {plan.changes}</strong></p>}
          {plan.urgent > 0 && p.status !== 'maintenance' && <p>Included urgent fixes used: <strong>{urgentUsed} of {plan.urgent}</strong></p>}
          {p.addons.length > 0 && <p className="muted" style={{ fontSize: 15 }}>Add-ons: {p.addons.join(', ')}</p>}
        </div>
        <div>
          <h3>Manage your project</h3>
          {active && (
            <details className="act"><summary>Request a change</summary>
              <form action={requestChange}>{id}
                <div className="field"><label>Type of change</label><select name="kind"><option value="small">Small: text, image or color ($15)</option><option value="medium">Medium: new page or section ($40)</option><option value="large">Large: new feature (quoted)</option></select></div>
                <div className="field"><label>How fast do you need it?</label><select name="urgency"><option value="normal">Normal</option><option value="urgent">Urgent: within 24 hours (+$35)</option><option value="emergency">Emergency: within 4 hours (+$75)</option></select></div>
                <div className="field"><label>What should we change?</label><textarea name="description" required style={{ minHeight: 90 }} /></div>
                <p className="muted" style={{ fontSize: 14, marginBottom: 12 }}>Included changes are used first. Anything beyond your plan is added to your next invoice once it’s done.</p>
                <button className="btn btn-primary btn-sm">Send change request</button>
              </form>
            </details>
          )}
          {active && !code && (
            <details className="act"><summary>Buy the code ({money(plan.buyoutCents)})</summary>
              <form action={requestBuyout}>{id}<p className="muted" style={{ fontSize: 15, marginBottom: 12 }}>Get the full code and database handed over. Your subscription ends after the handover, and the badge stays.</p><button className="btn btn-primary btn-sm">Send buyout request</button></form>
            </details>
          )}
          {['building', 'live'].includes(p.status) && !cancel && (
            <details className="act"><summary>Cancel plan</summary>
              <form action={requestCancel}>{id}
                <label className="choice"><input type="radio" name="option" value="maintenance" defaultChecked /><span className="ct"><b>Keep it online</b><span>Maintenance only, pay per change.</span></span><span className="cp">{money(MAINTENANCE_CENTS)}/week</span></label>
                <label className="choice"><input type="radio" name="option" value="buyout" /><span className="ct"><b>Buy the code</b><span>Full code and database handed over.</span></span><span className="cp">{money(plan.buyoutCents)}</span></label>
                <label className="choice"><input type="radio" name="option" value="shutdown" /><span className="ct"><b>Shut it down</b><span>Goes offline 14 days after we confirm.</span></span><span className="cp">$0</span></label>
                {plan.minMonths > 0 && Date.now() < +minEnd && <p className="notice" style={{ margin: '12px 0 0' }}>Your plan has a {plan.minMonths}-month minimum term ending {fdate(minEnd)}. Cancelling earlier may include the remaining months.</p>}
                <p className="muted" style={{ fontSize: 14, margin: '12px 0' }}>You’ll get an export of your content and data either way.</p>
                <button className="btn btn-danger btn-sm">Send cancellation request</button>
              </form>
            </details>
          )}
        </div>
      </div>

      <h3>Change requests</h3>
      {changes.length ? (
        <div className="table-wrap"><table><thead><tr><th>Date</th><th>Request</th><th>Type</th><th className="num">Cost</th><th>Status</th></tr></thead><tbody>
          {changes.map((c: any) => <tr key={c.id}><td>{fdate(c.created_at)}</td><td>{c.description}</td><td>{CH_TYPE[c.kind]}{c.urgency !== 'normal' ? `, ${URG[c.urgency].toLowerCase()}` : ''}</td><td className="num">{c.price_cents === null ? 'Quoted' : c.price_cents === 0 ? 'Included' : money(c.price_cents)}</td><td><Pill map={CH} k={c.status} /></td></tr>)}
        </tbody></table></div>
      ) : <p className="empty">No change requests yet.</p>}

      <h3>Payments</h3>
      {pays.length ? (
        <div className="table-wrap"><table><thead><tr><th>Date</th><th>Description</th><th className="num">Amount</th><th>Status</th></tr></thead><tbody>
          {pays.map((x: any) => <tr key={x.id}><td>{fdate(x.created_at)}</td><td>{x.description}</td><td className="num">{money(x.amount_cents)}</td><td><Pill map={PAY} k={x.status} /></td></tr>)}
        </tbody></table></div>
      ) : <p className="empty">No payments yet. Your first invoice comes with your quote.</p>}
      {p.code_requests.some((c: any) => c.status === 'paid') && <p className="muted"><Pill map={CODE} k="paid" /> Code buyout complete.</p>}
    </article>
  );
}
