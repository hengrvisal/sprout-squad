import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { CategoryKey } from '@/lib/categories';
import { readCache, writeCache } from '@/lib/cache';
import { addDays, DayCounts, DayKey, monthRange, ymd } from '@/lib/dates';
import { cleanText, MAX_PLANS, Plan, PLAN_MAX_LEN } from '@/lib/plans';
import { supabase } from '@/lib/supabase';
import { useAuth } from './auth';

export type Entry = { id: string; text: string; category: CategoryKey; done_on: DayKey; created_at: string };

type EntriesState = {
  /** Per-day totals for every day loaded so far. */
  counts: DayCounts;
  /** Full rows for today. */
  today: Entry[];
  todayKey: DayKey;
  loading: boolean;
  error: string | null;
  add: (text: string, category: CategoryKey) => Promise<Entry>;
  remove: (id: string) => Promise<void>;
  /** Make sure a month's counts are loaded (for ‹ month navigation). */
  ensureMonth: (y: number, m: number) => void;
  refresh: () => Promise<void>;
  /** Today's plan: up to 3 things you mean to do. Ticking one off logs it. */
  plans: Plan[];
  addPlan: (text: string) => Promise<void>;
  removePlan: (id: string) => Promise<void>;
  completePlan: (id: string, category: CategoryKey) => Promise<void>;
};

const Ctx = createContext<EntriesState | null>(null);

/** Days of counts loaded on start: enough for streaks and the recent months. */
const WINDOW_DAYS = 400;

/** Remounts per user, so signing out or switching accounts starts from clean state. */
export function EntriesProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  return (
    <EntriesStore key={userId ?? 'signed-out'} userId={userId}>
      {children}
    </EntriesStore>
  );
}

