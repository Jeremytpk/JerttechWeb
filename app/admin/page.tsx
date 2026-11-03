import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { allRows, newest, type Row } from '@/lib/db';
import { PLANS, STAGES, MAINTENANCE_CENTS, money, monthlyCents, type PlanId } from '@/lib/pricing';
import { Pill, STATUS, PAY, CH, CODE, CH_TYPE, URG, CANCEL_OPT, fdate } from '@/lib/labels';
import { setStage, setQuote, setChangeStatus, decideCode, processCancel, setProjectStatus, setRole } from './actions';

export const metadata = { title: 'Admin', robots: { index: false } };
export const dynamic = 'force-dynamic';

const TABS = [['overview', 'Overview'], ['builds', 'Projects'], ['customers', 'Users'], ['payments', 'Payments'], ['changes', 'Change requests'], ['code', 'Code requests'], ['cancels', 'Cancellations']] as const;

export default async function Admin({ searchParams }: { searchParams: { tab?: string } }) {
  const me = await requireAdmin();
  if (!me) redirect('/');
  const tab = TABS.some(t => t[0] === searchParams.tab) ? searchParams.tab! : 'overview';
  const [profiles, projectRows, paymentRows, changeRows, codeRows, cancelRows, activityRows] = await Promise.all(
    ['profiles', 'projects', 'payments', 'change_requests', 'code_requests', 'cancellations', 'activity'].map(allRows),
  );
  // Join in memory: each row gets its project, and each project its customer.
  const people = new Map(profiles.map(p => [p.id, p]));
  const projects: any[] = projectRows.sort(newest).map(p => ({ ...p, profiles: people.get(p.customer_id) }));
  const byId = new Map(projects.map(p => [p.id, p]));
  const join = (list: Row[], limit?: number): any[] => list.sort(newest).slice(0, limit).map(r => ({ ...r, projects: byId.get(r.project_id) }));
  const customers: any[] = profiles.sort(newest);
  const payments = join(paymentRows, 300);
  const changes = join(changeRows, 300);
  const codes = join(codeRows);
  const cancels = join(cancelRows);
  const activity: any[] = activityRows.sort(newest).slice(0, 15);

  const counts = {
    builds: projects.filter((p: any) => p.status === 'building').length,
    changes: changes.filter((c: any) => c.status === 'new' || c.status === 'progress').length,
    code: codes.filter((c: any) => c.status === 'pending').length,
    cancels: cancels.filter((c: any) => c.status === 'pending').length,
    payments: payments.filter((p: any) => p.status === 'failed').length,
  } as Record<string, number>;

  return (
    <div className="wrap">
      <div className="page-head" style={{ paddingBottom: 18 }}><h1>Admin dashboard</h1></div>
      <div className="tabs" role="tablist">
        {TABS.map(([k, label]) => (
          <Link key={k} href={`/admin?tab=${k}`} role="tab" aria-selected={tab === k}>
            {label}{counts[k] ? <span className="count">{counts[k]}</span> : null}
          </Link>
        ))}
      </div>
      {tab === 'overview' && <Overview projects={projects} payments={payments} counts={counts} activity={activity} />}
      {tab === 'builds' && <Projects projects={projects} />}
      {tab === 'customers' && <Customers customers={customers} projects={projects} payments={payments} me={me.id} />}
      {tab === 'payments' && <Payments payments={payments} />}
      {tab === 'changes' && <Changes changes={changes} />}
      {tab === 'code' && <Codes codes={codes} />}
      {tab === 'cancels' && <Cancels cancels={cancels} />}
    </div>
  );
}

const Hidden = ({ id }: { id: string }) => <input type="hidden" name="id" value={id} />;

function Overview({ projects, payments, counts, activity }: any) {
  const subs = projects.filter((p: any) => ['building', 'live'].includes(p.status) && p.stripe_subscription_id);
  const maint = projects.filter((p: any) => p.status === 'maintenance').length;
  const mrr = subs.reduce((s: number, p: any) => s + monthlyCents(PLANS[p.plan as PlanId]), 0) + Math.round(maint * MAINTENANCE_CENTS * 52 / 12);
  const m0 = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const collected = payments.filter((p: any) => p.status === 'paid' && new Date(p.created_at) >= m0).reduce((s: number, p: any) => s + p.amount_cents, 0);
  return (
    <>
      <div className="stats">
        <div className="stat"><b>{subs.length}</b><span>Paying subscriptions{maint ? `, plus ${maint} maintenance only` : ''}</span></div>
        <div className="stat s-ok"><b>{money(Math.round(mrr / 100) * 100)}</b><span>Monthly recurring revenue (estimated)</span></div>
        <div className="stat s-ok"><b>{money(collected)}</b><span>Collected this month</span></div>
        <div className="stat s-warn"><b>{counts.builds}</b><span>Projects being built</span></div>
        <div className="stat s-warn"><b>{counts.changes}</b><span>Open change requests</span></div>
        <div className="stat s-warn"><b>{counts.code}</b><span>Code buyout requests</span></div>
        <div className="stat s-bad"><b>{counts.cancels}</b><span>Cancellation requests</span></div>
        <div className="stat s-bad"><b>{counts.payments}</b><span>Failed payments</span></div>
      </div>
      <div className="toolbar"><h2>Recent activity</h2></div>
      {activity.length ? <ul className="activity">{activity.map((a: any) => <li key={a.id}><span>{a.message}</span><time>{fdate(a.created_at)}</time></li>)}</ul> : <p className="empty">No activity yet.</p>}
    </>
  );
}

