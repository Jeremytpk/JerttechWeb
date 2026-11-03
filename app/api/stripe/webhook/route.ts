import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { col, getRow, findRows, updateRow, now, logActivity } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, req.headers.get('stripe-signature') || '', process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
  const projectBySub = async (sub: string | null) => (sub ? (await findRows('projects', 'stripe_subscription_id', sub))[0] ?? null : null);
  // One payment per Stripe reference, so a webhook delivered twice doesn't record it twice.
  const savePayment = async (ref: string, data: Record<string, unknown>) => {
    const doc = col('payments').doc(ref);
    const exists = (await doc.get()).exists;
    await doc.set({ ...data, stripe_ref: ref, ...(exists ? {} : { created_at: now() }) }, { merge: true });
  };

  switch (event.type) {
    case 'checkout.session.completed': {
      const s = event.data.object as Stripe.Checkout.Session;
      const projectId = s.metadata?.project_id;
      if (!projectId) break;
      if (s.metadata?.kind === 'start' && s.subscription) {
        const p = await getRow('projects', projectId);
        if (!p) break;
        await updateRow('projects', projectId, { stripe_subscription_id: String(s.subscription), stage: Math.max(p.stage ?? 0, 3) });
        await logActivity(`${p?.name} approved the quote and paid. Moved to Designing.`);
      }
      if (s.metadata?.kind === 'buyout') {
        const p = await getRow('projects', projectId);
        if (!p) break;
        if (s.metadata.code_request_id) await updateRow('code_requests', s.metadata.code_request_id, { status: 'paid' });
        await savePayment(s.id, { project_id: projectId, customer_id: p.customer_id, amount_cents: s.amount_total ?? 0, description: 'Code buyout', status: 'paid' });
        await updateRow('projects', projectId, { status: 'bought' });
        if (p?.stripe_subscription_id) await stripe().subscriptions.cancel(p.stripe_subscription_id).catch(() => null);
        await logActivity(`Code buyout paid for ${p?.name}. Prepare the handover.`);
      }
      break;
    }
    case 'invoice.paid':
    case 'invoice.payment_failed': {
      const inv = event.data.object as Stripe.Invoice;
      const p = await projectBySub(typeof inv.subscription === 'string' ? inv.subscription : inv.subscription?.id ?? null);
      if (!p) break;
      const paid = event.type === 'invoice.paid';
      const desc = inv.billing_reason === 'subscription_create' ? 'First payment (plan, setup and add-ons)' : 'Subscription and extras';
      await savePayment(inv.id, {
        project_id: p.id, customer_id: p.customer_id, amount_cents: paid ? inv.amount_paid : inv.amount_due, description: desc,
        status: paid ? 'paid' : 'failed',
      });
      if (!paid) await logActivity(`Payment failed for ${p.name}.`);
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const p = await projectBySub(sub.id);
      if (p && !['bought', 'closing'].includes(p.status)) {
        await updateRow('projects', p.id, { status: 'closing', offline_at: new Date(Date.now() + 14 * 86400000).toISOString() });
        await logActivity(`Subscription ended for ${p.name}. It goes offline in 14 days.`);
      }
      break;
    }
  }
  return NextResponse.json({ received: true });
}
