// Server only. Firebase Admin SDK: bypasses Firestore security rules, so every caller must check permissions first.
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

/** True when the server has what it needs to reach Firebase. */
export function firebaseConfigured() {
  return !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
    && !!process.env.FIRESTORE_DATABASE_ID
    && !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
}

let app: App | undefined;
function adminApp() {
  if (app) return app;
  const sa = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64!, 'base64').toString('utf8'));
  app = getApps().find(a => a.name === 'jerttech') ?? initializeApp({ credential: cert(sa), projectId: sa.project_id }, 'jerttech');
  return app;
}

export const adminAuth = () => getAuth(adminApp());

let db: Firestore | undefined;
/** The JertTech Firestore database (a named database, set by FIRESTORE_DATABASE_ID). */
export function firestore() {
  if (db) return db;
  db = getFirestore(adminApp(), process.env.FIRESTORE_DATABASE_ID!);
  try { db.settings({ ignoreUndefinedProperties: true }); } catch { /* already set after a hot reload */ }
  return db;
}
