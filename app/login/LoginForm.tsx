'use client';
import { useState } from 'react';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { authMessage, clientAuth, startSession } from '@/lib/firebase/client';

type Mode = 'signin' | 'signup' | 'reset';

export default function LoginForm({ next, initialMode = 'signin' }: { next: string; initialMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/portal';

  function switchTo(m: Mode) { setMode(m); setError(''); setResetSent(false); }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get('email') || '').trim().toLowerCase();
    const password = String(f.get('password') || '');
    setBusy(true); setError('');
    try {
      const auth = clientAuth();
      if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email).catch(err => {
          // Same message whether or not the email has an account, so nobody can probe for customers.
          if ((err as { code?: string }).code !== 'auth/user-not-found') throw err;
        });
        setResetSent(true);
      } else if (mode === 'signup') {
        if (password.length < 8) throw Object.assign(new Error(), { code: 'auth/weak-password' });
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await startSession(cred.user, { name: String(f.get('name') || '') });
        window.location.assign(safeNext);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        await startSession(cred.user);
        window.location.assign(safeNext);
      }
    } catch (err) {
      setError(authMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const title = mode === 'signup' ? 'Create your account' : mode === 'reset' ? 'Reset your password' : 'Sign in';

  return (
    <div className="auth-card">
      {mode !== 'reset' && (
        <div className="seg" role="tablist" aria-label="Sign in or create an account">
          <button type="button" role="tab" aria-selected={mode === 'signin'} onClick={() => switchTo('signin')}>Sign in</button>
          <button type="button" role="tab" aria-selected={mode === 'signup'} onClick={() => switchTo('signup')}>Create account</button>
        </div>
      )}
      <h2 className="sr-only">{title}</h2>
      {mode === 'reset' && resetSent ? (
        <>
          <p className="form-msg ok" style={{ margin: 0 }}>If that email has an account, a link to reset your password is on its way.</p>
          <p style={{ marginTop: 14 }}><button type="button" className="linkish" onClick={() => switchTo('signin')}>Back to sign in</button></p>
        </>
      ) : (
        <form onSubmit={onSubmit} key={mode}>
          {mode === 'reset' && <p className="muted" style={{ marginBottom: 14 }}>Enter your email and we’ll send you a link to choose a new password.</p>}
          {mode === 'signup' && <div className="field"><label htmlFor="name">Full name</label><input type="text" id="name" name="name" required autoComplete="name" /></div>}
          <div className="field"><label htmlFor="email">Email</label><input type="email" id="email" name="email" required autoComplete="email" /></div>
          {mode !== 'reset' && (
            <div className="field">
              <label htmlFor="password">Password</label>
              {mode === 'signup' && <span className="hint">At least 8 characters.</span>}
              <input type="password" id="password" name="password" required minLength={mode === 'signup' ? 8 : undefined}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
            </div>
          )}
          {error && <p className="form-msg err" role="alert">{error}</p>}
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'One moment…' : mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in'}
          </button>
          {mode === 'signin' && <p style={{ marginTop: 14, fontSize: 15 }}><button type="button" className="linkish" onClick={() => switchTo('reset')}>Forgot your password?</button></p>}
          {mode === 'reset' && <p style={{ marginTop: 14, fontSize: 15 }}><button type="button" className="linkish" onClick={() => switchTo('signin')}>Back to sign in</button></p>}
        </form>
      )}
    </div>
  );
}
