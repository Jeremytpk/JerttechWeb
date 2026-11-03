'use client';
import { useEffect, useState } from 'react';
import { isSignInWithEmailLink, signInWithEmailLink, signOut } from 'firebase/auth';
import { clientAuth, EMAIL_KEY } from '@/lib/firebase/client';

type State = 'working' | 'ask-email' | 'no-account' | 'error';

function safeNext() {
  const n = new URLSearchParams(window.location.search).get('next') || '/portal';
  return n.startsWith('/') && !n.startsWith('//') ? n : '/portal';
}

export default function AuthCallback() {
  const [state, setState] = useState<State>('working');
  const [email, setEmail] = useState('');

  async function finish(address: string) {
    setState('working');
    const auth = clientAuth();
    try {
      const cred = await signInWithEmailLink(auth, address.trim().toLowerCase(), window.location.href);
      const res = await fetch('/api/session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: await cred.user.getIdToken() }),
      });
      await signOut(auth); // the server session cookie is what keeps them signed in
      window.localStorage.removeItem(EMAIL_KEY);
      if (res.ok) return window.location.replace(safeNext());
      setState(res.status === 403 ? 'no-account' : 'error');
    } catch {
      setState('error');
    }
  }

  useEffect(() => {
    if (!isSignInWithEmailLink(clientAuth(), window.location.href)) return setState('error');
    const saved = window.localStorage.getItem(EMAIL_KEY);
    if (saved) finish(saved); else setState('ask-email');
  }, []);

  return (
    <div className="wrap">
      <div className="page-head" style={{ paddingBottom: 0 }}><h1>Signing you in</h1></div>
      <div className="auth-card">
        {state === 'working' && <p style={{ margin: 0 }}>One moment…</p>}
        {state === 'ask-email' && (
          <form onSubmit={e => { e.preventDefault(); finish(email); }}>
            <p className="muted" style={{ marginBottom: 14 }}>You opened the link on a different device or browser. Confirm your email to continue.</p>
            <div className="field"><label htmlFor="email">Email</label><input type="email" id="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <button className="btn btn-primary">Continue</button>
          </form>
        )}
        {state === 'no-account' && <p className="form-msg err" style={{ margin: 0 }}>This email doesn’t have a JertTech account yet. <a href="/request">Start a request</a> and your account is created for you.</p>}
        {state === 'error' && <p className="form-msg err" style={{ margin: 0 }}>This sign-in link is invalid or has expired. <a href="/login">Get a new link</a>.</p>}
      </div>
    </div>
  );
}
