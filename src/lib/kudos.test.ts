import { describe, expect, it } from '@jest/globals';
import { tally } from './kudos';

describe('tally', () => {
  it('counts per emoji in fixed order and drops zeros', () => {
    expect(
      tally([
        { from: 'a', emoji: '👏' },
        { from: 'b', emoji: '🔥' },
        { from: 'c', emoji: '🔥' },
      ]),
    ).toEqual([
      ['🔥', 2],
      ['👏', 1],
    ]);
  });
  it('is empty for no kudos', () => expect(tally([])).toEqual([]));
});
