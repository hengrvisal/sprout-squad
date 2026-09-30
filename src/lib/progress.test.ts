import { describe, expect, it } from '@jest/globals';
import { lastDays, longestStreak, yearWeeks } from './dates';
import { badges, gardenerLevel } from './progress';

describe('longestStreak', () => {
  it('finds the longest run, across month ends', () => {
    expect(longestStreak({ '2026-08-30': 1, '2026-08-31': 2, '2026-09-01': 1, '2026-09-03': 1 })).toBe(3);
    expect(longestStreak({})).toBe(0);
  });
});

describe('lastDays / yearWeeks', () => {
  const today = new Date(2026, 8, 30); // Wed
  it('lists the last n days oldest first', () => {
    const d = lastDays({ '2026-09-30': 2 }, 7, today);
    expect(d).toHaveLength(7);
    expect(d[6]).toMatchObject({ key: '2026-09-30', count: 2, weekday: 2 });
    expect(d[0].key).toBe('2026-09-24');
  });
  it('builds Monday-first weeks from Jan 1 to today', () => {
    const w = yearWeeks({}, today);
    expect(w[0][3]).toMatchObject({ key: '2026-01-01' }); // Jan 1 2026 is a Thursday
    expect(w[0][0]).toBeNull();
    expect(w[w.length - 1][2]).toMatchObject({ key: '2026-09-30' });
    expect(w[w.length - 1][3]).toBeNull();
  });
});

describe('gardenerLevel / badges', () => {
  it('levels up by lifetime wins', () => {
    expect(gardenerLevel(0)).toMatchObject({ name: 'Seed', index: 1, toNext: 10 });
    expect(gardenerLevel(20)).toMatchObject({ name: 'Sprout', progress: 0.5 });
    expect(gardenerLevel(10_000)).toMatchObject({ name: 'Forest', next: null, progress: 1 });
  });
  it('earns badges from counts', () => {
    const b = badges({ '2026-09-01': 5, '2026-09-02': 1, '2026-09-03': 1 });
    const earned = b.filter((x) => x.earned).map((x) => x.id);
    expect(earned).toEqual(['first', 'streak3', 'big']);
  });
});
