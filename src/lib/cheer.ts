/** Copy that makes logging feel good (pure, tested). */
import type { CategoryKey } from './categories';

/** The composer's headline. Changes daily so it never goes stale. */
export const PROMPTS = [
  'What did you get done?',
  'What moved forward today?',
  'Brag a little. What’d you do?',
  'Tiny wins count. Name one.',
  'What are you proud of today?',
  'What did future-you thank you for?',
  'What got ticked off?',
] as const;

export function dailyPrompt(d = new Date()): string {
  const dayNo = Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86_400_000);
  return PROMPTS[((dayNo % PROMPTS.length) + PROMPTS.length) % PROMPTS.length];
}

/** Placeholder examples per category, so the box hints at what "counts". */
export const EXAMPLES: Record<CategoryKey, readonly string[]> = {
  study: ['Finished the lab report', 'Revised 2 lectures', 'Did 20 flashcards'],
  work: ['Cleared my inbox', 'Shipped the slide deck', 'Covered a shift'],
  build: ['Fixed that annoying bug', 'Pushed the landing page', 'Set up the database'],
  move: ['5k run 🏃', 'Gym: legs day', '10 min stretch'],
  home: ['Did the laundry', 'Meal-prepped lunches', 'Called mum'],
  create: ['Sketched for 20 min', 'Edited a video', 'Wrote 300 words'],
};

export function example(cat: CategoryKey, n: number): string {
  const list = EXAMPLES[cat];
  return list[((n % list.length) + list.length) % list.length];
}

/** What the celebration says after logging your nth win today. */
export function winMessage(nToday: number, streakDays: number): { title: string; sub: string } {
  if (nToday === 1) {
    if (streakDays >= 2) return { title: `${streakDays}-day streak!`, sub: 'Today’s square is green. Keep it rolling.' };
    return { title: 'Today’s square is green!', sub: 'First win of the day. That’s the hard one.' };
  }
  if (nToday === 3) return { title: 'Hat trick!', sub: 'Three wins today. You’re on a roll.' };
  if (nToday === 5) return { title: 'High five!', sub: 'Five things done. Darkest green unlocked.' };
  if (nToday === 10) return { title: 'Unstoppable', sub: 'Ten wins. Save some for tomorrow 😄' };
  const lines = ['Nice one!', 'Logged!', 'Look at you go!', 'Another one!', 'Stacking wins!'];
  return { title: lines[nToday % lines.length], sub: `${nToday} things done today.` };
}

/** Morning / afternoon / evening greeting. */
export function greeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 5) return 'Up late';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * One encouraging line for a month. Compares only with your own past months, never others.
 */
export function monthCheer(
  counts: Record<string, number>,
  y: number,
  m: number,
  today = new Date(),
): { emoji: string; text: string } {
  const green = (yy: number, mm: number) => {
    const prefix = `${yy}-${String(mm + 1).padStart(2, '0')}-`;
    return Object.entries(counts).filter(([k, n]) => k.startsWith(prefix) && n > 0).length;
  };
  const g = green(y, m);
  const isCurrent = y === today.getFullYear() && m === today.getMonth();
  const prev = m === 0 ? green(y - 1, 11) : green(y, m - 1);
  const elapsed = isCurrent ? today.getDate() : new Date(y, m + 1, 0).getDate();
  let best = 0;
  for (let i = 1; i <= 12; i++) {
    const d = new Date(y, m - i, 1);
    best = Math.max(best, green(d.getFullYear(), d.getMonth()));
  }
  if (g === 0) return isCurrent ? { emoji: '🌱', text: 'A fresh month. Your first green square is one log away.' } : { emoji: '🍃', text: 'A quiet month. That’s allowed.' };
  if (g === elapsed && elapsed >= 3) return { emoji: '🌟', text: isCurrent ? 'Every single day green so far. Unreal.' : 'Every day green. A perfect month.' };
  if (g > best && best > 0) return { emoji: '🏆', text: isCurrent ? 'Already your best month this year!' : 'Your best month this year!' };
  if (isCurrent && prev > g && prev - g <= 3) return { emoji: '🎯', text: `${prev - g + 1} more green ${prev - g + 1 === 1 ? 'day' : 'days'} to beat last month.` };
  if (isCurrent && g >= prev && prev > 0) return { emoji: '📈', text: 'Ahead of last month. Nice momentum.' };
  const pct = Math.round((g / elapsed) * 100);
  if (pct >= 60) return { emoji: '💪', text: `Green on ${pct}% of days. Solid rhythm.` };
  return { emoji: '🌿', text: `${g} green ${g === 1 ? 'day' : 'days'}. Every one of them counts.` };
}
