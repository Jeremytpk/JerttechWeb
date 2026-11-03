'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { getRow, findRows, addRow, updateRow, logActivity } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { MAINTENANCE_CENTS, PLANS, STAGES, type PlanId } from '@/lib/pricing';

async function admin() {
  if (!(await requireAdmin())) redirect('/');
}
const done = () => revalidatePath('/admin');

export async function setStage(form: FormData) {
  await admin();
  const id = String(form.get('id')); const stage = Math.min(6, Math.max(0, Number(form.get('stage'))));
  const p = await getRow('projects', id);
  if (!p) return;
  const status = ['building', 'live'].includes(p.status) ? (stage === 6 ? 'live' : 'building') : p.status;
  await updateRow('projects', id, { stage, status });
  await logActivity(`${p.name} moved to “${STAGES[stage]}”.`);
  done();
}

export async function setQuote(form: FormData) {
  await admin();
  const cents = Math.max(0, Math.round(Number(form.get('dollars')) * 100));
  if (!Number.isFinite(cents)) return;
  const p = await getRow('projects', String(form.get('id')));
  if (!p || p.stripe_subscription_id) return; // the quote is locked once paid
  await updateRow('projects', p.id, { quote_cents: cents });
  done();
}

export async function setChangeStatus(form: FormData) {
  await admin();
  const id = String(form.get('id')); const status = String(form.get('status'));
  if (!['new', 'progress', 'done', 'declined'].includes(status)) return;
  const priceInput = form.get('dollars');
  const c = await getRow('change_requests', id);
  if (!c) return;
  const project = await getRow('projects', c.project_id);
  let price = c.price_cents;
  if (price === null && priceInput) price = Math.round(Number(priceInput) * 100);
  const update: Record<string, unknown> = { status, price_cents: price };
  // Bill extra changes on the customer's next invoice once delivered.
  if (status === 'done' && price && price > 0 && !c.billed && project) {
    const prof = await getRow('profiles', project.customer_id);
    if (prof?.stripe_customer_id) {
      await stripe().invoiceItems.create({ customer: prof.stripe_customer_id, amount: price, currency: 'usd', description: `Change request: ${String(c.description).slice(0, 80)}` });
      update.billed = true;
    }
  }
  await updateRow('change_requests', id, update);
  await logActivity(`Change request for ${project?.name} marked ${status}.`);
  done();
}

export async function decideCode(form: FormData) {
  await admin();
  const approve = form.get('decision') === 'approve';
  const r = await getRow('code_requests', String(form.get('id')));
  if (!r || r.status !== 'pending') return;
  const project = await getRow('projects', r.project_id);
  await updateRow('code_requests', r.id, { status: approve ? 'approved' : 'declined' });
  await logActivity(`Code buyout ${approve ? 'approved' : 'declined'} for ${project?.name}.`);
  done();
}

export async function processCancel(form: FormData) {
  await admin();
  const c = await getRow('cancellations', String(form.get('id')));
  if (!c || c.status !== 'pending') return;
  const p = await getRow('projects', c.project_id);
  if (!p) return;
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
    await updateRow('projects', p.id, { status: 'maintenance' });
    await logActivity(`${p.name} moved to maintenance only.`);
  } else if (c.option === 'buyout') {
    const open = (await findRows('code_requests', 'project_id', p.id)).filter(r => ['pending', 'approved'].includes(r.status));
    if (!open.length) await addRow('code_requests', { project_id: p.id, customer_id: p.customer_id, price_cents: PLANS[p.plan as PlanId].buyoutCents, status: 'pending' });
    await logActivity(`Cancellation for ${p.name} turned into a code buyout request.`);
  } else {
    await updateRow('projects', p.id, { status: 'closing', offline_at: new Date(Date.now() + 14 * 86400000).toISOString() });
    if (p.stripe_subscription_id) await stripe().subscriptions.cancel(p.stripe_subscription_id).catch(() => null);
    await logActivity(`${p.name} will go offline in 14 days.`);
  }
  await updateRow('cancellations', c.id, { status: 'processed' });
  done();
}

export async function setProjectStatus(form: FormData) {
  await admin();
  const status = String(form.get('status'));
  if (!['building', 'live', 'maintenance', 'closing', 'cancelled', 'bought'].includes(status)) return;
  await updateRow('projects', String(form.get('id')), { status });
  done();
}