function Projects({ projects }: any) {
  if (!projects.length) return <p className="empty">No projects yet. Requests from the website show up here.</p>;
  return (
    <>
      <div className="toolbar"><h2>Projects and build progress</h2><span className="muted" style={{ fontSize: 14 }}>Set the quote, then move the project to “Quote sent” so the customer can pay.</span></div>
      <div className="table-wrap"><table><thead><tr><th>Code</th><th>Project</th><th>Customer</th><th>Plan</th><th>Quote due at start</th><th>Stage</th><th>Status</th></tr></thead><tbody>
        {projects.map((p: any) => (
          <tr key={p.id}>
            <td><strong>{p.tracking}</strong><div className="muted" style={{ fontSize: 13 }}>{fdate(p.created_at)}</div></td>
            <td>{p.name}<div className="muted" style={{ fontSize: 13, maxWidth: '26em' }}>{p.idea}</div>{p.addons.length > 0 && <div className="muted" style={{ fontSize: 13 }}>Add-ons: {p.addons.join(', ')}</div>}</td>
            <td>{p.profiles?.full_name}<div className="muted" style={{ fontSize: 13 }}>{p.profiles?.email}</div></td>
            <td>{PLANS[p.plan as PlanId].name}<div className="muted" style={{ fontSize: 13 }}>{p.type}</div></td>
            <td>{p.stripe_subscription_id ? <><Pill map={PAY} k="paid" /> {money(p.quote_cents)}</> : (
              <form action={setQuote} className="inline"><Hidden id={p.id} /><input type="number" name="dollars" min="0" step="0.01" defaultValue={(p.quote_cents / 100).toFixed(2)} aria-label="Quote in dollars" /><button className="btn btn-ghost btn-sm">Save</button></form>
            )}</td>
            <td><form action={setStage} className="inline"><Hidden id={p.id} />
              <select name="stage" defaultValue={p.stage} aria-label="Stage">{STAGES.map((s, i) => <option key={s} value={i}>{s}</option>)}</select>
              <button className="btn btn-ghost btn-sm">Save</button></form></td>
            <td><form action={setProjectStatus} className="inline"><Hidden id={p.id} />
              <select name="status" defaultValue={p.status} aria-label="Status">{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v[0]}</option>)}</select>
              <button className="btn btn-ghost btn-sm">Save</button></form></td>
          </tr>
        ))}
      </tbody></table></div>
    </>
  );
}

function Customers({ customers, projects, payments, me }: any) {
  if (!customers.length) return <p className="empty">No users yet.</p>;
  const admins = customers.filter((c: any) => c.role === 'admin').length;
  return (
    <>
      <div className="toolbar"><h2>Users</h2><span className="muted" style={{ fontSize: 14 }}>{customers.length} {customers.length === 1 ? 'person' : 'people'}, {admins} with admin access. Turn on Admin to give someone access to this dashboard.</span></div>
      <div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Projects</th><th className="num">Total paid</th><th>Since</th><th>Admin</th></tr></thead><tbody>
        {customers.map((c: any) => {
          const mine = projects.filter((p: any) => p.customer_id === c.id);
          const paid = payments.filter((x: any) => x.status === 'paid' && mine.some((p: any) => p.id === x.project_id)).reduce((s: number, x: any) => s + x.amount_cents, 0);
          const isAdmin = c.role === 'admin';
          const self = c.id === me;
          return <tr key={c.id}><td><strong>{c.full_name || 'No name'}</strong>{self && <div className="muted" style={{ fontSize: 13 }}>You</div>}</td><td>{c.email}</td><td>{c.phone || <span className="muted">None</span>}</td>
            <td>{mine.length ? mine.map((p: any) => <div key={p.id}>{p.name} <Pill map={STATUS} k={p.status} /></div>) : <span className="muted">None</span>}</td><td className="num">{money(paid)}</td><td>{fdate(c.created_at)}</td>
            <td><form action={setRole}><Hidden id={c.id} /><input type="hidden" name="role" value={isAdmin ? 'customer' : 'admin'} />
              <button className="switch" role="switch" aria-checked={isAdmin} disabled={self}
                aria-label={`Admin access for ${c.full_name || c.email}`} title={self ? 'You can’t remove your own admin access' : undefined}>
                <span className="track" aria-hidden="true" />{isAdmin ? 'On' : 'Off'}
              </button></form></td></tr>;
        })}
      </tbody></table></div>
    </>
  );
}

