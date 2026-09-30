/** Pomodoro timer logic (pure, tested). The hook in hooks/focus.tsx drives it. */

export type Mode = 'focus' | 'short' | 'long';

export type FocusSettings = {
  focus: number; // minutes
  short: number;
  long: number;
  /** Focus rounds before a long break. */
  rounds: number;
  autoBreaks: boolean;
  autoFocus: boolean;
};

export const DEFAULT_SETTINGS: FocusSettings = { focus: 25, short: 5, long: 15, rounds: 4, autoBreaks: true, autoFocus: false };

/** Allowed ranges for the steppers: [min, max, step]. */
export const LIMITS: Record<'focus' | 'short' | 'long' | 'rounds', [number, number, number]> = {
  focus: [5, 120, 5],
  short: [1, 30, 1],
  long: [5, 60, 5],
  rounds: [2, 8, 1],
};

export const MODE_LABEL: Record<Mode, string> = { focus: 'Focus', short: 'Short break', long: 'Long break' };

export type TimerState = {
  mode: Mode;
  /** Focus rounds finished in the current cycle (resets after a long break). */
  done: number;
  status: 'idle' | 'running' | 'paused';
  /** When running: epoch ms the current phase ends. */
  endsAt: number | null;
  /** When idle or paused: seconds left in the phase. */
  left: number;
};

export function clampSetting(key: keyof typeof LIMITS, v: number): number {
  const [min, max] = LIMITS[key];
  return Math.min(max, Math.max(min, Math.round(v)));
}

export function phaseSeconds(mode: Mode, s: FocusSettings): number {
  return (mode === 'focus' ? s.focus : mode === 'short' ? s.short : s.long) * 60;
}

export function initialState(s: FocusSettings): TimerState {
  return { mode: 'focus', done: 0, status: 'idle', endsAt: null, left: phaseSeconds('focus', s) };
}

export function secondsLeft(t: TimerState, now = Date.now()): number {
  if (t.status === 'running' && t.endsAt) return Math.max(0, Math.ceil((t.endsAt - now) / 1000));
  return t.left;
}

export function start(t: TimerState, now = Date.now()): TimerState {
  if (t.status === 'running') return t;
  return { ...t, status: 'running', endsAt: now + t.left * 1000 };
}

export function pause(t: TimerState, now = Date.now()): TimerState {
  if (t.status !== 'running') return t;
  return { ...t, status: 'paused', endsAt: null, left: secondsLeft(t, now) };
}

export function reset(t: TimerState, s: FocusSettings): TimerState {
  return { ...t, status: 'idle', endsAt: null, left: phaseSeconds(t.mode, s) };
}

/** Jump to a mode by hand (the segmented control). */
export function switchMode(t: TimerState, mode: Mode, s: FocusSettings): TimerState {
  return { ...t, mode, status: 'idle', endsAt: null, left: phaseSeconds(mode, s) };
}

/**
 * The phase after this one. Focus → short break, or a long break every `rounds` focus rounds.
 * Any break → focus. `completed` is false when skipped (a skipped focus doesn't count as a round).
 */
export function advance(t: TimerState, s: FocusSettings, completed: boolean, now = Date.now()): TimerState {
  let mode: Mode;
  let done = t.done;
  if (t.mode === 'focus') {
    if (completed) done += 1;
    mode = done > 0 && done % s.rounds === 0 && completed ? 'long' : 'short';
  } else {
    mode = 'focus';
    if (t.mode === 'long') done = 0;
  }
  const auto = mode === 'focus' ? s.autoFocus : s.autoBreaks;
  const left = phaseSeconds(mode, s);
  return auto && completed
    ? { mode, done, status: 'running', endsAt: now + left * 1000, left }
    : { mode, done, status: 'idle', endsAt: null, left };
}

/** 0..1 of the phase used up, for the ring. */
export function progress(t: TimerState, s: FocusSettings, now = Date.now()): number {
  const total = phaseSeconds(t.mode, s);
  return total ? 1 - secondsLeft(t, now) / total : 0;
}

/** "25:00", "1:05:00" */
export function clock(seconds: number): string {
  const x = Math.max(0, Math.round(seconds));
  const pad = (n: number) => String(n).padStart(2, '0');
  const h = Math.floor(x / 3600);
  const m = Math.floor((x % 3600) / 60);
  return h ? `${h}:${pad(m)}:${pad(x % 60)}` : `${pad(m)}:${pad(x % 60)}`;
}

/** "1 h 15 min", "40 min" */
export function minutesLabel(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
