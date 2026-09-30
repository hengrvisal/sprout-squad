import { describe, expect, it } from '@jest/globals';
import { advance, clampSetting, dialMinutes, sessionName, clock, DEFAULT_SETTINGS as S, initialState, minutesLabel, pause, progress, secondsLeft, start } from './pomodoro';

const T0 = 1_000_000;

describe('pomodoro', () => {
  it('starts, counts down and pauses where it was', () => {
    const t = start(initialState(S), T0);
    expect(secondsLeft(t, T0 + 60_000)).toBe(24 * 60);
    const p = pause(t, T0 + 90_000);
    expect(p).toMatchObject({ status: 'paused', left: 25 * 60 - 90 });
    expect(secondsLeft(p, T0 + 999_999)).toBe(25 * 60 - 90);
    expect(start(p, T0 + 100_000).endsAt).toBe(T0 + 100_000 + (25 * 60 - 90) * 1000);
  });

  it('goes focus → short break, and a long break every N rounds', () => {
    let t = initialState(S);
    const seq: string[] = [];
    for (let i = 0; i < 8; i++) {
      t = advance(t, S, true, T0);
      seq.push(t.mode);
    }
    expect(seq).toEqual(['short', 'focus', 'short', 'focus', 'short', 'focus', 'long', 'focus']);
    expect(t.done).toBe(0); // cycle resets after the long break
  });

  it('auto-starts breaks but waits for you before focus (defaults)', () => {
    const brk = advance(initialState(S), S, true, T0);
    expect(brk).toMatchObject({ mode: 'short', status: 'running', endsAt: T0 + 5 * 60_000 });
    expect(advance(brk, S, true, T0)).toMatchObject({ mode: 'focus', status: 'idle', left: 25 * 60 });
  });

  it('a skipped focus is not a round and never auto-starts', () => {
    const t = advance(initialState(S), S, false, T0);
    expect(t).toMatchObject({ mode: 'short', done: 0, status: 'idle' });
  });

  it('reports progress for the ring', () => {
    const t = start(initialState(S), T0);
    expect(progress(t, S, T0)).toBe(0);
    expect(progress(t, S, T0 + 12.5 * 60_000)).toBeCloseTo(0.5);
  });

  it('formats and clamps', () => {
    expect(clock(25 * 60)).toBe('25:00');
    expect(clock(65)).toBe('01:05');
    expect(clock(3900)).toBe('1:05:00');
    expect(minutesLabel(75)).toBe('1 h 15 min');
    expect(clampSetting('focus', 200)).toBe(120);
    expect(clampSetting('rounds', 1)).toBe(2);
  });
});

describe('dial + names', () => {
  it('names sessions by length', () => {
    expect(sessionName('focus', 25)).toBe('Pomodoro');
    expect(sessionName('focus', 50)).toBe('Deep focus');
    expect(sessionName('focus', 90)).toBe('Deep work');
    expect(sessionName('focus', 10)).toBe('Quick sprint');
    expect(sessionName('short', 5)).toBe('Short break');
  });
  it('turns, snaps and clamps', () => {
    expect(dialMinutes(25, 0.25, 'focus')).toBe(40);
    expect(dialMinutes(25, 0.03, 'focus')).toBe(25);
    expect(dialMinutes(25, -1, 'focus')).toBe(5);
    expect(dialMinutes(25, 3, 'focus')).toBe(120);
    expect(dialMinutes(5, 0.05, 'short')).toBe(8);
  });
});