function Payments({ payments }: any) {
  if (!payments.length) return <p className="empty">No payments yet. Stripe payments show up here automatically.</p>;
  return (
    <>
      <div className="toolbar"><h2>Payments</h2><a className="btn btn-ghost btn-sm" href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer">Open Stripe dashboard</a></div>
      <div className="table-wrap"><table><thead><tr><th>Date</th><th>Customer</th><th>Project</th><th>Description</th><th className="num">Amount</th><th>Status</th></tr></thead><tbody>
        {payments.map((x: any) => <tr key={x.id}><td>{fdate(x.created_at)}</td><td>{x.projects?.profiles?.full_name}</td><td>{x.projects?.name}</td><td>{x.description}</td><td className="num">{money(x.amount_cents)}</td><td><Pill map={PAY} k={x.status} /></td></tr>)}
      </tbody></table></div>
    </>
  );
}

function Changes({ changes }: any) {
  if (!changes.length) return <p className="empty">No change requests yet.</p>;
  return (
    <div className="table-wrap"><table><thead><tr><th>Date</th><th>Project</th><th>Request</th><th>Type</th><th>Billing</th><th>Status</th></tr></thead><tbody>
      {changes.map((c: any) => (
        <tr key={c.id}><td>{fdate(c.created_at)}</td><td>{c.projects?.name}</td><td>{c.description}</td>
          <td>{CH_TYPE[c.kind]}{c.urgency !== 'normal' && <div><span className="pill p-bad">{URG[c.urgency]}</span></div>}</td>
          <td>{c.price_cents === null ? 'Needs a quote' : c.price_cents === 0 ? 'Included in plan' : money(c.price_cents)}{c.billed && <div className="muted" style={{ fontSize: 13 }}>Added to next invoice</div>}</td>
          <td><form action={setChangeStatus} className="inline"><Hidden id={c.id} />
            {c.price_cents === null && <input type="number" name="dollars" min="0" step="0.01" placeholder="Price $" aria-label="Price in dollars" />}
            <select name="status" defaultValue={c.status} aria-label="Status">{Object.entries(CH).map(([k, v]) => <option key={k} value={k}>{v[0]}</option>)}</select>
            <button className="btn btn-ghost btn-sm">Save</button></form></td></tr>
      ))}
    </tbody></table></div>
  );
}

function Codes({ codes }: any) {
  if (!codes.length) return <p className="empty">No code buyout requests yet.</p>;
  return (
    <div className="table-wrap"><table><thead><tr><th>Date</th><th>Customer</th><th>Project</th><th className="num">Price</th><th>Status</th><th /></tr></thead><tbody>
      {codes.map((r: any) => (
        <tr key={r.id}><td>{fdate(r.created_at)}</td><td>{r.projects?.profiles?.full_name}</td><td>{r.projects?.name}</td><td className="num">{money(r.price_cents)}</td><td><Pill map={CODE} k={r.status} /></td>
          <td>{r.status === 'pending' && <div className="btns">
            <form action={decideCode}><Hidden id={r.id} /><input type="hidden" name="decision" value="approve" /><button className="btn btn-primary btn-sm">Approve</button></form>
            <form action={decideCode}><Hidden id={r.id} /><input type="hidden" name="decision" value="decline" /><button className="btn btn-ghost btn-sm">Decline</button></form>
          </div>}</td></tr>
      ))}
    </tbody></table></div>
  );
}

function Cancels({ cancels }: any) {
  if (!cancels.length) return <p className="empty">No cancellations. Nice.</p>;
  return (
    <div className="table-wrap"><table><thead><tr><th>Date</th><th>Customer</th><th>Project</th><th>Customer’s choice</th><th>Status</th><th /></tr></thead><tbody>
      {cancels.map((r: any) => (
        <tr key={r.id}><td>{fdate(r.created_at)}</td><td>{r.projects?.profiles?.full_name}</td><td>{r.projects?.name}</td><td>{CANCEL_OPT[r.option]}</td>
          <td>{r.status === 'pending' ? <span className="pill p-warn">Pending</span> : <span className="pill p-ok">Processed</span>}</td>
          <td>{r.status === 'pending' && <form action={processCancel}><Hidden id={r.id} /><button className="btn btn-primary btn-sm">Process</button></form>}</td></tr>
      ))}
    </tbody></table></div>
  );
}
