import { describe, expect, it } from '@jest/globals';
import { clock, isLive, leftLabel, namesLabel, secondsLeft } from './sessions';

const now = new Date('2026-09-30T10:00:00Z').getTime();
const ends = (min: number) => ({ ends_at: new Date(now + min * 60_000).toISOString() });

describe('session timing', () => {
  it('knows when a session is live', () => {
    expect(isLive(ends(5), now)).toBe(true);
    expect(isLive(ends(0), now)).toBe(false);
    expect(isLive(ends(-1), now)).toBe(false);
  });
  it('counts seconds left, never negative', () => {
    expect(secondsLeft(ends(2), now)).toBe(120);
    expect(secondsLeft(ends(-3), now)).toBe(0);
  });
  it('labels time left', () => {
    expect(leftLabel(0)).toBe('Finished');
    expect(leftLabel(30)).toBe('Under a minute left');
    expect(leftLabel(17 * 60 + 5)).toBe('18 min left');
    expect(leftLabel(70 * 60)).toBe('1 h 10 min left');
    expect(leftLabel(90 * 60)).toBe('1 h 30 min left');
    expect(leftLabel(120 * 60)).toBe('2 h left');
  });
  it('formats a countdown clock', () => {
    expect(clock(17 * 60 + 42)).toBe('17:42');
    expect(clock(65 * 60)).toBe('1:05:00');
    expect(clock(-5)).toBe('0:00');
  });
});

describe('namesLabel', () => {
  it('joins names naturally', () => {
    expect(namesLabel([])).toBe('');
    expect(namesLabel(['Mia'])).toBe('Mia');
    expect(namesLabel(['Mia', 'Jun'])).toBe('Mia and Jun');
    expect(namesLabel(['Mia', 'Jun', 'Ari', 'You'])).toBe('Mia, Jun and 2 more');
  });
});
