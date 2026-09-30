import { describe, expect, it } from '@jest/globals';
import { dailyPrompt, example, greeting, PROMPTS, winMessage } from './cheer';

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
