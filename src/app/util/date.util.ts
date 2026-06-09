/* Date helpers — local-time ISO (YYYY-MM-DD) and display formatting. */

const pad = (n: number): string => String(n).padStart(2, '0');

export function isoOf(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO(): string {
  return isoOf(new Date());
}

export function mondayOf(iso: string): Date {
  const d = new Date(iso + 'T00:00:00');
  const wd = d.getDay(); // 0 Sun..6 Sat
  d.setDate(d.getDate() + (wd === 0 ? -6 : 1 - wd));
  return d;
}

/** Weekday index for an ISO date: 0 = Mon … 6 = Sun. */
export function weekdayIndex(iso: string): number {
  return (new Date(iso + 'T00:00:00').getDay() + 6) % 7;
}

export function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d
    .toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    .toUpperCase();
}
