import LoginForm from './LoginForm';
import { supabaseConfigured } from '@/lib/supabase/server';
import { LoginArt } from '@/components/Illustrations';
export const metadata = { title: 'Sign in' };

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <div className="wrap">
      <div className="page-head has-art" style={{ paddingBottom: 0 }}><div><h1>Sign in</h1><p>Enter the email you used for your request. We’ll send you a sign-in link, no password needed.</p></div><LoginArt /></div>
      {supabaseConfigured() ? <LoginForm next={searchParams.next || '/portal'} /> : (
        <div className="auth-card">
          <p className="form-msg err" style={{ margin: 0 }}>Sign-in isn’t available right now. Customer accounts haven’t been connected yet.</p>
        </div>
      )}
    </div>
  );
}
