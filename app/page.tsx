import Link from 'next/link';
import PhoneMockup from '@/components/PhoneMockup';
import Work from '@/components/Work';
import { PriceRail } from '@/components/PlanTables';
import { BackendArt } from '@/components/Illustrations';

const FAQ = [
  ['Do you build websites too?', 'Yes. Websites use the same plans and prices as apps, with hosting, maintenance and monthly changes included. App Store and Google Play publishing only applies to apps.'],
  ['Who owns my app or website?', 'Your content and your data are always yours. The code belongs to JertTech while you’re on a plan, and you can buy it at any time. Code buyouts start at $499.'],
  ['What happens if I cancel?', 'You choose: keep it online for $2.99 a week, buy the code, or let it go offline after 14 days. Either way, you get a copy of your data. Standard, Pro and Business have minimum terms.'],
  ['Can my app go on the App Store or Google Play?', 'Yes, on Standard and above. You create your own developer accounts (Apple charges a yearly fee and Google a one-time fee), and our publishing package walks you through the rest.'],
  ['Why is there a “Powered by JertTech” badge?', 'Every JertTech app and website shows a small badge that links back to us. It’s part of how we keep prices this low.'],
  ['How are changes counted?', 'Small changes (text, images, colors) and medium changes (a new page or section) each use one included change. New features are quoted separately. Unused changes don’t carry over, except on Business.'],
];

export default function Home() {
  return (
    <>
      <div className="wrap">
        <div className="hero">
          <div>
            <h1>Your app or website, built and run for you.</h1>
            <p className="lede">Tell us what you want: an app, a website, or both. We design it, build the backend and database, host it, and keep it working, so you never touch the technical side. Apps and websites use the same plans, starting at $15 a week.</p>
            <div className="actions">
              <Link className="btn btn-primary" href="/request">Start your request</Link>
              <Link className="btn btn-ghost" href="/plans">Compare plans</Link>
            </div>
            <p className="fine">From the team behind Moova Africa, EliteReply, DriverRoom and LitChat, all live today.</p>
          </div>
          <PhoneMockup />
        </div>
      </div>

      <section className="block">
        <div className="wrap">
          <div className="section-head"><h2>From idea to launch in four steps</h2></div>
          <ol className="steps">
            <li><div className="n">1</div><h3>Send your idea</h3><p>Fill in a short request with your idea, the plan you want and any add-ons.</p></li>
            <li><div className="n">2</div><h3>Get your quote</h3><p>We review it, confirm what’s included and send you a final price.</p></li>
            <li><div className="n">3</div><h3>Watch it get built</h3><p>Follow every stage, from design to testing, in your account.</p></li>
            <li><div className="n">4</div><h3>Launch and relax</h3><p>Your app or website goes live. We host it, fix it and make your monthly changes.</p></li>
          </ol>
        </div>
      </section>

      <section className="block" style={{ paddingTop: 24 }}>
        <div className="wrap">
          <div className="section-head"><h2>Apps we’ve built and shipped</h2><p>Real apps with real backends, live today on the App Store, Google Play and the web.</p></div>
          <Work />
        </div>
      </section>

      <section className="block" style={{ paddingTop: 24 }}>
        <div className="wrap">
          <div className="section-head"><h2>Pick a plan that fits your idea</h2><p>The same plans and prices work for apps and websites. Start small and upgrade any time.</p></div>
          <PriceRail />
          <p style={{ marginTop: 18 }}><Link href="/plans">See everything each plan includes</Link></p>
        </div>
      </section>

      <section className="block">
        <div className="wrap diff">
          <div className="section-head" style={{ marginBottom: 0 }}><h2>More than a DIY builder</h2><p>DIY tools leave you alone with the hard parts. We take care of them.</p><div className="side-art"><BackendArt /></div></div>
          <dl>
            <div><dt>The backend is included</dt><dd>Logins, saved data, payments: we build and run the parts that usually trip people up.</dd></div>
            <div><dt>Changes are part of your plan</dt><dd>Every plan includes monthly changes, and extra ones have fixed, upfront prices.</dd></div>
            <div><dt>You’re never stuck</dt><dd>Switch plans, keep your project online for $2.99 a week, or buy the code outright.</dd></div>
            <div><dt>A real person to talk to</dt><dd>JertTech is run by Jeremy Topaka. You can always reach the people building your project.</dd></div>
          </dl>
        </div>
      </section>

      <section className="block" style={{ paddingTop: 24 }}>
        <div className="wrap">
          <div className="section-head"><h2>Questions people ask</h2></div>
          <div className="faq">{FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
        </div>
      </section>

      <div className="wrap" style={{ paddingBottom: 24 }}>
        <div className="cta-band">
          <h2>Got an app or website idea? Tell us about it today.</h2>
          <Link className="btn" href="/request">Start your request</Link>
        </div>
      </div>
    </>
  );
}
