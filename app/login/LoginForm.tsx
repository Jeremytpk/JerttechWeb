'use client';
import { useState } from 'react';
import { emailSignInLink } from '@/lib/firebase/client';

export default function LoginForm({ next }: { next: string }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get('email') || '').trim().toLowerCase();
    const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/portal';
    setStatus('sending');
    try { await emailSignInLink(email, safeNext); setStatus('sent'); } catch { setStatus('error'); }
  }

  return (
    <div className="auth-card">
      {status === 'sent' ? (
        <p className="form-msg ok" style={{ margin: 0 }}>A sign-in link is on its way. Open it on this device. If your email doesn’t have a JertTech account yet, the link will tell you how to start one.</p>
      ) : (
        <form onSubmit={onSubmit}>
          <div className="field"><label htmlFor="email">Email</label><input type="email" id="email" name="email" required autoComplete="email" /></div>
          {status === 'error' && <p className="form-msg err">We couldn’t send the link. Check the address and try again.</p>}
          <button className="btn btn-primary" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Email me a sign-in link'}</button>
          <p className="muted" style={{ fontSize: 14, marginTop: 14 }}>New here? <a href="/request">Start a request</a> and your account is created for you.</p>
        </form>
      )}
    </div>
  );
}
