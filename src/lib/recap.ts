/**
 * "Your last 7 days": the evidence view for days that feel unproductive (pure, tested).
 * Every line it writes is true and never negative: comparisons only appear when they're good.
 */
import { CATEGORIES } from './categories';
import { addDays, DayCounts, DayKey, streak, ymd } from './dates';

export type RecapEntry = { id: string; text: string; category: string; done_on: DayKey };
export type RecapDay = { key: DayKey; label: string; entries: RecapEntry[] };
export type Recap = { days: RecapDay[]; total: number; activeDays: number; lines: string[] };

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const n = (k: number, one: string, many: string) => `${k} ${k === 1 ? one : many}`;

/** "Today", "Yesterday", "Mon 22 Sep" */
export function dayLabel(key: DayKey, today = new Date()): string {
  if (key === ymd(today)) return 'Today';
  if (key === ymd(addDays(today, -1))) return 'Yesterday';
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${SHORT[date.getDay()]} ${d} ${MONTHS[m - 1]}`;
}

/** The last `count` days, newest first. */
export function lastDays(count: number, today = new Date()): DayKey[] {
  return Array.from({ length: count }, (_, i) => ymd(addDays(today, -i)));
}

export function weekRecap(entries: RecapEntry[], counts: DayCounts, today = new Date()): Recap {
  const keys = lastDays(7, today);
  const inWeek = entries.filter((e) => keys.includes(e.done_on));
  const days = keys.map((key) => ({ key, label: dayLabel(key, today), entries: inWeek.filter((e) => e.done_on === key) }));
  const total = inWeek.length;
  const activeDays = days.filter((d) => d.entries.length > 0).length;

  if (total === 0) {
    return { days, total, activeDays, lines: ['Nothing logged in the last 7 days yet.', 'One small thing is enough to start.'] };
  }

  const lines = [`${n(total, 'thing', 'things')} done across ${n(activeDays, 'day', 'days')}.`];

  // the 7 days before, from the grid counts (only mentioned when it's good news)
  const prev = lastDays(14, today).slice(7).reduce((a, k) => a + (counts[k] ?? 0), 0);
  if (prev > 0 && total > prev) lines.push(`That’s more than the 7 days before (${prev}).`);
  else if (prev > 0 && total === prev) lines.push('Same as the week before. Steady.');

  const byCat = CATEGORIES.map((c) => ({ label: c.label, k: inWeek.filter((e) => e.category === c.key).length })).sort((a, b) => b.k - a.k);
  if (total >= 3 && byCat[0].k / total >= 0.4) lines.push(`Mostly ${byCat[0].label}: ${byCat[0].k} of ${total}.`);

  const busiest = [...days].sort((a, b) => b.entries.length - a.entries.length)[0];
  if (activeDays >= 2 && busiest.entries.length >= 2) {
    const [y, m, d] = busiest.key.split('-').map(Number);
    const name = busiest.label === 'Today' || busiest.label === 'Yesterday' ? busiest.label : WEEKDAYS[new Date(y, m - 1, d).getDay()];
    lines.push(`${name} was your big day (${busiest.entries.length}).`);
  }

  const st = streak(counts, today);
  if (st >= 3) lines.push(`${st} days in a row right now.`);
  return { days, total, activeDays, lines };
}

/** A Postgres ILIKE pattern matching `q` anywhere, with its wildcards escaped. */
export function containsPattern(q: string): string {
  return `%${q.trim().replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;
}
