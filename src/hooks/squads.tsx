import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { readCache, writeCache } from '@/lib/cache';
import type { CategoryKey } from '@/lib/categories';
import { addDays, DayCounts, DayKey, monthAt, monthRange, ymd } from '@/lib/dates';
import { supabase } from '@/lib/supabase';
import { useAuth } from './auth';

export type Squad = { id: string; name: string; invite_code: string; created_by: string };
export type Member = {
  id: string;
  display_name: string;
  emoji: string;
  counts: DayCounts;
  today: { id: string; text: string; category: CategoryKey; created_at: string }[];
};

type SquadsState = {
  squads: Squad[];
  selected: Squad | null;
  select: (id: string) => void;
  /** Members of the selected squad, you included (isMe via id === userId). */
  members: Member[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (name: string) => Promise<void>;
  join: (code: string) => Promise<void>;
  leave: (id: string) => Promise<void>;
};

const Ctx = createContext<SquadsState | null>(null);

/** Squad view needs this month for the grid and ~2 months back for streaks. */
function squadRange(): { from: DayKey; to: DayKey } {
  const today = new Date();
  const { y, m } = monthAt(0);
  const monthStart = monthRange(y, m).from;
  const back = ymd(addDays(today, -62));
  return { from: back < monthStart ? back : monthStart, to: ymd(today) };
}

/** Turns RPC exception names into something a person can act on. */
export function squadErrorMessage(e: unknown): string {
  const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : '';
  if (msg.includes('squad_not_found')) return 'No squad with that code. Check it with whoever sent it.';
  if (msg.includes('squad_full')) return 'That squad is full (10 people max).';
  if (msg.includes('too_many_squads')) return 'You’re in 10 squads already. Leave one to join another.';
  return 'Something went wrong. Check your connection and try again.';
}

export function SquadsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  return (
    <SquadsStore key={userId ?? 'signed-out'} userId={userId}>
      {children}
    </SquadsStore>
  );
}

type Cached = { squads: Squad[]; selectedId: string | null; members: Member[] };

function SquadsStore({ children, userId }: { children: ReactNode; userId: string | undefined }) {
  const [squads, setSquads] = useState<Squad[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetched = useRef(false);

  const selected = squads.find((s) => s.id === selectedId) ?? squads[0] ?? null;

  // Last-known state first, network second (same pattern as entries).
  useEffect(() => {
    if (!userId) return;
    readCache<Cached>(userId, 'squads').then((c) => {
      if (!c || fetched.current) return;
      setSquads(c.squads);
      setSelectedId(c.selectedId);
      setMembers(c.members);
      setLoading(false);
    });
  }, [userId]);

  useEffect(() => {
    if (!userId || loading) return;
    writeCache(userId, 'squads', { squads, selectedId: selected?.id ?? null, members } satisfies Cached);
  }, [userId, loading, squads, selected?.id, members]);

  const loadMembers = useCallback(async (squadId: string) => {
    const { from, to } = squadRange();
    const [mem, counts] = await Promise.all([
      supabase.from('squad_members').select('user_id, joined_at, profiles(id, display_name, emoji)').eq('squad_id', squadId).order('joined_at'),
      supabase.rpc('squad_day_counts', { p_squad: squadId, p_from: from, p_to: to }),
    ]);
    if (mem.error) throw mem.error;
    if (counts.error) throw counts.error;
    const ids = ((mem.data ?? []) as { user_id: string }[]).map((r) => r.user_id);
    const today = ids.length
      ? await supabase
          .from('entries')
          .select('id, user_id, text, category, created_at')
          .in('user_id', ids)
          .eq('done_on', to)
          .order('created_at', { ascending: false })
      : { data: [], error: null };
    if (today.error) throw today.error;

    const byUser = new Map<string, Member>();
    for (const row of (mem.data ?? []) as unknown as { user_id: string; profiles: { display_name: string; emoji: string } | null }[]) {
      byUser.set(row.user_id, {
        id: row.user_id,
        display_name: row.profiles?.display_name ?? '',
        emoji: row.profiles?.emoji ?? '🌱',
        counts: {},
        today: [],
      });
    }
    for (const r of (counts.data ?? []) as { user_id: string; done_on: string; n: number }[]) {
      const m = byUser.get(r.user_id);
      if (m) m.counts[r.done_on] = r.n;
    }
    for (const e of (today.data ?? []) as unknown as (Member['today'][number] & { user_id: string })[]) {
      byUser.get(e.user_id)?.today.push({ id: e.id, text: e.text, category: e.category, created_at: e.created_at });
    }
    return [...byUser.values()];
  }, []);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('squad_members')
        .select('joined_at, squads(id, name, invite_code, created_by)')
        .eq('user_id', userId)
        .order('joined_at');
      if (error) throw error;
      const list = ((data ?? []) as unknown as { squads: Squad | null }[]).map((r) => r.squads).filter((s): s is Squad => !!s);
      fetched.current = true;
      setSquads(list);
      const current = list.find((s) => s.id === selectedId) ?? list[0] ?? null;
      setMembers(current ? await loadMembers(current.id) : []);
      setError(null);
    } catch {
      setError('Couldn’t reach the server. Showing what’s saved on this phone.');
    } finally {
      setLoading(false);
    }
  }, [userId, selectedId, loadMembers]);

  useEffect(() => {
    // refresh() only sets state after awaiting the network.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => sub.remove();
  }, [refresh]);

  const select = useCallback((id: string) => {
    setSelectedId(id);
    setMembers([]);
    // refresh() re-runs via its selectedId dependency
  }, []);

  const create = useCallback(async (name: string) => {
    const { data, error } = await supabase.rpc('create_squad', { p_name: name });
    if (error) throw error;
    setSelectedId((data as Squad).id);
  }, []);

  const join = useCallback(async (code: string) => {
    const { data, error } = await supabase.rpc('join_squad', { p_code: code });
    if (error) throw error;
    setSelectedId((data as Squad).id);
  }, []);

  const leave = useCallback(
    async (id: string) => {
      const { error } = await supabase.rpc('leave_squad', { p_squad: id });
      if (error) throw error;
      setSelectedId(null);
      await refresh();
    },
    [refresh],
  );

  const value = useMemo(
    () => ({ squads, selected, select, members, loading, error, refresh, create, join, leave }),
    [squads, selected, select, members, loading, error, refresh, create, join, leave],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSquads() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSquads must be used inside SquadsProvider');
  return v;
}
