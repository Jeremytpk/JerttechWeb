import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin, logActivity } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, req.headers.get('stripe-signature') || '', process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
  const db = supabaseAdmin();
  const projectBySub = async (sub: string | null) => {
    if (!sub) return null;
    const { data } = await db.from('projects').select('*').eq('stripe_subscription_id', sub).maybeSingle();
    return data;
  };

  switch (event.type) {
    case 'checkout.session.completed': {
      const s = event.data.object as Stripe.Checkout.Session;
      const projectId = s.metadata?.project_id;
      if (!projectId) break;
      if (s.metadata?.kind === 'start' && s.subscription) {
        const { data: p } = await db.from('projects').select('stage, name').eq('id', projectId).single();
        await db.from('projects').update({ stripe_subscription_id: String(s.subscription), stage: Math.max(p?.stage ?? 0, 3) }).eq('id', projectId);
        await logActivity(`${p?.name} approved the quote and paid. Moved to Designing.`);
      }
      if (s.metadata?.kind === 'buyout') {
        const { data: p } = await db.from('projects').select('*').eq('id', projectId).single();
        await db.from('code_requests').update({ status: 'paid' }).eq('id', s.metadata.code_request_id);
        await db.from('payments').upsert({ project_id: projectId, amount_cents: s.amount_total ?? 0, description: 'Code buyout', status: 'paid', stripe_ref: s.id }, { onConflict: 'stripe_ref' });
        await db.from('projects').update({ status: 'bought' }).eq('id', projectId);
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
      await db.from('payments').upsert({
        project_id: p.id, amount_cents: paid ? inv.amount_paid : inv.amount_due, description: desc,
        status: paid ? 'paid' : 'failed', stripe_ref: inv.id,
      }, { onConflict: 'stripe_ref' });
      if (!paid) await logActivity(`Payment failed for ${p.name}.`);
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const p = await projectBySub(sub.id);
      if (p && !['bought', 'closing'].includes(p.status)) {
        await db.from('projects').update({ status: 'closing', offline_at: new Date(Date.now() + 14 * 86400000).toISOString() }).eq('id', p.id);
        await logActivity(`Subscription ended for ${p.name}. It goes offline in 14 days.`);
      }
      break;
    }
  }
  return NextResponse.json({ received: true });
}
