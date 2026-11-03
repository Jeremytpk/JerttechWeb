export type PlanId = 'starter' | 'standard' | 'pro' | 'business';
export type ProjectType = 'Mobile app' | 'Website';

export interface Plan {
  id: PlanId; name: string; priceCents: number; unit: 'week' | 'month';
  setupCents: number; minMonths: number; changes: number; urgent: number;
  pages: string; support: string; build: string; buyoutCents: number;
  blurb: string; features: string; hosting: string; stores: string;
  extras: string; discount: string; report: string;
}

export const MAINTENANCE_CENTS = 299; // per week
export const STAGES = ['Request received', 'Reviewing', 'Quote sent', 'Designing', 'Building', 'Testing', 'Live'] as const;

export const PLANS: Record<PlanId, Plan> = {
  starter: { id: 'starter', name: 'Starter', priceCents: 1500, unit: 'week', setupCents: 0, minMonths: 0, changes: 2, urgent: 0,
    pages: 'Up to 5', support: 'Within 48 hours', build: '5–7 business days', buyoutCents: 49900,
    blurb: 'Pages and navigation only. A simple website or web app to show your idea.',
    features: 'Pages and navigation only (no forms, logins or saved data)', hosting: 'Included, on a JertTech address',
    stores: 'Not available', extras: 'None', discount: 'None', report: 'No' },
  standard: { id: 'standard', name: 'Standard', priceCents: 2999, unit: 'week', setupCents: 14900, minMonths: 3, changes: 3, urgent: 0,
    pages: 'Up to 12', support: 'Within 24 hours', build: '2–4 weeks', buyoutCents: 109900,
    blurb: 'Logins, forms and a real database behind your project.',
    features: 'Logins, forms, database, email notifications, admin panel for you', hosting: 'Included, custom domain supported',
    stores: 'With publishing package', extras: 'None', discount: 'None', report: 'No' },
  pro: { id: 'pro', name: 'Pro', priceCents: 4999, unit: 'week', setupCents: 29900, minMonths: 6, changes: 5, urgent: 1,
    pages: 'Up to 25', support: 'Within 12 hours', build: '4–8 weeks', buyoutCents: 179900,
    blurb: 'Payments, bookings, push notifications and integrations.',
    features: 'Everything in Standard, plus payments, bookings, push notifications, user roles and integrations', hosting: 'Included, custom domain supported',
    stores: 'With publishing package', extras: 'None', discount: 'None', report: 'No' },
  business: { id: 'business', name: 'Business', priceCents: 22900, unit: 'month', setupCents: 0, minMonths: 6, changes: 8, urgent: 2,
    pages: 'Up to 40', support: 'Within 6 hours, priority', build: '4–8 weeks', buyoutCents: 189900,
    blurb: 'Everything in Pro, billed monthly, with free extras and priority support.',
    features: 'Everything in Pro', hosting: 'Included, custom domain supported',
    stores: 'One store’s publishing included', extras: 'Brand board and one-store publishing', discount: '20% off all add-ons', report: 'Yes, monthly' },
};
export const PLAN_ORDER: PlanId[] = ['starter', 'standard', 'pro', 'business'];

export interface Addon { id: string; name: string; desc: string; priceCents: number; appsOnly?: boolean; standardUp?: boolean }
export const ADDONS: Addon[] = [
  { id: 'brand', name: 'Brand board', desc: 'Logo variations, colors and fonts', priceCents: 14900 },
  { id: 'productdoc', name: 'Product document', desc: 'Features, user flows and the plan for your project', priceCents: 19900 },
  { id: 'charter', name: 'Graphic charter', desc: 'A full visual style guide', priceCents: 24900 },
  { id: 'domain', name: 'Custom domain setup', desc: 'Your own web address (domain cost extra)', priceCents: 2900 },
  { id: 'pub1', name: 'Publishing package, one store', desc: 'We guide you through the App Store or Google Play', priceCents: 19900, appsOnly: true, standardUp: true },
  { id: 'pub2', name: 'Publishing package, both stores', desc: 'App Store and Google Play', priceCents: 34900, appsOnly: true, standardUp: true },
];

export const CHANGE_PRICES: Record<string, number | null> = { small: 1500, medium: 4000, large: null };
export const URGENT_PRICES: Record<string, number> = { normal: 0, urgent: 3500, emergency: 7500 };

export function isPlan(v: unknown): v is PlanId { return typeof v === 'string' && v in PLANS; }

/** Price of an add-on for a plan and project type, or null if not available. */
export function addonPrice(id: string, plan: PlanId, type: ProjectType): number | null {
  const a = ADDONS.find(x => x.id === id);
  if (!a) return null;
  if (a.appsOnly && type === 'Website') return null;
  if (a.standardUp && plan === 'starter') return null;
  if (plan === 'business') {
    if (id === 'brand' || id === 'pub1') return 0;
    if (id === 'pub2') return Math.round((34900 - 19900) * 0.8);
    return Math.round(a.priceCents * 0.8);
  }
  return a.priceCents;
}

export function estimate(plan: PlanId, addons: string[], type: ProjectType) {
  const p = PLANS[plan];
  const lines: { label: string; cents: number | null }[] = [];
  let due = p.setupCents;
  if (p.setupCents) lines.push({ label: 'Setup fee', cents: p.setupCents });
  else if (plan === 'business') lines.push({ label: 'Setup fee (waived)', cents: 0 });
  const valid: string[] = [];
  for (const id of addons) {
    const pr = addonPrice(id, plan, type);
    if (pr == null) continue;
    if (id === 'pub1' && addons.includes('pub2')) continue;
    valid.push(id); due += pr;
    lines.push({ label: ADDONS.find(a => a.id === id)!.name, cents: pr });
  }
  return { lines, dueCents: due, addons: valid };
}

export function money(cents: number | null | undefined) {
  if (cents == null) return 'Quoted';
  const v = cents / 100;
  return '$' + v.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 });
}
export const planPrice = (p: Plan) => `${money(p.priceCents)}/${p.unit}`;
export const monthlyCents = (p: Plan) => (p.unit === 'week' ? Math.round((p.priceCents * 52) / 12) : p.priceCents);
