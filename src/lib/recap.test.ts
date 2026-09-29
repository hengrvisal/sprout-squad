import { describe, expect, it } from '@jest/globals';
import { containsPattern, dayLabel, lastDays, weekRecap } from './recap';

const today = new Date(2026, 8, 30); // Wed 30 Sep 2026
const e = (id: string, done_on: string, category = 'study') => ({ id, text: id, category, done_on });

describe('dayLabel', () => {
  it('names today and yesterday, then short dates', () => {
    expect(dayLabel('2026-09-30', today)).toBe('Today');
    expect(dayLabel('2026-09-29', today)).toBe('Yesterday');
    expect(dayLabel('2026-09-28', today)).toBe('Mon 28 Sep');
  });
});

describe('lastDays', () => {
  it('lists days newest first, across a month boundary', () => {
    expect(lastDays(3, new Date(2026, 9, 1))).toEqual(['2026-10-01', '2026-09-30', '2026-09-29']);
  });
});

describe('weekRecap', () => {
  it('is encouraging when the week is empty', () => {
    const r = weekRecap([], {}, today);
    expect(r.total).toBe(0);
    expect(r.days).toHaveLength(7);
    expect(r.lines[0]).toMatch(/Nothing logged/);
  });

  it('summarises totals, category, busiest day and streak', () => {
    const entries = [e('a', '2026-09-30'), e('b', '2026-09-29'), e('c', '2026-09-28'), e('d', '2026-09-28'), e('f', '2026-09-28', 'work')];
    const counts = { '2026-09-30': 1, '2026-09-29': 1, '2026-09-28': 3, '2026-09-20': 2 };
    const r = weekRecap(entries, counts, today);
    expect(r.total).toBe(5);
    expect(r.activeDays).toBe(3);
    expect(r.lines).toEqual([
      '5 things done across 3 days.',
      'That’s more than the 7 days before (2).',
      'Mostly Study: 4 of 5.',
      'Monday was your big day (3).',
      '3 days in a row right now.',
    ]);
  });

  it('never compares when the week is lighter than the one before', () => {
    const r = weekRecap([e('a', '2026-09-30')], { '2026-09-30': 1, '2026-09-22': 9 }, today);
    expect(r.lines.join(' ')).not.toMatch(/before/);
    expect(r.lines[0]).toBe('1 thing done across 1 day.');
  });

  it('ignores entries older than 7 days', () => {
    expect(weekRecap([e('old', '2026-09-23')], {}, today).total).toBe(0);
  });
});

describe('containsPattern', () => {
  it('wraps and escapes wildcards', () => {
    expect(containsPattern(' run ')).toBe('%run%');
    expect(containsPattern('100%_done')).toBe('%100\\%\\_done%');
  });
});
