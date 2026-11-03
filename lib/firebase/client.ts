'use client';
// Browser side: email and password sign-in, sign-up and password reset with Firebase.
// After Firebase confirms who someone is, the server turns that into a JertTech session cookie.
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, signOut, type User } from 'firebase/auth';

export function clientAuth() {
  const app = getApps()[0] ?? initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
  return getAuth(app);
}

/** Starts the JertTech session for a user Firebase just signed in. */
export async function startSession(user: User, extra: { name?: string } = {}) {
  const res = await fetch('/api/session', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: await user.getIdToken(), ...extra }),
  });
  await signOut(clientAuth()); // the server cookie is what keeps them signed in
  if (!res.ok) throw Object.assign(new Error('session'), { code: 'jerttech/session' });
}

/** Plain-language message for a Firebase sign-in error. */
export function authMessage(e: unknown) {
  switch ((e as { code?: string })?.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-login-credentials':
      return 'That email and password don’t match. Try again or reset your password.';
    case 'auth/email-already-in-use':
      return 'This email already has an account. Sign in instead.';
    case 'auth/weak-password':
      return 'Use a password with at least 8 characters.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a few minutes and try again.';
    case 'auth/network-request-failed':
      return 'No connection. Check your internet and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
