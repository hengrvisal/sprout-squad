import { describe, expect, it } from '@jest/globals';
import { eveningSlots, hourLabel } from './reminders';

describe('eveningSlots', () => {
  const afternoon = new Date(2026, 8, 30, 15, 0);
  it('includes tonight when nothing is logged yet', () => {
    const s = eveningSlots(afternoon, false, 20, 3);
    expect(s.map((d) => [d.getDate(), d.getHours()])).toEqual([[30, 20], [1, 20], [2, 20]]);
  });
  it('skips tonight once something is logged', () => {
    expect(eveningSlots(afternoon, true, 20, 2).map((d) => d.getDate())).toEqual([1, 2]);
  });
  it('skips tonight if the time has passed', () => {
    expect(eveningSlots(new Date(2026, 8, 30, 21, 5), false, 20, 1)[0].getDate()).toBe(1);
  });
  it('always returns the number asked for', () => {
    expect(eveningSlots(afternoon, true, 20, 7)).toHaveLength(7);
  });
});

describe('hourLabel', () => {
  it('formats evening hours', () => {
    expect(hourLabel(20)).toBe('8pm');
    expect(hourLabel(12)).toBe('12pm');
  });
});
