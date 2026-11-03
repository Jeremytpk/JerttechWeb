import { redirect } from 'next/navigation';
import LoginForm from './LoginForm';
import { firebaseConfigured } from '@/lib/firebase/admin';
import { currentUser } from '@/lib/auth';
import { LoginArt } from '@/components/Illustrations';
export const metadata = { title: 'Sign in' };
export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: { next?: string; mode?: string } }) {
  const next = searchParams.next || '/portal';
  if (await currentUser()) redirect(next.startsWith('/') && !next.startsWith('//') ? next : '/portal');
  const signup = searchParams.mode === 'signup';
  return (
    <div className="wrap">
      <div className="page-head has-art" style={{ paddingBottom: 0 }}>
        <div>
          <h1>{signup ? 'Create your account' : 'Sign in'}</h1>
          <p>{signup ? 'Create a JertTech account to send requests, follow your projects and manage your plan.' : 'Sign in with your email and password to follow your projects, approve quotes and pay.'}</p>
        </div>
        <LoginArt />
      </div>
      {firebaseConfigured() ? <LoginForm next={next} initialMode={signup ? 'signup' : 'signin'} /> : (
        <div className="auth-card">
          <p className="form-msg err" style={{ margin: 0 }}>Sign-in isn’t available right now. Customer accounts haven’t been connected yet.</p>
        </div>
      )}
    </div>
  );
}
