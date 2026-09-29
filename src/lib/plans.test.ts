import { describe, expect, it } from '@jest/globals';
import { cleanText, planProgress, sortPlans } from './plans';

describe('cleanText', () => {
  it('trims, collapses spaces and caps length', () => {
    expect(cleanText('  finish   the\n draft  ', 90)).toBe('finish the draft');
    expect(cleanText('abcdef', 3)).toBe('abc');
    expect(cleanText('ab   cd', 3)).toBe('ab');
    expect(cleanText('   ', 10)).toBe('');
  });
});

describe('plans', () => {
  const plans = [
    { id: 'a', text: 'A', entry_id: 'e1' },
    { id: 'b', text: 'B', entry_id: null },
    { id: 'c', text: 'C', entry_id: null },
  ];
  it('counts ticked-off plans', () => {
    expect(planProgress(plans)).toEqual({ done: 1, total: 3 });
    expect(planProgress([])).toEqual({ done: 0, total: 0 });
  });
  it('puts unfinished plans first, keeping order', () => {
    expect(sortPlans(plans).map((p) => p.id)).toEqual(['b', 'c', 'a']);
  });
});
