import Stripe from 'stripe';

let client: Stripe | null = null;
export function stripe() {
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY!);
  return client;
}

export const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/** Returns the Stripe customer id for a profile, creating one if needed. */
export async function ensureStripeCustomer(db: any, profile: { id: string; email: string; full_name: string | null; stripe_customer_id: string | null }) {
  if (profile.stripe_customer_id) return profile.stripe_customer_id;
  const c = await stripe().customers.create({ email: profile.email, name: profile.full_name || undefined, metadata: { profile_id: profile.id } });
  await db.from('profiles').update({ stripe_customer_id: c.id }).eq('id', profile.id);
  return c.id;
}
