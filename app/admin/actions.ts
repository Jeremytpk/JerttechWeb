'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin, supabaseAdmin, logActivity } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { MAINTENANCE_CENTS, STAGES } from '@/lib/pricing';

async function admin() {
  const user = await requireAdmin();
  if (!user) redirect('/');
  return supabaseAdmin();
}
const done = () => revalidatePath('/admin');

export async function setStage(form: FormData) {
  const db = await admin();
  const id = String(form.get('id')); const stage = Math.min(6, Math.max(0, Number(form.get('stage'))));
  const { data: p } = await db.from('projects').select('name, status').eq('id', id).single();
  if (!p) return;
  const status = ['building', 'live'].includes(p.status) ? (stage === 6 ? 'live' : 'building') : p.status;
  await db.from('projects').update({ stage, status }).eq('id', id);
  await logActivity(`${p.name} moved to “${STAGES[stage]}”.`);
  done();
}

export async function setQuote(form: FormData) {
  const db = await admin();
  const cents = Math.max(0, Math.round(Number(form.get('dollars')) * 100));
  if (!Number.isFinite(cents)) return;
  await db.from('projects').update({ quote_cents: cents }).eq('id', String(form.get('id'))).is('stripe_subscription_id', null);
  done();
}

export async function setChangeStatus(form: FormData) {
  const db = await admin();
  const id = String(form.get('id')); const status = String(form.get('status'));
  if (!['new', 'progress', 'done', 'declined'].includes(status)) return;
  const priceInput = form.get('dollars');
  const { data: c } = await db.from('change_requests').select('*, projects(name, customer_id)').eq('id', id).single();
  if (!c) return;
  let price = c.price_cents;
  if (price === null && priceInput) price = Math.round(Number(priceInput) * 100);
  const update: any = { status, price_cents: price };
  // Bill extra changes on the customer's next invoice once delivered.
  if (status === 'done' && price && price > 0 && !c.billed) {
    const { data: prof } = await db.from('profiles').select('stripe_customer_id').eq('id', c.projects.customer_id).single();
    if (prof?.stripe_customer_id) {
      await stripe().invoiceItems.create({ customer: prof.stripe_customer_id, amount: price, currency: 'usd', description: `Change request: ${c.description.slice(0, 80)}` });
      update.billed = true;
    }
  }
  await db.from('change_requests').update(update).eq('id', id);
  await logActivity(`Change request for ${c.projects.name} marked ${status}.`);
  done();
}

export async function decideCode(form: FormData) {
  const db = await admin();
  const approve = form.get('decision') === 'approve';
  const { data: r } = await db.from('code_requests').select('*, projects(name)').eq('id', String(form.get('id'))).single();
  if (!r || r.status !== 'pending') return;
  await db.from('code_requests').update({ status: approve ? 'approved' : 'declined' }).eq('id', r.id);
  await logActivity(`Code buyout ${approve ? 'approved' : 'declined'} for ${r.projects.name}.`);
  done();
}

export async function processCancel(form: FormData) {
  const db = await admin();
  const { data: c } = await db.from('cancellations').select('*, projects(*)').eq('id', String(form.get('id'))).single();
  if (!c || c.status !== 'pending') return;
  const p = c.projects;
  if (c.option === 'maintenance') {
    if (p.stripe_subscription_id) {
      const sub = await stripe().subscriptions.retrieve(p.stripe_subscription_id);
      const item = sub.items.data[0];
      const product = typeof item.price.product === 'string' ? item.price.product : item.price.product.id;
      await stripe().subscriptions.update(sub.id, {
        items: [{ id: item.id, price_data: { currency: 'usd', product, unit_amount: MAINTENANCE_CENTS, recurring: { interval: 'week' } } }],
        proration_behavior: 'none',
      });
    }
    await db.from('projects').update({ status: 'maintenance' }).eq('id', p.id);
    await logActivity(`${p.name} moved to maintenance only.`);
  } else if (c.option === 'buyout') {
    const { data: open } = await db.from('code_requests').select('id').eq('project_id', p.id).in('status', ['pending', 'approved']);
    if (!open?.length) {
      const { PLANS } = await import('@/lib/pricing');
      await db.from('code_requests').insert({ project_id: p.id, price_cents: PLANS[p.plan as keyof typeof PLANS].buyoutCents });
    }
    await logActivity(`Cancellation for ${p.name} turned into a code buyout request.`);
  } else {
    await db.from('projects').update({ status: 'closing', offline_at: new Date(Date.now() + 14 * 86400000).toISOString() }).eq('id', p.id);
    if (p.stripe_subscription_id) await stripe().subscriptions.cancel(p.stripe_subscription_id).catch(() => null);
    await logActivity(`${p.name} will go offline in 14 days.`);
  }
  await db.from('cancellations').update({ status: 'processed' }).eq('id', c.id);
  done();
}

export async function setProjectStatus(form: FormData) {
  const db = await admin();
  const status = String(form.get('status'));
  if (!['building', 'live', 'maintenance', 'closing', 'cancelled', 'bought'].includes(status)) return;
  await db.from('projects').update({ status }).eq('id', String(form.get('id')));
  done();
}
