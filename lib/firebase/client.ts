'use client';
// Browser side: only used to send and complete passwordless sign-in links.
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, sendSignInLinkToEmail } from 'firebase/auth';

export function clientAuth() {
  const app = getApps()[0] ?? initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
  return getAuth(app);
}

export const EMAIL_KEY = 'jerttech-signin-email';

/** Emails a sign-in link that comes back to this same site (jerttech.com, jerttech.app or localhost). */
export async function emailSignInLink(email: string, next = '/portal') {
  await sendSignInLinkToEmail(clientAuth(), email, {
    url: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
    handleCodeInApp: true,
  });
  window.localStorage.setItem(EMAIL_KEY, email);
}
