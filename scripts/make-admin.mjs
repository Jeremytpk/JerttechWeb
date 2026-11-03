// Makes someone a JertTech admin. They must have sent a request (or have a profile) first.
// Usage: npm run make-admin -- you@example.com
import { readFileSync } from 'node:fs';
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Load .env.local without extra packages.
try {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* rely on the real environment */ }

const email = (process.argv[2] || '').trim().toLowerCase();
if (!email) { console.error('Usage: npm run make-admin -- you@example.com'); process.exit(1); }

const sa = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || '', 'base64').toString('utf8'));
const app = initializeApp({ credential: cert(sa), projectId: sa.project_id });
const db = getFirestore(app, process.env.FIRESTORE_DATABASE_ID);

let uid;
try { uid = (await getAuth(app).getUserByEmail(email)).uid; }
catch { console.error(`No sign-in account for ${email}. Send a request from the website with this email first.`); process.exit(1); }

const ref = db.collection('profiles').doc(uid);
const snap = await ref.get();
if (snap.exists) await ref.update({ role: 'admin' });
else await ref.set({ email, full_name: null, phone: null, role: 'admin', stripe_customer_id: null, created_at: new Date().toISOString() });
console.log(`${email} is now a JertTech admin. Sign in at /login and open /admin.`);
