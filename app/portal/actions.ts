'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { currentUser, supabaseAdmin, logActivity } from '@/lib/supabase/server';
import { CHANGE_PRICES, URGENT_PRICES, PLANS, type PlanId } from '@/lib/pricing';
import { stripe, siteUrl, ensureStripeCustomer } from '@/lib/stripe';

/** Loads a project only if it belongs to the signed-in customer. */
async function ownProject(projectId: string) {
  const user = await currentUser();
  if (!user) redirect('/login');
  const db = supabaseAdmin();
  const { data: project } = await db.from('projects').select('*').eq('id', projectId).eq('customer_id', user.id).single();
  if (!project) throw new Error('Project not found');
  const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).single();
  return { db, project, profile: profile! };
}

const monthStart = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString(); };

export async function startPlan(form: FormData) {
  const { db, project, profile } = await ownProject(String(form.get('projectId')));
  if (project.stripe_subscription_id || project.stage < 2) redirect('/portal');
  const plan = PLANS[project.plan as PlanId];
  const customer = await ensureStripeCustomer(db, profile);
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
  const { db, project } = await ownProject(String(form.get('projectId')));
  if (!['building', 'live', 'maintenance'].includes(project.status)) return;
  const kind = String(form.get('kind'));
  const urgency = String(form.get('urgency'));
  const description = String(form.get('description') || '').trim().slice(0, 3000);
  if (!(kind in CHANGE_PRICES) || !(urgency in URGENT_PRICES) || !description) return;
  const plan = PLANS[project.plan as PlanId];
  const { data: month } = await db.from('change_requests').select('included, urgent_included').eq('project_id', project.id).gte('created_at', monthStart());
  const used = (month || []).filter(c => c.included).length;
  const urgentUsed = (month || []).filter(c => c.urgent_included).length;
  const maintenance = project.status === 'maintenance';
  const included = !maintenance && kind !== 'large' && used < plan.changes;
  const urgentIncluded = !maintenance && urgency !== 'normal' && urgentUsed < plan.urgent;
  const base = included ? 0 : CHANGE_PRICES[kind];
  const price = base === null ? null : base + (urgentIncluded ? 0 : URGENT_PRICES[urgency]);
  await db.from('change_requests').insert({ project_id: project.id, kind, urgency, description, included, urgent_included: urgentIncluded, price_cents: price });
  await logActivity(`New ${kind} change request for ${project.name}${urgency !== 'normal' ? ` (${urgency})` : ''}.`);
  revalidatePath('/portal');
}

export async function requestBuyout(form: FormData) {
  const { db, project } = await ownProject(String(form.get('projectId')));
  const { data: open } = await db.from('code_requests').select('id').eq('project_id', project.id).in('status', ['pending', 'approved']);
  if (open?.length || project.status === 'bought') return;
  await db.from('code_requests').insert({ project_id: project.id, price_cents: PLANS[project.plan as PlanId].buyoutCents });
  await logActivity(`Code buyout requested for ${project.name}.`);
  revalidatePath('/portal');
}

export async function payBuyout(form: FormData) {
  const { db, project, profile } = await ownProject(String(form.get('projectId')));
  const { data: cr } = await db.from('code_requests').select('*').eq('project_id', project.id).eq('status', 'approved').single();
  if (!cr) redirect('/portal');
  const customer = await ensureStripeCustomer(db, profile);
  const session = await stripe().checkout.sessions.create({
    mode: 'payment', customer,
    line_items: [{ price_data: { currency: 'usd', unit_amount: cr.price_cents, product_data: { name: `Code buyout: ${project.name}` } }, quantity: 1 }],
    metadata: { kind: 'buyout', project_id: project.id, code_request_id: cr.id },
    success_url: `${siteUrl()}/portal?paid=1`, cancel_url: `${siteUrl()}/portal`,
  });
  redirect(session.url!);
}

export async function requestCancel(form: FormData) {
  const { db, project } = await ownProject(String(form.get('projectId')));
  const option = String(form.get('option'));
  if (!['maintenance', 'buyout', 'shutdown'].includes(option) || !['building', 'live'].includes(project.status)) return;
  const { data: open } = await db.from('cancellations').select('id').eq('project_id', project.id).eq('status', 'pending');
  if (open?.length) return;
  await db.from('cancellations').insert({ project_id: project.id, option });
  await logActivity(`Cancellation requested for ${project.name} (${option}).`);
  revalidatePath('/portal');
}

export async function billingPortal() {
  const user = await currentUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabaseAdmin().from('profiles').select('stripe_customer_id').eq('id', user.id).single();
  if (!profile?.stripe_customer_id) redirect('/portal');
  const s = await stripe().billingPortal.sessions.create({ customer: profile.stripe_customer_id, return_url: `${siteUrl()}/portal` });
  redirect(s.url);
}
