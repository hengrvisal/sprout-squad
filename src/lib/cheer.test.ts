import { describe, expect, it } from '@jest/globals';
import { dailyPrompt, example, greeting, monthCheer, PROMPTS, winMessage } from './cheer';

describe('cheer', () => {
  it('picks one prompt per day and rotates', () => {
    const a = dailyPrompt(new Date(2026, 8, 29, 8));
    expect(dailyPrompt(new Date(2026, 8, 29, 22))).toBe(a);
    expect(PROMPTS).toContain(a);
    expect(dailyPrompt(new Date(2026, 8, 30))).not.toBe(a);
  });
  it('celebrates milestones', () => {
    expect(winMessage(1, 0).title).toMatch(/green/);
    expect(winMessage(1, 4).title).toBe('4-day streak!');
    expect(winMessage(3, 4).title).toBe('Hat trick!');
    expect(winMessage(7, 4).sub).toMatch(/7 things/);
  });
  it('cycles examples and greets by time of day', () => {
    expect(example('move', 3)).toBe(example('move', 0));
    expect(greeting(new Date(2026, 0, 1, 9))).toBe('Good morning');
    expect(greeting(new Date(2026, 0, 1, 20))).toBe('Good evening');
  });
});

describe('monthCheer', () => {
  const today = new Date(2026, 8, 10);
  it('invites on an empty month and celebrates a perfect one', () => {
    expect(monthCheer({}, 2026, 8, today).text).toMatch(/fresh month/);
    const all: Record<string, number> = {};
    for (let d = 1; d <= 10; d++) all[`2026-09-${String(d).padStart(2, '0')}`] = 1;
    expect(monthCheer(all, 2026, 8, today).emoji).toBe('🌟');
  });
  it('compares with your own past months', () => {
    const c = { '2026-08-01': 1, '2026-09-01': 1, '2026-09-03': 1 };
    expect(monthCheer(c, 2026, 8, today).text).toMatch(/best month/);
    const c2 = { '2026-08-01': 1, '2026-08-02': 1, '2026-08-03': 1, '2026-09-01': 1 };
    expect(monthCheer(c2, 2026, 8, today).text).toMatch(/3 more green days to beat last month/);
  });
});
