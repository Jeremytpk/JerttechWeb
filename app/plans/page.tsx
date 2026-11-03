import Link from 'next/link';
import { PlansArt } from '@/components/Illustrations';
import { CompareTable, AddonTable } from '@/components/PlanTables';
export const metadata = { title: 'Plans and pricing' };

export default function PlansPage() {
  return (
    <div className="wrap">
      <div className="page-head has-art"><div><h1>Plans and pricing</h1><p>Every plan includes hosting, maintenance and monthly changes. Plans and prices are the same whether you want an app or a website.</p></div><PlansArt /></div>
      <CompareTable />
      <div className="sub"><h2>Extra changes and fixes</h2>
        <div className="table-wrap"><table>
          <thead><tr><th>Service</th><th className="num">Price</th></tr></thead>
          <tbody>
            <tr><td>Small change (text, image, color)</td><td className="num">$15</td></tr>
            <tr><td>Medium change (new page or section)</td><td className="num">$40</td></tr>
            <tr><td>Large change (new feature)</td><td className="num">Quoted</td></tr>
            <tr><td>Urgent fix (within 24 hours)</td><td className="num">$35</td></tr>
            <tr><td>Emergency fix (within 4 hours)</td><td className="num">$75</td></tr>
          </tbody>
        </table></div>
      </div>
      <div className="sub"><h2>Add-ons</h2>
        <AddonTable />
        <p className="muted" style={{ marginTop: 12, fontSize: 15 }}>Business customers get the brand board and one-store publishing free, plus 20% off every other add-on.</p>
      </div>
      <div className="sub prose"><h2>If you cancel</h2>
        <p>You can keep your project online with our maintenance-only plan for $2.99 a week, buy the code, or let it go offline after a 14-day grace period. Whatever you choose, you get an export of your content and data.</p>
        <p>Standard has a 3-month minimum term. Pro and Business have a 6-month minimum term. The code belongs to JertTech unless you buy it, and the “Powered by JertTech” badge stays on every project.</p>
      </div>
      <div style={{ padding: '28px 0 20px' }}><Link className="btn btn-primary" href="/request">Start your request</Link></div>
    </div>
  );
}
