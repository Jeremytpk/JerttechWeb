'use server';
import { adminAuth, firebaseConfigured } from '@/lib/firebase/admin';
import { getRow, col, now, addRow, updateRow, nextTracking, logActivity } from '@/lib/db';
import { estimate, isPlan, PLANS, type ProjectType } from '@/lib/pricing';

export type RequestState = { error?: string; tracking?: string; email?: string };

export async function submitRequest(_: RequestState, form: FormData): Promise<RequestState> {
  if (form.get('company')) return { error: 'Something went wrong. Please try again.' }; // honeypot
  const name = String(form.get('name') || '').trim().slice(0, 120);
  const email = String(form.get('email') || '').trim().toLowerCase().slice(0, 200);
  const phone = String(form.get('phone') || '').trim().slice(0, 40);
  const projectName = String(form.get('app') || '').trim().slice(0, 120);
  const idea = String(form.get('idea') || '').trim().slice(0, 5000);
  const deadline = String(form.get('deadline') || '').slice(0, 60);
  const type: ProjectType = form.get('ptype') === 'Website' ? 'Website' : 'Mobile app';
  const plan = form.get('plan');
  const agree = form.get('agree') === 'on';

  const missing: string[] = [];
  if (!name) missing.push('your name');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) missing.push('a valid email');
  if (!projectName) missing.push('a project name');
  if (!idea) missing.push('a description of your idea');
  if (!isPlan(plan)) missing.push('a plan');
  if (!agree) missing.push('your agreement to the badge and code terms');
  if (missing.length || !isPlan(plan)) return { error: `Please add ${missing.join(', ')}.` };

  if (!firebaseConfigured()) return { error: 'We can’t take requests online right now. Please try again later.' };

  // One Firebase sign-in account per email. The Firebase project is shared with other apps,
  // so reuse the account if this email already has one.
  let uid: string;
  try {
    uid = (await adminAuth().getUserByEmail(email)).uid;
  } catch {
    try { uid = (await adminAuth().createUser({ email })).uid; }
    catch { return { error: 'We couldn’t create your account. Please try again.' }; }
  }
  if (await getRow('profiles', uid)) {
    await updateRow('profiles', uid, { full_name: name, ...(phone ? { phone } : {}) });
  } else {
    await col('profiles').doc(uid).set({ email, full_name: name, phone: phone || null, role: 'customer', stripe_customer_id: null, created_at: now() });
  }

  const addons = form.getAll('addon').map(String);
  const est = estimate(plan, addons, type);
  const tracking = await nextTracking();
  try {
    await addRow('projects', {
      customer_id: uid, tracking, type, name: projectName, idea, plan, addons: est.addons, deadline,
      stage: 0, status: 'building', quote_cents: est.dueCents, stripe_subscription_id: null, offline_at: null,
    });
  } catch {
    return { error: 'We couldn’t save your request. Please try again.' };
  }

  await logActivity(`New ${type.toLowerCase()} request: ${projectName} (${PLANS[plan].name}) from ${name}.`);

  // The browser emails the sign-in link (see RequestForm), so they can follow their project.
  return { tracking, email };
}
