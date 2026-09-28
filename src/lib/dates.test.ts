import { describe, expect, it } from "@jest/globals";
import { level, monthCells, monthStats, streak, weekTotal, monthAt, monthRange } from './dates';

const TODAY = new Date(2026, 8, 29); // Tue 29 Sep 2026

describe('level', () => {
  it('buckets counts like the prototype', () => {
    expect([0, 1, 2, 3, 4, 5, 12].map(level)).toEqual([0, 1, 2, 3, 3, 4, 4]);
  });
});

describe('monthCells', () => {
  it('pads to Monday and marks today/future', () => {
    const cells = monthCells(2026, 8, { '2026-09-29': 2 }, TODAY);
    // 1 Sep 2026 is a Tuesday -> one leading pad
    expect(cells[0]).toEqual({ kind: 'pad' });
    const days = cells.filter((c) => c.kind === 'day');
    expect(days).toHaveLength(30);
    const today = days.find((c) => c.kind === 'day' && c.isToday);
    expect(today).toMatchObject({ day: 29, count: 2, level: 2 });
    expect(days[29]).toMatchObject({ day: 30, isFuture: true, count: 0 });
  });
});

describe('streak', () => {
  it('counts back from today', () => {
    expect(streak({ '2026-09-29': 1, '2026-09-28': 3, '2026-09-27': 1, '2026-09-25': 1 }, TODAY)).toBe(3);
  });
  it('keeps yesterday’s streak alive while today is empty', () => {
    expect(streak({ '2026-09-28': 1, '2026-09-27': 1 }, TODAY)).toBe(2);
  });
  it('is zero after a gap', () => {
    expect(streak({ '2026-09-26': 1 }, TODAY)).toBe(0);
  });
});

describe('weekTotal / monthStats', () => {
  const counts = { '2026-09-29': 2, '2026-09-23': 1, '2026-09-22': 5, '2026-08-31': 4 };
  it('sums the last 7 days', () => expect(weekTotal(counts, TODAY)).toBe(3));
  it('summarises a month', () => expect(monthStats(counts, 2026, 8)).toEqual({ greenDays: 3, items: 8 }));
});

describe('monthAt / monthRange', () => {
  it('crosses year boundaries', () => {
    expect(monthAt(-9, TODAY)).toEqual({ y: 2025, m: 11 });
    expect(monthRange(2024, 1)).toEqual({ from: '2024-02-01', to: '2024-02-29' });
  });
});
