import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useCelebrate } from '@/components/Celebrate';
import type { CategoryKey } from '@/lib/categories';
import { ymd } from '@/lib/dates';
import { cancelFocusAlarm, scheduleFocusAlarm } from '@/lib/notifications';
import * as P from '@/lib/pomodoro';

/**
 * The focus (pomodoro) timer. Lives above the tabs so it keeps running while you look
 * at other screens, and is saved to the phone so it survives the app being closed:
 * a running phase is just "ends at <time>", worked out again on return.
 */
type Stats = { day: string; minutes: number; rounds: number };
/** Set when a focus round finishes, so the Focus tab can offer to log it as a win. */
export type Finished = { minutes: number; task: string; category: CategoryKey; at: number } | null;

type Saved = { settings: P.FocusSettings; timer: P.TimerState; stats: Stats; task: string; category: CategoryKey };

type FocusState = {
  settings: P.FocusSettings;
  timer: P.TimerState;
  /** Seconds left, updated every second while running. */
  left: number;
  /** Focus minutes and rounds finished today. */
  stats: Stats;
  task: string;
  category: CategoryKey;
  finished: Finished;
  setTask: (t: string) => void;
  setCategory: (c: CategoryKey) => void;
  updateSettings: (patch: Partial<P.FocusSettings>) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  switchMode: (m: P.Mode) => void;
  clearFinished: () => void;
};

const KEY = 'sprout:focus:v1';
const Ctx = createContext<FocusState | null>(null);

const freshStats = (): Stats => ({ day: ymd(new Date()), minutes: 0, rounds: 0 });

function alarmText(mode: P.Mode): [string, string] {
  return mode === 'focus' ? ['Focus round done 🍅', 'Nice work. Log what you got done, then take a break.'] : ['Break’s over', 'Ready for another focus round?'];
}

export function FocusProvider({ children }: { children: ReactNode }) {
  const celebrate = useCelebrate();
  const [loaded, setLoaded] = useState(false);
  const [settings, setSettings] = useState<P.FocusSettings>(P.DEFAULT_SETTINGS);
  const [timer, setTimer] = useState<P.TimerState>(() => P.initialState(P.DEFAULT_SETTINGS));
  const [stats, setStats] = useState<Stats>(freshStats);
  const [task, setTask] = useState('');
  const [category, setCategory] = useState<CategoryKey>('study');
  const [finished, setFinished] = useState<Finished>(null);
  const [now, setNow] = useState(() => Date.now());
  const latest = useRef({ settings, task, category });
  useEffect(() => {
    latest.current = { settings, task, category };
  }, [settings, task, category]);

  // restore
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!raw) return;
        const s = JSON.parse(raw) as Saved;
        setSettings({ ...P.DEFAULT_SETTINGS, ...s.settings });
        setTimer(s.timer);
        setStats(s.stats?.day === ymd(new Date()) ? s.stats : freshStats());
        setTask(s.task ?? '');
        if (s.category) setCategory(s.category);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // save
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(KEY, JSON.stringify({ settings, timer, stats, task, category } satisfies Saved)).catch(() => {});
  }, [loaded, settings, timer, stats, task, category]);

  // tick while running, and catch up after the app was in the background
  useEffect(() => {
    if (timer.status !== 'running') return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && setNow(Date.now()));
    return () => {
      clearInterval(t);
      sub.remove();
    };
  }, [timer.status]);

  // phase finished?
  useEffect(() => {
    if (timer.status !== 'running' || !timer.endsAt || now < timer.endsAt) return;
    const s = latest.current.settings;
    let t = timer;
    let focusDone = 0;
    // walk forward through every phase that ended while we weren't looking
    for (let i = 0; i < 12 && t.status === 'running' && t.endsAt && t.endsAt <= now; i++) {
      if (t.mode === 'focus') focusDone += 1;
      t = P.advance(t, s, true, t.endsAt);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to the clock passing the end time
    setTimer(t);
    if (t.status === 'running' && t.endsAt) {
      const [title, body] = alarmText(t.mode);
      scheduleFocusAlarm((t.endsAt - Date.now()) / 1000, title, body);
    }
    if (focusDone > 0) {
      const today = ymd(new Date());
      setStats((st) => {
        const base = st.day === today ? st : freshStats();
        return { ...base, minutes: base.minutes + focusDone * s.focus, rounds: base.rounds + focusDone };
      });
      setFinished({ minutes: s.focus, task: latest.current.task, category: latest.current.category, at: Date.now() });
      celebrate({ title: 'Focus round done!', sub: `${s.focus} minutes of deep work. Take a breather.`, emoji: ['🍅', '✨', '🌱', '💚'] });
    } else {
      celebrate({ title: 'Break’s over', sub: 'Ready when you are.', emoji: ['☕️', '✨'] });
    }
  }, [now, timer, celebrate]);

  const start = useCallback(() => {
    setTimer((t) => {
      const next = P.start(t);
      const [title, body] = alarmText(next.mode);
      scheduleFocusAlarm(next.left, title, body);
      return next;
    });
    setNow(Date.now());
  }, []);

  const pause = useCallback(() => {
    cancelFocusAlarm();
    setTimer((t) => P.pause(t));
  }, []);

  const reset = useCallback(() => {
    cancelFocusAlarm();
    setTimer((t) => P.reset(t, latest.current.settings));
  }, []);

  const skip = useCallback(() => {
    cancelFocusAlarm();
    setTimer((t) => P.advance(t, latest.current.settings, false));
  }, []);

  const switchMode = useCallback((m: P.Mode) => {
    cancelFocusAlarm();
    setTimer((t) => P.switchMode(t, m, latest.current.settings));
  }, []);

  const updateSettings = useCallback((patch: Partial<P.FocusSettings>) => {
    setSettings((s) => {
      const next = { ...s, ...patch };
      // an idle timer shows the new length straight away
      setTimer((t) => (t.status === 'idle' ? P.reset(t, next) : t));
      return next;
    });
  }, []);

  const left = P.secondsLeft(timer, now);

  const value = useMemo<FocusState>(
    () => ({
      settings,
      timer,
      left,
      stats: stats.day === ymd(new Date(now)) ? stats : freshStats(),
      task,
      category,
      finished,
      setTask,
      setCategory,
      updateSettings,
      start,
      pause,
      reset,
      skip,
      switchMode,
      clearFinished: () => setFinished(null),
    }),
    [settings, timer, left, stats, now, task, category, finished, updateSettings, start, pause, reset, skip, switchMode],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFocus() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useFocus must be used inside FocusProvider');
  return v;
}
