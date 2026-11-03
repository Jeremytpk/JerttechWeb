import Link from 'next/link';
import { AboutArt, TeamArt } from '@/components/Illustrations';
export const metadata = {
  title: 'About',
  description: 'JertTech designs, builds, hosts and maintains apps and websites for you, backend and database included. Founded by Jeremy Topaka.',
};

export default function AboutPage() {
  return (
    <>
      <div className="wrap">
        <div className="page-head has-art">
          <div>
          <h1>About JertTech</h1>
          <p>JertTech builds tech solutions for real-world needs. When a business, a community or a team has a problem to solve, we create the app or website that solves it. Then we host it and keep it working, all for one weekly or monthly price.</p>
          </div>
          <AboutArt />
        </div>
      </div>

      <section className="block" style={{ paddingTop: 24 }}>
        <div className="wrap diff">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <h2>What we do</h2>
            <p>We start with the real need, not the technology. Then one team handles the whole solution, from the first sketch to the day it goes live and every month after.</p>
          </div>
          <dl>
            <div><dt>Understand the need</dt><dd>We learn how the problem shows up day to day, and who the solution has to work for.</dd></div>
            <div><dt>Design</dt><dd>We plan the screens, the flow and the look, so the solution fits the people using it.</dd></div>
            <div><dt>Build</dt><dd>Mobile apps and websites, with logins, saved data, payments, bookings and notifications.</dd></div>
            <div><dt>Launch and maintain</dt><dd>We put it online, guide apps onto the App Store and Google Play, then keep it running and make your monthly changes.</dd></div>
          </dl>
        </div>
      </section>

      <section className="block" style={{ paddingTop: 24 }}>
        <div className="wrap diff">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <h2>Why we work this way</h2>
            <p>DIY builders leave you alone with the hard parts. Agencies charge a large fee up front and then step away. We built JertTech to sit in between.</p>
          </div>
          <dl>
            <div><dt>Low, predictable prices</dt><dd>Plans start at $15 a week, and extra changes have fixed, upfront prices.</dd></div>
            <div><dt>The backend is included</dt><dd>Databases, sign-in and payments are part of what we build and run for you.</dd></div>
            <div><dt>You can see the progress</dt><dd>Your account shows every stage, from request to design, building, testing and launch.</dd></div>
            <div><dt>You’re never locked in</dt><dd>Your content and data are always yours, and you can buy the code at any time.</dd></div>
          </dl>
        </div>
      </section>

      <section className="block" style={{ paddingTop: 24 }}>
        <div className="wrap"><div className="page-head has-art" style={{ padding: 0 }}>
          <div>
            <div className="section-head">
              <h2>Who’s behind it</h2>
              <p>JertTech was founded and is run by Jeremy Topaka. The same team built and shipped Moova Africa, EliteReply, DriverRoom and LitChat, all live today. When you work with JertTech, you talk directly to the people building your project.</p>
            </div>
            <p><Link href="/work">See our work</Link></p>
          </div>
          <TeamArt />
        </div></div>
      </section>

      <div className="wrap" style={{ paddingBottom: 24 }}>
        <div className="cta-band">
          <h2>Have a problem that tech could solve? Tell us about it.</h2>
          <Link className="btn" href="/request">Start your request</Link>
        </div>
      </div>
    </>
  );
}
