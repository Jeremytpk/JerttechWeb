// Firestore data helpers. Server only.
//
// Collections (document IDs are random unless noted):
//   profiles/{firebase uid}  email, full_name, phone, role ('customer' | 'admin'), stripe_customer_id, created_at
//   projects                 customer_id, tracking, type, name, idea, plan, addons[], deadline, stage, status,
//                            quote_cents, stripe_subscription_id, offline_at, created_at
//   payments/{stripe ref}    project_id, customer_id, amount_cents, description, status, stripe_ref, created_at
//   change_requests          project_id, customer_id, kind, urgency, description, included, urgent_included,
//                            price_cents (null = to be quoted), status, billed, created_at
//   code_requests            project_id, customer_id, price_cents, status, created_at
//   cancellations            project_id, customer_id, option, status, created_at
//   activity                 message, created_at
//   counters/tracking        value (last tracking number used)
// Dates are ISO strings, so they sort as text and pass straight to the pages.
import { firestore } from '@/lib/firebase/admin';

export type Row = Record<string, any> & { id: string };

export const now = () => new Date().toISOString();
export const col = (name: string) => firestore().collection(name);
const rows = (s: FirebaseFirestore.QuerySnapshot) => s.docs.map(d => ({ id: d.id, ...d.data() }) as Row);

export async function getRow(name: string, id: string): Promise<Row | null> {
  if (!id) return null;
  const s = await col(name).doc(id).get();
  return s.exists ? ({ id: s.id, ...s.data() } as Row) : null;
}
export async function findRows(name: string, field: string, value: unknown) {
  return rows(await col(name).where(field, '==', value).get());
}
export async function allRows(name: string) {
  return rows(await col(name).get());
}
export async function addRow(name: string, data: Record<string, unknown>) {
  const ref = await col(name).add({ ...data, created_at: now() });
  return ref.id;
}
export async function updateRow(name: string, id: string, data: Record<string, unknown>) {
  await col(name).doc(id).update(data);
}

/** Newest first. */
export const newest = (a: Row, b: Row) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0);

/** Next tracking code: JT-1001, JT-1002… */
export async function nextTracking() {
  const ref = col('counters').doc('tracking');
  const n = await firestore().runTransaction(async t => {
    const s = await t.get(ref);
    const value = (s.exists ? Number(s.data()!.value) : 1000) + 1;
    t.set(ref, { value });
    return value;
  });
  return `JT-${n}`;
}

export async function logActivity(message: string) {
  await addRow('activity', { message });
}
