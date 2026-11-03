'use server';
import { supabaseServer, supabaseConfigured } from '@/lib/supabase/server';
import { siteUrl } from '@/lib/stripe';

export type LoginState = { sent?: boolean; error?: string };

export async function sendLink(_: LoginState, form: FormData): Promise<LoginState> {
  if (!supabaseConfigured()) return { error: 'Sign-in isn’t available right now. Please try again later.' };
  const email = String(form.get('email') || '').trim().toLowerCase();
  const next = String(form.get('next') || '/portal');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'Enter a valid email address.' };
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/portal';
  await supabaseServer().auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(safeNext)}` } });
  // Same message whether or not the email has an account, so nobody can probe for customers.
  return { sent: true };
}
