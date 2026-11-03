import Link from 'next/link';
import { PLANS, PLAN_ORDER, ADDONS, money, planPrice, type Plan } from '@/lib/pricing';

export function PriceRail() {
  return (
    <div className="rail">
      {PLAN_ORDER.map(k => { const p = PLANS[k]; return (
        <div key={k} className={k === 'business' ? 'hl' : ''}>
          {k === 'business' && <span className="tag">Best value, monthly</span>}
          <h3>{p.name}</h3>
          <div className="price">{money(p.priceCents)} <small>/ {p.unit}</small></div>
          <p>{p.blurb}</p>
          <Link className={`btn ${k === 'business' ? 'btn-primary' : 'btn-ghost'} btn-sm`} href={`/request?plan=${k}`}>Choose {p.name}</Link>
        </div>
      ); })}
    </div>
  );
}

const ROWS: [string, (p: Plan) => React.ReactNode][] = [
  ['Price', p => <strong>{planPrice(p)}</strong>],
  ['Setup fee', p => p.setupCents ? money(p.setupCents) : (p.id === 'business' ? 'Waived' : 'None')],
  ['Minimum term', p => p.minMonths ? `${p.minMonths} months` : 'None'],
  ['What you get', p => p.features],
  ['Pages', p => p.pages],
  ['Included changes', p => `${p.changes} per month${p.id === 'business' ? ', unused ones roll over 1 month' : ''}`],
  ['Urgent fixes included', p => p.urgent ? `${p.urgent} per month` : 'None'],
  ['Support reply', p => p.support],
  ['Build time', p => p.build],
  ['Hosting and maintenance', p => p.hosting],
  ['App Store and Google Play', p => p.stores],
  ['Free extras', p => p.extras],
  ['Add-on discount', p => p.discount],
  ['Monthly report', p => p.report],
  ['Code buyout', p => money(p.buyoutCents)],
  ['“Powered by JertTech” badge', () => 'Included'],
];

export function CompareTable() {
  const hl = (k: string) => (k === 'business' ? 'hlc' : '');
  return (
    <div className="table-wrap"><table className="compare">
      <thead><tr><th />{PLAN_ORDER.map(k => <th key={k} className={hl(k)}>{PLANS[k].name}</th>)}</tr></thead>
      <tbody>
        {ROWS.map(([label, f]) => (
          <tr key={label}><th scope="row">{label}</th>{PLAN_ORDER.map(k => <td key={k} className={hl(k)}>{f(PLANS[k])}</td>)}</tr>
        ))}
        <tr><th scope="row" />{PLAN_ORDER.map(k => <td key={k} className={hl(k)}><Link className="btn btn-primary btn-sm" href={`/request?plan=${k}`}>Choose {PLANS[k].name}</Link></td>)}</tr>
      </tbody>
    </table></div>
  );
}

export function AddonTable() {
  return (
    <div className="table-wrap"><table>
      <thead><tr><th>Add-on</th><th>What it is</th><th className="num">Price</th><th>Available on</th></tr></thead>
      <tbody>{ADDONS.map(a => (
        <tr key={a.id}><td><strong>{a.name}</strong></td><td>{a.desc}</td><td className="num">{money(a.priceCents)}{a.id === 'domain' ? ' + domain' : ''}</td><td>{a.appsOnly ? 'Apps on Standard and up' : 'All plans'}</td></tr>
      ))}</tbody>
    </table></div>
  );
}
