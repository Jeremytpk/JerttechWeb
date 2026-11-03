import type { CSSProperties } from 'react';

export const WORK = [
  { name: 'Moova Africa', logo: '/moova.png', tag: 'Faster than cargo, safer than the post office', cat: 'Travel', color: '#2D6FD0',
    url: 'https://apps.apple.com/us/app/moova-africa/id6757997187',
    desc: 'A peer-to-peer shipping app connecting the African diaspora with trusted travelers who have spare luggage space, making it cheaper to send packages between the USA and Africa.',
    feats: ['Shipping from about $20 per kg', '6-digit code to confirm each delivery', 'Real-time package tracking', 'Travelers earn money and manage their routes'] },
  { name: 'EliteReply', logo: '/elitereply.png', tag: 'The diaspora’s hub for Africa', cat: 'Productivity', color: '#45B04E',
    url: 'https://apps.apple.com/us/app/elitereply/id6754297096',
    desc: 'A super-app that connects the diaspora with services, local businesses and trusted information across Africa, guided by Jey, a built-in AI assistant.',
    feats: ['AI assistant with handoff to a real agent', 'Marketplace with Stripe and PayPal payments', 'Booking for verified local services', 'Separate dashboards for clients, partners and admins'] },
  { name: 'DriverRoom', logo: '/driverroom.png', tag: 'Fleet access, secured', cat: 'Productivity', color: '#1F9E9E',
    url: 'https://apps.apple.com/us/app/driverroom/id6753841047',
    desc: 'An operations platform for delivery service providers that puts drivers, dispatchers and managers on one secure app.',
    feats: ['Live dispatch dashboard', 'Verified gate codes with route-based access', 'Automatic off-duty after long shifts', 'Secure messaging and safety notices'] },
];

export default function Work() {
  return (
    <div className="work">
      {WORK.map(w => (
        <article key={w.name}>
          <div className="cover" style={{ '--c': w.color } as CSSProperties}><img src={w.logo} alt={`${w.name} logo`} /></div>
          <h3>{w.name}</h3>
          <p className="tagline">{w.tag}</p>
          <div><span className="pill p-neutral">{w.cat}</span> <span className="pill p-ok">Live on the App Store</span></div>
          <p className="desc">{w.desc}</p>
          <ul>{w.feats.map(f => <li key={f}>{f}</li>)}</ul>
          <a className="btn btn-ghost btn-sm" href={w.url} target="_blank" rel="noopener noreferrer">View {w.name} on the App Store</a>
        </article>
      ))}
    </div>
  );
}
