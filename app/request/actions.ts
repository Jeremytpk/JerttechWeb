'use server';
import { supabaseAdmin, supabaseServer, supabaseConfigured, logActivity } from '@/lib/supabase/server';
import { estimate, isPlan, PLANS, type ProjectType } from '@/lib/pricing';
import { siteUrl } from '@/lib/stripe';

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

  if (!supabaseConfigured()) return { error: 'We can’t take requests online right now. Please try again later.' };
  const db = supabaseAdmin();
  let { data: profile } = await db.from('profiles').select('id').eq('email', email).maybeSingle();
  if (!profile) {
    const { data: created, error } = await db.auth.admin.createUser({ email, email_confirm: true });
    if (error || !created.user) return { error: 'We couldn’t create your account. Please try again.' };
    profile = { id: created.user.id };
  }
  await db.from('profiles').update({ full_name: name, ...(phone ? { phone } : {}) }).eq('id', profile.id);

  const addons = form.getAll('addon').map(String);
  const est = estimate(plan, addons, type);
  const { data: project, error } = await db.from('projects').insert({
    customer_id: profile.id, type, name: projectName, idea, plan, addons: est.addons, deadline, quote_cents: est.dueCents,
  }).select('tracking').single();
  if (error || !project) return { error: 'We couldn’t save your request. Please try again.' };

  await logActivity(`New ${type.toLowerCase()} request: ${projectName} (${PLANS[plan].name}) from ${name}.`);

  // Email a sign-in link so they can follow their project.
  await supabaseServer().auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: `${siteUrl()}/auth/callback?next=/portal` } });

  return { tracking: project.tracking, email };
}
