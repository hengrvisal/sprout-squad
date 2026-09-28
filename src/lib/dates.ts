/** Pure date + grid helpers. All dates are LOCAL calendar days as "YYYY-MM-DD". */

export type DayKey = string;
export type DayCounts = Record<DayKey, number>;

const pad = (n: number) => String(n).padStart(2, '0');

export function ymd(d: Date): DayKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

/** Year/month `offset` months from `from` (0 = this month, -1 = last month). */
export function monthAt(offset: number, from = new Date()): { y: number; m: number } {
  const d = new Date(from.getFullYear(), from.getMonth() + offset, 1);
  return { y: d.getFullYear(), m: d.getMonth() };
}

export function monthRange(y: number, m: number): { from: DayKey; to: DayKey } {
  return { from: ymd(new Date(y, m, 1)), to: ymd(new Date(y, m + 1, 0)) };
}

/** Intensity 0–4, matching the prototype: 0, 1, 2, 3–4, 5+. */
export function level(n: number): 0 | 1 | 2 | 3 | 4 {
  if (n <= 0) return 0;
  if (n === 1) return 1;
  if (n === 2) return 2;
  if (n <= 4) return 3;
  return 4;
}

export type MonthCell =
  | { kind: 'pad' }
  | { kind: 'day'; day: number; key: DayKey; count: number; level: 0 | 1 | 2 | 3 | 4; isToday: boolean; isFuture: boolean };

/** Monday-first calendar cells for a month: leading pads, then one cell per day. */
export function monthCells(y: number, m: number, counts: DayCounts, today = new Date()): MonthCell[] {
  const t = startOfDay(today);
  const todayKey = ymd(t);
  const lead = (new Date(y, m, 1).getDay() + 6) % 7;
  const days = new Date(y, m + 1, 0).getDate();
  const cells: MonthCell[] = Array.from({ length: lead }, () => ({ kind: 'pad' as const }));
  for (let day = 1; day <= days; day++) {
    const d = new Date(y, m, day);
    const key = ymd(d);
    const isFuture = d > t;
    const count = isFuture ? 0 : counts[key] ?? 0;
    cells.push({ kind: 'day', day, key, count, level: level(count), isToday: key === todayKey, isFuture });
  }
  return cells;
}

/** Consecutive active days ending today (or yesterday, if today is still empty). */
export function streak(counts: DayCounts, today = new Date()): number {
  let d = startOfDay(today);
  if (!counts[ymd(d)]) d = addDays(d, -1);
  let n = 0;
  while (counts[ymd(d)]) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

/** Items logged over the last 7 days including today. */
export function weekTotal(counts: DayCounts, today = new Date()): number {
  let t = 0;
  for (let i = 0; i < 7; i++) t += counts[ymd(addDays(today, -i))] ?? 0;
  return t;
}

export function monthStats(counts: DayCounts, y: number, m: number): { greenDays: number; items: number } {
  const prefix = `${y}-${pad(m + 1)}-`;
  let greenDays = 0;
  let items = 0;
  for (const [k, n] of Object.entries(counts)) {
    if (k.startsWith(prefix) && n > 0) {
      greenDays++;
      items += n;
    }
  }
  return { greenDays, items };
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}
