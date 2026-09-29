import { describe, expect, it } from '@jest/globals';
import { assignLeaves, healthLabel, plantModel, stageFor } from './plant';

describe('stageFor', () => {
  it('maps growth to stages with progress to the next', () => {
    expect(stageFor(0)).toMatchObject({ index: 0, name: 'Seed' });
    expect(stageFor(10)).toMatchObject({ index: 1, name: 'Sprout' });
    const s = stageFor(62.5);
    expect(s).toMatchObject({ index: 2, name: 'Seedling', next: { name: 'Sapling', in: 28 } });
    expect(s.progress).toBeCloseTo(0.5);
    expect(stageFor(10_000)).toMatchObject({ name: 'Fruiting', progress: 1, next: null });
  });
});

describe('assignLeaves', () => {
  it('splits leaves by recent activity and skips inactive members', () => {
    const owners = assignLeaves(8, [{ recent_days: 6 }, { recent_days: 2 }, { recent_days: 0 }]);
    expect(owners).toHaveLength(8);
    expect(owners.filter((o) => o === 0)).toHaveLength(6);
    expect(owners.filter((o) => o === 1)).toHaveLength(2);
    expect(owners).not.toContain(2);
  });
  it('spreads colours along the stem', () => {
    expect(assignLeaves(4, [{ recent_days: 1 }, { recent_days: 1 }])).toEqual([0, 1, 0, 1]);
  });
  it('still draws leaves when nobody has been active', () => {
    expect(assignLeaves(2, [{ recent_days: 0 }, { recent_days: 0 }])).toEqual([0, 1]);
  });
});

describe('plantModel', () => {
  const members = [{ recent_days: 3 }, { recent_days: 3 }];
  it('is just a seed at stage 0', () => {
    expect(plantModel(0, 0, 1, false, members)).toMatchObject({ seed: true, leaves: [] });
  });
  it('adds leaves, branches and blossoms as it grows', () => {
    expect(plantModel(1, 0, 1, false, members).leaves).toHaveLength(2);
    expect(plantModel(3, 0, 1, false, members).leaves).toHaveLength(8);
    const bush = plantModel(4, 0, 1, false, members);
    expect(bush.stems.length).toBeGreaterThan(1);
    expect(plantModel(5, 0, 1, false, members).blossoms.length).toBeGreaterThan(0);
    expect(plantModel(6, 0, 1, false, members).blossoms.some((b) => b.kind === 'fruit')).toBe(true);
  });
  it('hides blossoms and shrinks leaves when thirsty', () => {
    const lush = plantModel(5, 0, 1, false, members);
    const dry = plantModel(5, 0, 0, true, members);
    expect(dry.blossoms).toHaveLength(0);
    expect(dry.leaves[0].size).toBeLessThan(lush.leaves[0].size);
  });
  it('is stable for the same squad', () => {
    expect(plantModel(4, 0.3, 0.5, false, members, 'abc')).toEqual(plantModel(4, 0.3, 0.5, false, members, 'abc'));
  });
});

describe('healthLabel', () => {
  it('words health kindly', () => {
    expect(healthLabel(0.8, false).tone).toBe('good');
    expect(healthLabel(0.1, false).tone).toBe('low');
    expect(healthLabel(0.9, true).label).toMatch(/Thirsty/);
  });
});
