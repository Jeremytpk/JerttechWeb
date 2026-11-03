import type { CSSProperties } from 'react';
const d = (s: string) => ({ '--d': s } as CSSProperties);
const g = (s: string) => ({ '--g': s } as CSSProperties);

export default function PhoneMockup() {
  return (
    <div className="build-demo" aria-label="Example: an app moving from request to live">
      <div className="phone" aria-hidden="true">
        <div className="screen fh">
          <div className="fh-status"><span>9:41</span><span className="fh-island" /><span>100%</span></div>
          <div className="fh-head rv" style={d('.3s')}><div><small>Good morning, Andre</small><b>Fade House</b></div><div className="fh-me">A</div></div>
          <div className="rv" style={d('.8s')}>
            <div className="fh-lbl"><span>Pick your barber</span><em>See all</em></div>
            <div className="fh-barbers">
              <span className="on"><i style={g('linear-gradient(135deg,#6D5DFC,#3B82F6)')}>M</i>Marcus</span>
              <span><i style={g('linear-gradient(135deg,#10B981,#0EA5A4)')}>J</i>Jay</span>
              <span><i style={g('linear-gradient(135deg,#F472B6,#E11D48)')}>N</i>Nia</span>
              <span><i style={g('linear-gradient(135deg,#F59E0B,#EA580C)')}>L</i>Leo</span>
            </div>
          </div>
          <div className="rv" style={d('1.3s')}>
            <div className="fh-lbl"><span>Service</span></div>
            <div className="fh-svc">
              <div className="on"><span>Skin fade<small>30 min</small></span><b>$35</b></div>
              <div><span>Beard trim<small>15 min</small></span><b>$20</b></div>
              <div><span>Cut and beard<small>45 min</small></span><b>$50</b></div>
            </div>
          </div>
          <div className="rv" style={d('1.9s')}>
            <div className="fh-lbl"><span>Today</span><em>Tue, Nov 3</em></div>
            <div className="fh-slots"><span>10:00</span><span className="on">11:30</span><span>2:15</span><span>4:00</span></div>
          </div>
          <div className="fh-cta rv" style={d('2.6s')}>Book 11:30 with Marcus for $35</div>
          <div className="fh-tabs rv" style={d('.5s')}>
            <span className="on"><svg viewBox="0 0 24 24"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg></span>
            <span><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></svg></span>
            <span><svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></svg></span>
            <span><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg></span>
          </div>
          <div className="fh-badge">Powered by <b>JertTech</b></div>
        </div>
      </div>
      <ol className="tracker">
        {[['.3s', 'Request received'], ['.9s', 'Quote sent'], ['1.5s', 'Designing'], ['2.2s', 'Building'], ['2.9s', 'Testing'], ['3.5s', 'Live']].map(([t, l]) => (
          <li key={l} style={d(t)}><span className="dot" style={d(t)} />{l}</li>
        ))}
      </ol>
    </div>
  );
}
