'use client';
import { useState, useTransition } from 'react';
import { useFormState } from 'react-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import Link from 'next/link';
import { submitRequest, type RequestState } from './actions';
import { authMessage, clientAuth, startSession } from '@/lib/firebase/client';
import { ADDONS, PLANS, PLAN_ORDER, addonPrice, estimate, money, planPrice, type PlanId, type ProjectType } from '@/lib/pricing';

type Account = { email: string; name: string; phone: string } | null;

export default function RequestForm({ initialPlan, account }: { initialPlan: PlanId; account: Account }) {
  const [state, action] = useFormState<RequestState, FormData>(submitRequest, {});
  const [plan, setPlan] = useState<PlanId>(initialPlan);
  const [type, setType] = useState<ProjectType>('Mobile app');
  const [addons, setAddons] = useState<string[]>([]);
  const [signedIn, setSignedIn] = useState<string | null>(account?.email ?? null);
  const [hasAccount, setHasAccount] = useState(false);
  const [authError, setAuthError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sending, startTransition] = useTransition();
  const p = PLANS[plan];
  const est = estimate(plan, addons, type);

  // Not signed in yet: create their account (or sign them in) first, then send the request.
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setAuthError('');
    if (!signedIn) {
      const email = String(fd.get('email') || '').trim().toLowerCase();
      const password = String(fd.get('password') || '');
      setBusy(true);
      try {
        const auth = clientAuth();
        const cred = hasAccount
          ? await signInWithEmailAndPassword(auth, email, password)
          : await createUserWithEmailAndPassword(auth, email, password);
        await startSession(cred.user, { name: String(fd.get('name') || '') });
        setSignedIn(email);
      } catch (err) {
        if ((err as { code?: string }).code === 'auth/email-already-in-use') setHasAccount(true);
        setAuthError(authMessage(err));
        setBusy(false);
        return;
      }
      setBusy(false);
    }
    fd.delete('password'); // never sent to our server
    fd.delete('email');
    startTransition(() => action(fd));
  }

  if (state.tracking) return (
    <div className="done-box" style={{ marginBottom: 40 }}>
      <h2>Request sent</h2>
      <p>Thanks! We’ll review your idea and email your quote. Your tracking code is:</p>
      <div className="code">{state.tracking}</div>
      <p style={{ marginBottom: 18 }}>You’re signed in as {state.email}. Follow your project, approve your quote and pay from My projects.</p>
      <div className="btns"><Link className="btn btn-primary" href="/portal">Go to my projects</Link></div>
    </div>
  );

  const toggle = (id: string, on: boolean) => setAddons(prev => {
    let next = prev.filter(x => x !== id);
    if (on) { next.push(id); if (id === 'pub1') next = next.filter(x => x !== 'pub2'); if (id === 'pub2') next = next.filter(x => x !== 'pub1'); }
    return next;
  });

  return (
    <form className="req" onSubmit={onSubmit}>
      <div>
        <fieldset>
          <legend>About you</legend>
          {signedIn ? (
            <>
              <p className="muted" style={{ marginBottom: 14, fontSize: 15 }}>Signed in as <strong>{signedIn}</strong>.</p>
              <div className="field"><label htmlFor="f-name">Full name</label><input type="text" id="f-name" name="name" required autoComplete="name" defaultValue={account?.name} /></div>
            </>
          ) : (
            <>
              <p className="muted" style={{ marginBottom: 14, fontSize: 15 }}>
                {hasAccount ? 'Sign in with your JertTech password to send this request.' : 'We’ll create your account so you can follow your project.'}{' '}
                <button type="button" className="linkish" onClick={() => { setHasAccount(!hasAccount); setAuthError(''); }}>
                  {hasAccount ? 'I’m new here' : 'Already have an account? Sign in'}
                </button>
              </p>
              <div className="row2">
                <div className="field"><label htmlFor="f-name">Full name</label><input type="text" id="f-name" name="name" required autoComplete="name" /></div>
                <div className="field"><label htmlFor="f-email">Email</label><input type="email" id="f-email" name="email" required autoComplete="email" /></div>
              </div>
              <div className="field">
                <label htmlFor="f-password">{hasAccount ? 'Password' : 'Choose a password'}</label>
                {!hasAccount && <span className="hint">At least 8 characters.</span>}
                <input type="password" id="f-password" name="password" required minLength={hasAccount ? undefined : 8} autoComplete={hasAccount ? 'current-password' : 'new-password'} />
              </div>
            </>
          )}
          <div className="field"><label htmlFor="f-phone">Phone <span className="hint">(optional)</span></label><input type="tel" id="f-phone" name="phone" autoComplete="tel" defaultValue={account?.phone} /></div>
          <div className="hp" aria-hidden="true"><label>Company<input name="company" tabIndex={-1} autoComplete="off" /></label></div>
        </fieldset>
        <fieldset>
          <legend>Your project</legend>
          <div className="field"><label htmlFor="f-type">What do you want built?</label>
            <select id="f-type" name="ptype" value={type} onChange={e => setType(e.target.value as ProjectType)}><option>Mobile app</option><option>Website</option></select></div>
          <div className="field"><label htmlFor="f-app">Project name</label><input type="text" id="f-app" name="app" required placeholder="For example, Fade House Bookings" /></div>
          <div className="field"><label htmlFor="f-idea">Describe your idea</label><span className="hint">What should people be able to do in your app or on your website? Who is it for?</span><textarea id="f-idea" name="idea" required /></div>
          <div className="field"><label htmlFor="f-deadline">When do you need it?</label>
            <select id="f-deadline" name="deadline"><option>No rush</option><option>Within a month</option><option>Within two months</option><option>I have a fixed date</option></select></div>
        </fieldset>
        <fieldset>
          <legend>Choose a plan</legend>
          {PLAN_ORDER.map(k => { const pl = PLANS[k]; return (
            <label className="choice" key={k}>
              <input type="radio" name="plan" value={k} checked={plan === k} onChange={() => setPlan(k)} />
              <span className="ct"><b>{pl.name}</b><span>{pl.blurb}{pl.setupCents ? ` Setup fee ${money(pl.setupCents)}.` : ''}{pl.minMonths ? ` ${pl.minMonths}-month minimum.` : ''}</span></span>
              <span className="cp">{planPrice(pl)}</span>
            </label>
          ); })}
        </fieldset>
        <fieldset>
          <legend>Add-ons (optional)</legend>
          {ADDONS.map(a => {
            const pr = addonPrice(a.id, plan, type);
            const off = pr == null;
            const note = off ? (a.appsOnly && type === 'Website' ? ' Only for mobile apps.' : ' Available on Standard and up.') : '';
            return (
              <label className="choice" key={a.id}>
                <input type="checkbox" name="addon" value={a.id} disabled={off} checked={!off && addons.includes(a.id)} onChange={e => toggle(a.id, e.target.checked)} />
                <span className="ct"><b>{a.name}</b><span>{a.desc}{note}</span></span>
                <span className="cp">{off || pr === a.priceCents ? money(a.priceCents) : <><s>{money(a.priceCents)}</s>{pr === 0 ? 'Free' : money(pr)}</>}</span>
              </label>
            );
          })}
        </fieldset>
        <fieldset>
          <label className="agree"><input type="checkbox" name="agree" required /> I understand every JertTech app and website shows a small “Powered by JertTech” badge, and the code belongs to JertTech unless I buy it.</label>
        </fieldset>
        {(authError || state.error) && <p className="form-msg err" role="alert">{authError || state.error}</p>}
        <button className="btn btn-primary" type="submit" disabled={busy || sending}>
          {busy ? (hasAccount ? 'Signing in…' : 'Creating your account…') : sending ? 'Sending…' : 'Send my request'}
        </button>
      </div>
      <aside className="estimate" aria-live="polite">
        <h2>Your estimate</h2>
        {(est.lines.length ? est.lines : [{ label: 'No setup fee', cents: 0 }]).map(l => (
          <div className="line" key={l.label}><span>{l.label}</span><span>{l.cents === 0 && l.label !== 'No setup fee' ? 'Free' : money(l.cents)}</span></div>
        ))}
        <div className="big">{money(est.dueCents)} <span style={{ fontSize: 16, fontWeight: 600 }}>due at start</span></div>
        <div className="then">Then {planPrice(p)}</div>
        <p className="note">{p.minMonths ? `${p.minMonths}-month minimum term. ` : ''}{p.changes} included changes per month. This is an estimate: your final quote comes after we review your idea.</p>
      </aside>
    </form>
  );
}
