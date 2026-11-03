/**
 * Brand illustrations. The character follows the JertTech logo: a round head,
 * a curved "swoosh" body and an arm reaching for the amber dot.
 * All colors come from CSS variables, so the art adapts to light and dark mode.
 */

type Arm = 'reach' | 'wave' | 'point' | 'hold';

const ARMS: Record<Arm, string> = {
  reach: 'M4 -80 C18 -92 26 -110 32 -130',
  wave: 'M4 -80 C20 -90 24 -104 22 -122',
  point: 'M4 -78 C18 -82 30 -86 42 -90',
  hold: 'M4 -76 C14 -66 24 -62 36 -64',
};

/** A standing character. Feet sit at (x, y). Faces right unless flipped. */
function Person({ x, y, s = 1, flip = false, arm = 'reach', color = 'var(--brand)' }:
  { x: number; y: number; s?: number; flip?: boolean; arm?: Arm; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`} fill="none" stroke={color} strokeLinecap="round">
      <path d="M-6 -40 L-12 0 M2 -40 L10 0" strokeWidth={11} />
      <path d="M-4 -78 C-12 -64 -14 -54 -12 -44" strokeWidth={9} />
      <path d="M0 -86 C10 -70 8 -54 -2 -40" strokeWidth={22} />
      <path d={ARMS[arm]} strokeWidth={9} />
      <circle cx={-2} cy={-114} r={13} fill={color} stroke="none" />
    </g>
  );
}

/** The amber dot from the logo, gently floating. */
function Dot({ x, y, r = 10 }: { x: number; y: number; r?: number }) {
  return <circle className="float" cx={x} cy={y} r={r} fill="var(--signal)" />;
}

function Blob() {
  return <ellipse cx={180} cy={150} rx={165} ry={112} fill="var(--brand-soft)" />;
}

function Ground({ x1 = 24, x2 = 336 }: { x1?: number; x2?: number }) {
  return <line x1={x1} y1={250} x2={x2} y2={250} stroke="var(--line)" strokeWidth={3} strokeLinecap="round" />;
}

function Svg({ children, w = 360, h = 280 }: { children: React.ReactNode; w?: number; h?: number }) {
  return <svg className="art" viewBox={`0 0 ${w} ${h}`} aria-hidden="true" focusable="false">{children}</svg>;
}

/** About: a real-world place (a shop) connected to the app that serves it. */
export function AboutArt() {
  return (
    <Svg>
      <Blob />
      <Ground />
      {/* storefront */}
      <rect x={36} y={150} width={92} height={100} fill="var(--surface)" stroke="var(--ink)" strokeWidth={3} />
      <path d="M30 132 H134 V154 H30 Z" fill="var(--brand)" />
      <path d="M43 132 V154 M69 132 V154 M95 132 V154 M121 132 V154" stroke="var(--surface)" strokeWidth={9} />
      <rect x={48} y={176} width={30} height={24} rx={3} fill="var(--surface-2)" />
      <rect x={90} y={196} width={26} height={54} rx={3} fill="var(--brand-soft)" stroke="var(--ink)" strokeWidth={2} />
      {/* the connection */}
      <path d="M100 124 C130 46 214 40 246 88" fill="none" stroke="var(--brand)" strokeWidth={3} strokeDasharray="2 9" strokeLinecap="round" />
      {/* phone */}
      <rect x={240} y={92} width={84} height={158} rx={16} fill="var(--surface)" stroke="var(--ink)" strokeWidth={3} />
      <rect x={250} y={108} width={64} height={20} rx={6} fill="var(--brand)" />
      {[146, 172, 198].map(cy => (
        <g key={cy}>
          <circle cx={260} cy={cy} r={7} fill="var(--ok)" />
          <path d={`M256.5 ${cy} l2.5 2.5 l4.5 -5`} fill="none" stroke="var(--surface)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <rect x={273} y={cy - 4} width={38} height={8} rx={4} fill="var(--surface-2)" />
        </g>
      ))}
      <Person x={180} y={250} arm="reach" />
      <Dot x={220} y={104} />
    </Svg>
  );
}

/** About: the JertTech builder and a customer working together. */
export function TeamArt() {
  return (
    <Svg>
      <Blob />
      <Ground />
      {/* chat bubbles */}
      <rect x={74} y={42} width={92} height={46} rx={16} fill="var(--surface)" stroke="var(--ink)" strokeWidth={3} />
      <path d="M100 87 L94 104 L114 88" fill="var(--surface)" stroke="var(--ink)" strokeWidth={3} strokeLinejoin="round" />
      <rect x={96} y={58} width={50} height={8} rx={4} fill="var(--surface-2)" />
      <rect x={96} y={70} width={32} height={8} rx={4} fill="var(--surface-2)" />
      <rect x={196} y={30} width={92} height={46} rx={16} fill="var(--brand)" />
      <path d="M262 74 L268 92 L248 75 Z" fill="var(--brand)" />
      <circle cx={222} cy={53} r={5} fill="var(--brand-ink)" /><circle cx={242} cy={53} r={5} fill="var(--brand-ink)" /><circle cx={262} cy={53} r={5} fill="var(--brand-ink)" />
      {/* table and laptop */}
      <rect x={118} y={222} width={124} height={7} rx={3} fill="var(--ink-2)" />
      <path d="M130 229 V250 M230 229 V250" stroke="var(--ink-2)" strokeWidth={5} strokeLinecap="round" />
      <rect x={140} y={158} width={80} height={56} rx={6} fill="var(--surface)" stroke="var(--ink)" strokeWidth={3} />
      <rect x={148} y={166} width={64} height={12} rx={3} fill="var(--brand)" />
      <rect x={148} y={184} width={40} height={7} rx={3} fill="var(--surface-2)" />
      <rect x={148} y={196} width={52} height={7} rx={3} fill="var(--surface-2)" />
      <path d="M128 214 H232 L226 222 H134 Z" fill="var(--ink)" />
      <Person x={84} y={250} arm="point" />
      <Person x={286} y={250} flip arm="wave" color="var(--ink-2)" />
      <Dot x={182} y={118} r={9} />
    </Svg>
  );
}

/** Home: we run the hard parts (database, servers, settings) for you. */
export function BackendArt() {
  return (
    <Svg>
      <Blob />
      <Ground />
      {/* database */}
      <path d="M196 110 V200 A44 14 0 0 0 284 200 V110" fill="var(--surface)" stroke="var(--ink)" strokeWidth={3} />
      <path d="M196 140 A44 14 0 0 0 284 140 M196 170 A44 14 0 0 0 284 170" fill="none" stroke="var(--ink)" strokeWidth={3} />
      <ellipse cx={240} cy={110} rx={44} ry={14} fill="var(--brand)" stroke="var(--ink)" strokeWidth={3} />
      <circle cx={210} cy={157} r={4} fill="var(--ok)" /><circle cx={210} cy={187} r={4} fill="var(--ok)" />
      {/* gears */}
      <circle cx={140} cy={78} r={24} fill="none" stroke="var(--brand)" strokeWidth={12} strokeDasharray="9 7" />
      <circle cx={140} cy={78} r={15} fill="var(--brand)" />
      <circle cx={140} cy={78} r={6} fill="var(--brand-soft)" />
      <circle cx={180} cy={46} r={14} fill="none" stroke="var(--ink-2)" strokeWidth={9} strokeDasharray="6 5" />
      <circle cx={180} cy={46} r={8} fill="var(--ink-2)" />
      <circle cx={180} cy={46} r={3} fill="var(--brand-soft)" />
      {/* wrench */}
      <path d="M296 70 L322 44" stroke="var(--ink-2)" strokeWidth={8} strokeLinecap="round" />
      <circle cx={326} cy={40} r={10} fill="none" stroke="var(--ink-2)" strokeWidth={6} strokeDasharray="44 20" />
      <Person x={110} y={250} arm="point" />
      <Dot x={300} y={120} r={8} />
    </Svg>
  );
}

/** Work: shipped apps, live and celebrated. */
export function WorkArt() {
  const phone = (bar: string) => (
    <>
      <rect x={-34} y={-70} width={68} height={140} rx={14} fill="var(--surface)" stroke="var(--ink)" strokeWidth={3} />
      <rect x={-25} y={-56} width={50} height={18} rx={5} fill={bar} />
      <rect x={-25} y={-30} width={50} height={26} rx={5} fill="var(--surface-2)" />
      <rect x={-25} y={4} width={36} height={7} rx={3} fill="var(--surface-2)" />
      <rect x={-25} y={17} width={46} height={7} rx={3} fill="var(--surface-2)" />
      <rect x={-25} y={40} width={50} height={16} rx={8} fill={bar} />
    </>
  );
  return (
    <Svg>
      <Blob />
      <Ground />
      <ellipse cx={170} cy={238} rx={96} ry={8} fill="var(--line)" />
      <g transform="translate(112 152) rotate(-12)">{phone('var(--ok)')}</g>
      <g transform="translate(228 152) rotate(12)">{phone('var(--signal)')}</g>
      <g transform="translate(170 140)">{phone('var(--brand)')}</g>
      <Person x={312} y={250} flip arm="reach" s={0.9} />
      <Dot x={60} y={64} r={8} />
      <Dot x={250} y={40} r={11} />
      <circle cx={92} cy={36} r={5} fill="var(--brand)" />
    </Svg>
  );
}

/** Plans: four steps, start small and climb when you're ready. */
export function PlansArt() {
  const steps = [[40, 220], [110, 190], [180, 160], [250, 130]];
  return (
    <Svg>
      <Blob />
      <Ground />
      {steps.map(([x, top], i) => (
        <g key={x}>
          <rect x={x} y={top} width={70} height={250 - top} fill="var(--surface)" stroke="var(--ink)" strokeWidth={3} />
          <rect x={x} y={top} width={70} height={10} fill={i === 3 ? 'var(--signal)' : 'var(--brand)'} />
        </g>
      ))}
      <Person x={213} y={160} s={0.85} arm="reach" />
      <Dot x={252} y={40} r={11} />
    </Svg>
  );
}

/** Request: someone describing the need they want solved. */
export function RequestArt() {
  return (
    <Svg>
      <Blob />
      <Ground />
      <rect x={146} y={46} width={184} height={118} rx={22} fill="var(--surface)" stroke="var(--ink)" strokeWidth={3} />
      <path d="M160 160 L132 188 L190 163" fill="var(--surface)" stroke="var(--ink)" strokeWidth={3} strokeLinejoin="round" />
      <path d="M161 158 H189" stroke="var(--surface)" strokeWidth={5} />
      {/* lightbulb */}
      <circle className="float" cx={196} cy={96} r={22} fill="var(--signal)" />
      <rect x={187} y={120} width={18} height={14} rx={3} fill="var(--ink-2)" />
      <path d="M196 62 V54 M222 72 L228 66 M170 72 L164 66" stroke="var(--signal)" strokeWidth={4} strokeLinecap="round" />
      <rect x={234} y={82} width={78} height={9} rx={4.5} fill="var(--surface-2)" />
      <rect x={234} y={100} width={58} height={9} rx={4.5} fill="var(--surface-2)" />
      <rect x={234} y={118} width={70} height={9} rx={4.5} fill="var(--brand-soft)" />
      <Person x={98} y={250} arm="wave" />
    </Svg>
  );
}

/** Sign in: a sign-in link arriving by email. */
export function LoginArt() {
  return (
    <Svg>
      <Blob />
      <Ground />
      <path d="M150 112 H128 M154 140 H118 M150 168 H132" stroke="var(--brand)" strokeWidth={4} strokeLinecap="round" />
      <rect x={168} y={96} width={156} height={104} rx={12} fill="var(--surface)" stroke="var(--ink)" strokeWidth={3} />
      <path d="M170 100 L246 156 L322 100" fill="none" stroke="var(--ink)" strokeWidth={3} strokeLinejoin="round" />
      <circle cx={246} cy={156} r={16} fill="var(--signal)" />
      <path d="M240 156 a4 4 0 0 1 4 -4 h4 a4 4 0 0 1 0 8 h-2 M252 156 a4 4 0 0 1 -4 4 h-4 a4 4 0 0 1 0 -8 h2" fill="none" stroke="var(--ink)" strokeWidth={2} strokeLinecap="round" transform="rotate(-35 246 156)" />
      <Person x={76} y={250} arm="wave" />
      <Dot x={300} y={62} r={8} />
    </Svg>
  );
}

/** 404: searching for a page that isn't there. */
export function LostArt() {
  return (
    <Svg>
      <Blob />
      <path d="M24 250 H150 M226 250 H336" stroke="var(--line)" strokeWidth={3} strokeLinecap="round" strokeDasharray="10 10" />
      <path d="M155 186 L176 166" stroke="var(--ink)" strokeWidth={8} strokeLinecap="round" />
      <circle cx={192} cy={150} r={24} fill="var(--surface)" stroke="var(--ink)" strokeWidth={6} />
      <text className="float" x={262} y={170} fontSize={110} fontWeight={800} fill="var(--signal)" style={{ fontFamily: 'var(--font-display), system-ui, sans-serif' }}>?</text>
      <Person x={120} y={250} arm="hold" />
    </Svg>
  );
}

/** Portal empty state: an open box, ready for the first project. */
export function EmptyArt() {
  return (
    <svg className="art" viewBox="0 0 240 170" aria-hidden="true" focusable="false">
      <ellipse cx={120} cy={110} rx={110} ry={58} fill="var(--brand-soft)" />
      <path d="M66 96 L42 70 L98 62 L120 84 Z M174 96 L198 70 L142 62 L120 84 Z" fill="var(--surface-2)" stroke="var(--ink)" strokeWidth={3} strokeLinejoin="round" />
      <rect x={66} y={84} width={108} height={70} rx={4} fill="var(--surface)" stroke="var(--ink)" strokeWidth={3} />
      <rect x={66} y={84} width={108} height={10} fill="var(--brand)" />
      <Dot x={120} y={36} r={11} />
    </svg>
  );
}