function EntriesStore({ children, userId }: { children: ReactNode; userId: string | undefined }) {
  const [counts, setCounts] = useState<DayCounts>({});
  const [today, setToday] = useState<Entry[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [todayKey, setTodayKey] = useState(() => ymd(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedFrom = useRef<DayKey | null>(null);
  const fetched = useRef(false);

  // Show the last-known data straight away (and offline); the network refresh replaces it.
  useEffect(() => {
    if (!userId) return;
    readCache<{ counts: DayCounts; today: Entry[]; todayKey: DayKey; plans?: Plan[] }>(userId, 'entries').then((c) => {
      if (!c || fetched.current) return;
      setCounts(c.counts);
      // yesterday's "today" list (and plan) is stale after midnight
      if (c.todayKey === ymd(new Date())) {
        setToday(c.today);
        setPlans(c.plans ?? []);
      }
      setLoading(false);
    });
  }, [userId]);

  // Keep the cache in step with what's on screen (skipping optimistic temp rows).
  useEffect(() => {
    if (!userId || loading) return;
    writeCache(userId, 'entries', {
      counts,
      today: today.filter((e) => !e.id.startsWith('temp-')),
      todayKey,
      plans: plans.filter((p) => !p.id.startsWith('temp-')),
    });
  }, [userId, loading, counts, today, todayKey, plans]);

  const fetchCounts = useCallback(async (from: DayKey, to: DayKey) => {
    const { data, error } = await supabase.rpc('day_counts', { p_from: from, p_to: to });
    if (error) throw error;
    const next: DayCounts = {};
    for (const row of (data ?? []) as { done_on: string; n: number }[]) next[row.done_on] = row.n;
    return next;
  }, []);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const now = new Date();
    const key = ymd(now);
    const from = ymd(addDays(now, -WINDOW_DAYS));
    try {
      const [c, t, pl] = await Promise.all([
        fetchCounts(from, key),
        supabase
          .from('entries')
          .select('id,text,category,done_on,created_at')
          .eq('done_on', key)
          .order('created_at', { ascending: false }),
        supabase.from('plans').select('id,text,entry_id').eq('user_id', userId).eq('done_on', key).order('created_at'),
      ]);
      if (t.error) throw t.error;
      if (pl.error) throw pl.error;
      fetched.current = true;
      setTodayKey(key);
      setCounts((prev) => {
        // keep older months loaded via ensureMonth, replace the window
        const kept = Object.fromEntries(Object.entries(prev).filter(([k]) => k < from));
        return { ...kept, ...c };
      });
      setToday((t.data ?? []) as Entry[]);
      setPlans((pl.data ?? []) as Plan[]);
      loadedFrom.current = loadedFrom.current && loadedFrom.current < from ? loadedFrom.current : from;
      setError(null);
    } catch {
      setError('Couldn’t reach the server. Showing what’s saved on this phone.');
    } finally {
      setLoading(false);
    }
  }, [userId, fetchCounts]);

  // Initial load. refresh() only sets state after awaiting the network, so this
  // doesn't cascade renders; the lint rule can't see through the async callback.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  // Refetch when the app comes back to the foreground (also rolls "today" over at midnight).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => sub.remove();
  }, [refresh]);

  const ensureMonth = useCallback(
    (y: number, m: number) => {
      const { from, to } = monthRange(y, m);
      if (!userId || (loadedFrom.current && from >= loadedFrom.current)) return;
      fetchCounts(from, to)
        .then((c) => {
          setCounts((prev) => ({ ...prev, ...c }));
          loadedFrom.current = from;
        })
        .catch(() => setError('Could not load that month.'));
    },
    [userId, fetchCounts],
  );

  const add = useCallback(
    async (text: string, category: CategoryKey) => {
      const key = ymd(new Date());
      const tempId = `temp-${Date.now()}`;
      const optimistic: Entry = { id: tempId, text, category, done_on: key, created_at: new Date().toISOString() };
      setToday((t) => [optimistic, ...t]);
      setCounts((c) => ({ ...c, [key]: (c[key] ?? 0) + 1 }));
      const { data, error } = await supabase
        .from('entries')
        .insert({ text, category, done_on: key })
        .select('id,text,category,done_on,created_at')
        .single();
      if (error) {
        setToday((t) => t.filter((e) => e.id !== tempId));
        setCounts((c) => ({ ...c, [key]: Math.max(0, (c[key] ?? 1) - 1) }));
        throw error;
      }
      setToday((t) => t.map((e) => (e.id === tempId ? (data as Entry) : e)));
      return data as Entry;
    },
    [],
  );

  const remove = useCallback(
    async (id: string) => {
      const entry = today.find((e) => e.id === id);
      if (!entry) return;
      const linked = plans.find((p) => p.entry_id === id);
      setToday((t) => t.filter((e) => e.id !== id));
      setCounts((c) => ({ ...c, [entry.done_on]: Math.max(0, (c[entry.done_on] ?? 1) - 1) }));
      // the server unlinks the plan (on delete set null); mirror that here
      if (linked) setPlans((ps) => ps.map((p) => (p.id === linked.id ? { ...p, entry_id: null } : p)));
      const { error } = await supabase.from('entries').delete().eq('id', id);
      if (error) {
        setToday((t) => [entry, ...t]);
        setCounts((c) => ({ ...c, [entry.done_on]: (c[entry.done_on] ?? 0) + 1 }));
        if (linked) setPlans((ps) => ps.map((p) => (p.id === linked.id ? { ...p, entry_id: id } : p)));
        throw error;
      }
    },
    [today, plans],
  );

  const addPlan = useCallback(
    async (raw: string) => {
      const text = cleanText(raw, PLAN_MAX_LEN);
      if (!text || plans.length >= MAX_PLANS) return;
      const tempId = `temp-${Date.now()}`;
      setPlans((ps) => [...ps, { id: tempId, text, entry_id: null }]);
      const { data, error } = await supabase
        .from('plans')
        .insert({ text, done_on: ymd(new Date()) })
        .select('id,text,entry_id')
        .single();
      if (error) {
        setPlans((ps) => ps.filter((p) => p.id !== tempId));
        throw error;
      }
      setPlans((ps) => ps.map((p) => (p.id === tempId ? (data as Plan) : p)));
    },
    [plans.length],
  );

  const removePlan = useCallback(
    async (id: string) => {
      const plan = plans.find((p) => p.id === id);
      if (!plan) return;
      setPlans((ps) => ps.filter((p) => p.id !== id));
      const { error } = await supabase.from('plans').delete().eq('id', id);
      if (error) {
        setPlans((ps) => [...ps, plan]);
        throw error;
      }
    },
    [plans],
  );

  /** Log the plan as a win, then link it so it shows as done. */
  const completePlan = useCallback(
    async (id: string, category: CategoryKey) => {
      const plan = plans.find((p) => p.id === id);
      if (!plan || plan.entry_id || id.startsWith('temp-')) return;
      setPlans((ps) => ps.map((p) => (p.id === id ? { ...p, entry_id: 'pending' } : p)));
      try {
        const entry = await add(plan.text, category);
        const { error } = await supabase.from('plans').update({ entry_id: entry.id }).eq('id', id);
        if (error) throw error;
        setPlans((ps) => ps.map((p) => (p.id === id ? { ...p, entry_id: entry.id } : p)));
      } catch (e) {
        setPlans((ps) => ps.map((p) => (p.id === id && p.entry_id === 'pending' ? { ...p, entry_id: null } : p)));
        throw e;
      }
    },
    [plans, add],
  );

  const value = useMemo(
    () => ({ counts, today, todayKey, loading, error, add, remove, ensureMonth, refresh, plans, addPlan, removePlan, completePlan }),
    [counts, today, todayKey, loading, error, add, remove, ensureMonth, refresh, plans, addPlan, removePlan, completePlan],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEntries() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useEntries must be used inside EntriesProvider');
  return v;
}
