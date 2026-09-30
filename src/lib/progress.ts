/** Gardener levels and badges for the Me page (pure, tested). Personal only: no rankings. */
import { DayCounts, longestStreak } from './dates';

export const LEVELS = [
  { name: 'Seed', at: 0, emoji: '🌰' },
  { name: 'Sprout', at: 10, emoji: '🌱' },
  { name: 'Seedling', at: 30, emoji: '🌿' },
  { name: 'Sapling', at: 75, emoji: '🪴' },
  { name: 'Young tree', at: 150, emoji: '🌳' },
  { name: 'Old oak', at: 300, emoji: '🌲' },
  { name: 'Forest', at: 600, emoji: '🏞️' },
] as const;

/** Level from lifetime things done, with progress to the next one. */
export function gardenerLevel(total: number) {
  let i = 0;
  while (i + 1 < LEVELS.length && total >= LEVELS[i + 1].at) i++;
  const cur = LEVELS[i];
  const next = LEVELS[i + 1] ?? null;
  const progress = next ? (total - cur.at) / (next.at - cur.at) : 1;
  return { index: i + 1, ...cur, next, progress, toNext: next ? next.at - total : 0 };
}

export type Badge = { id: string; emoji: string; name: string; how: string; earned: boolean };

export function badges(counts: DayCounts): Badge[] {
  const days = Object.values(counts).filter((n) => n > 0);
  const total = days.reduce((a, n) => a + n, 0);
  const green = days.length;
  const best = longestStreak(counts);
  const bigDay = Math.max(0, ...days);
  const weekends = Object.entries(counts).filter(([k, n]) => {
    if (n <= 0) return false;
    const [y, m, d] = k.split('-').map(Number);
    const wd = new Date(y, m - 1, d).getDay();
    return wd === 0 || wd === 6;
  }).length;
  return [
    { id: 'first', emoji: '🌱', name: 'First win', how: 'Log your first win', earned: total >= 1 },
    { id: 'streak3', emoji: '🔥', name: 'On a roll', how: '3-day streak', earned: best >= 3 },
    { id: 'streak7', emoji: '⚡️', name: 'Full week', how: '7-day streak', earned: best >= 7 },
    { id: 'streak30', emoji: '🌕', name: 'Moon cycle', how: '30-day streak', earned: best >= 30 },
    { id: 'big', emoji: '🚀', name: 'Big day', how: '5 things in one day', earned: bigDay >= 5 },
    { id: 'weekend', emoji: '🏖️', name: 'Weekend warrior', how: 'Log on 10 weekend days', earned: weekends >= 10 },
    { id: 'wins100', emoji: '💯', name: 'Century', how: '100 things done', earned: total >= 100 },
    { id: 'green50', emoji: '🍀', name: 'Evergreen', how: '50 green days', earned: green >= 50 },
  ];
}
