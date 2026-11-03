import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/** True when real Supabase keys are set (not missing, not the .env.example placeholders). */
export function supabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return /^https?:\/\//.test(url) && !url.includes('YOUR-PROJECT')
    && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your-anon-key'
    && !!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your-service-role-key';
}

/** Supabase client acting as the signed-in visitor (row-level security applies). */
export function supabaseServer() {
  const store = cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* called from a server component */ }
      },
    },
  });
}

/** Service-role client. Server only; bypasses row-level security. Always check permissions before using it. */
export function supabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function currentUser() {
  if (!supabaseConfigured()) return null;
  const { data } = await supabaseServer().auth.getUser();
  return data.user;
}

export async function requireAdmin() {
  const user = await currentUser();
  if (!user) return null;
  const { data } = await supabaseAdmin().from('profiles').select('role').eq('id', user.id).single();
  return data?.role === 'admin' ? user : null;
}

export async function logActivity(message: string) {
  await supabaseAdmin().from('activity').insert({ message });
}
