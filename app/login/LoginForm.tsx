'use client';
import { useFormState, useFormStatus } from 'react-dom';
import { sendLink, type LoginState } from './actions';

function Submit() { const { pending } = useFormStatus(); return <button className="btn btn-primary" disabled={pending}>{pending ? 'Sending…' : 'Email me a sign-in link'}</button>; }

export default function LoginForm({ next }: { next: string }) {
  const [state, action] = useFormState<LoginState, FormData>(sendLink, {});
  return (
    <div className="auth-card">
      {state.sent ? (
        <p className="form-msg ok" style={{ margin: 0 }}>If that email has a JertTech account, a sign-in link is on its way. Open it on this device.</p>
      ) : (
        <form action={action}>
          <input type="hidden" name="next" value={next} />
          <div className="field"><label htmlFor="email">Email</label><input type="email" id="email" name="email" required autoComplete="email" /></div>
          {state.error && <p className="form-msg err">{state.error}</p>}
          <Submit />
          <p className="muted" style={{ fontSize: 14, marginTop: 14 }}>New here? <a href="/request">Start a request</a> and your account is created for you.</p>
        </form>
      )}
    </div>
  );
}
