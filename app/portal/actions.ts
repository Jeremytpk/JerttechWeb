'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { currentUser } from '@/lib/auth';
import { getRow, findRows, addRow, logActivity } from '@/lib/db';
import { CHANGE_PRICES, URGENT_PRICES, PLANS, type PlanId } from '@/lib/pricing';
import { stripe, siteUrl, ensureStripeCustomer } from '@/lib/stripe';

/** Loads a project only if it belongs to the signed-in customer. */
async function ownProject(projectId: string) {
  const user = await currentUser();
  if (!user) redirect('/login');
  const project = await getRow('projects', projectId);
  if (!project || project.customer_id !== user.id) throw new Error('Project not found');
  const profile = await getRow('profiles', user.id);
  if (!profile) redirect('/login');
  return { project, profile };
}

const monthStart = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString(); };

export async function startPlan(form: FormData) {
  const { project, profile } = await ownProject(String(form.get('projectId')));
  if (project.stripe_subscription_id || project.stage < 2) redirect('/portal');
  const plan = PLANS[project.plan as PlanId];
  const customer = await ensureStripeCustomer(profile);
  const line_items: any[] = [{
    price_data: { currency: 'usd', unit_amount: plan.priceCents, recurring: { interval: plan.unit },
      product_data: { name: `JertTech ${plan.name} plan: ${project.name}` } }, quantity: 1,
  }];
  if (project.quote_cents > 0) line_items.push({ price_data: { currency: 'usd', unit_amount: project.quote_cents, product_data: { name: `Setup fee and add-ons: ${project.name}` } }, quantity: 1 });
  const session = await stripe().checkout.sessions.create({
    mode: 'subscription', customer, line_items,
    metadata: { kind: 'start', project_id: project.id },
    subscription_data: { metadata: { project_id: project.id } },
    success_url: `${siteUrl()}/portal?paid=1`, cancel_url: `${siteUrl()}/portal`,
  });
  redirect(session.url!);
}

export async function requestChange(form: FormData) {
  const { project } = await ownProject(String(form.get('projectId')));
  if (!['building', 'live', 'maintenance'].includes(project.status)) return;
  const kind = String(form.get('kind'));
  const urgency = String(form.get('urgency'));
  const description = String(form.get('description') || '').trim().slice(0, 3000);
  if (!(kind in CHANGE_PRICES) || !(urgency in URGENT_PRICES) || !description) return;
  const plan = PLANS[project.plan as PlanId];
  const month = (await findRows('change_requests', 'project_id', project.id)).filter(c => c.created_at >= monthStart());
  const used = month.filter(c => c.included).length;
  const urgentUsed = month.filter(c => c.urgent_included).length;
  const maintenance = project.status === 'maintenance';
  const included = !maintenance && kind !== 'large' && used < plan.changes;
  const urgentIncluded = !maintenance && urgency !== 'normal' && urgentUsed < plan.urgent;
  const base = included ? 0 : CHANGE_PRICES[kind];
  const price = base === null ? null : base + (urgentIncluded ? 0 : URGENT_PRICES[urgency]);
  await addRow('change_requests', { project_id: project.id, customer_id: project.customer_id, kind, urgency, description, included, urgent_included: urgentIncluded, price_cents: price, status: 'new', billed: false });
  await logActivity(`New ${kind} change request for ${project.name}${urgency !== 'normal' ? ` (${urgency})` : ''}.`);
  revalidatePath('/portal');
}

export async function requestBuyout(form: FormData) {
  const { project } = await ownProject(String(form.get('projectId')));
  const open = (await findRows('code_requests', 'project_id', project.id)).filter(c => ['pending', 'approved'].includes(c.status));
  if (open.length || project.status === 'bought') return;
  await addRow('code_requests', { project_id: project.id, customer_id: project.customer_id, price_cents: PLANS[project.plan as PlanId].buyoutCents, status: 'pending' });
  await logActivity(`Code buyout requested for ${project.name}.`);
  revalidatePath('/portal');
}

export async function payBuyout(form: FormData) {
  const { project, profile } = await ownProject(String(form.get('projectId')));
  const cr = (await findRows('code_requests', 'project_id', project.id)).find(c => c.status === 'approved');
  if (!cr) redirect('/portal');
  const customer = await ensureStripeCustomer(profile);
  const session = await stripe().checkout.sessions.create({
    mode: 'payment', customer,
    line_items: [{ price_data: { currency: 'usd', unit_amount: cr.price_cents, product_data: { name: `Code buyout: ${project.name}` } }, quantity: 1 }],
    metadata: { kind: 'buyout', project_id: project.id, code_request_id: cr.id },
    success_url: `${siteUrl()}/portal?paid=1`, cancel_url: `${siteUrl()}/portal`,
  });
  redirect(session.url!);
}

export async function requestCancel(form: FormData) {
  const { project } = await ownProject(String(form.get('projectId')));
  const option = String(form.get('option'));
  if (!['maintenance', 'buyout', 'shutdown'].includes(option) || !['building', 'live'].includes(project.status)) return;
  const open = (await findRows('cancellations', 'project_id', project.id)).filter(c => c.status === 'pending');
  if (open.length) return;
  await addRow('cancellations', { project_id: project.id, customer_id: project.customer_id, option, status: 'pending' });
  await logActivity(`Cancellation requested for ${project.name} (${option}).`);
  revalidatePath('/portal');
}

export async function billingPortal() {
  const user = await currentUser();
  if (!user) redirect('/login');
  const profile = await getRow('profiles', user.id);
  if (!profile?.stripe_customer_id) redirect('/portal');
  const s = await stripe().billingPortal.sessions.create({ customer: profile.stripe_customer_id, return_url: `${siteUrl()}/portal` });
  redirect(s.url);
}
