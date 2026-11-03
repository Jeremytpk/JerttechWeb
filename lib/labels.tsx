export const STATUS: Record<string, [string, string]> = {
  building: ['Building', 'p-warn'], live: ['Live', 'p-ok'], maintenance: ['Maintenance only', 'p-info'],
  closing: ['Shutting down', 'p-bad'], cancelled: ['Offline', 'p-neutral'], bought: ['Code bought', 'p-neutral'],
};
export const PAY: Record<string, [string, string]> = { paid: ['Paid', 'p-ok'], failed: ['Failed', 'p-bad'], pending: ['Pending', 'p-warn'] };
export const CH: Record<string, [string, string]> = { new: ['New', 'p-info'], progress: ['In progress', 'p-warn'], done: ['Done', 'p-ok'], declined: ['Declined', 'p-neutral'] };
export const CODE: Record<string, [string, string]> = { pending: ['Pending', 'p-warn'], approved: ['Approved, awaiting payment', 'p-info'], declined: ['Declined', 'p-neutral'], paid: ['Paid', 'p-ok'] };
export const CH_TYPE: Record<string, string> = { small: 'Small', medium: 'Medium', large: 'Large (new feature)' };
export const URG: Record<string, string> = { normal: 'Normal', urgent: 'Urgent (24 hours)', emergency: 'Emergency (4 hours)' };
export const CANCEL_OPT: Record<string, string> = { maintenance: 'Keep online for $2.99/week', buyout: 'Buy the code', shutdown: 'Shut down after 14 days' };
export const fdate = (t: string | number | Date) => new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
export function Pill({ map, k }: { map: Record<string, [string, string]>; k: string }) {
  const x = map[k] || [k, 'p-neutral'];
  return <span className={`pill ${x[1]}`}>{x[0]}</span>;
}
