import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { readCache, writeCache } from '@/lib/cache';
import type { CategoryKey } from '@/lib/categories';
import { addDays, DayCounts, DayKey, monthAt, monthRange, ymd } from '@/lib/dates';
import type { Kudo, KudoEmoji } from '@/lib/kudos';
import type { PlantData } from '@/lib/plant';
import { supabase } from '@/lib/supabase';
import { useAuth } from './auth';

export type Squad = { id: string; name: string; invite_code: string; created_by: string };
export type Member = {
  id: string;
  display_name: string;
  emoji: string;
  counts: DayCounts;
  today: { id: string; text: string; category: CategoryKey; created_at: string }[];
  /** Kudos this member got today, from anyone in any of their squads you can see. */
  kudos: Kudo[];
};

/** Kudos you received today, with who sent them. */
export type ReceivedKudo = Kudo & { name: string; avatar: string };

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
  /** Send or take back a kudo for a squadmate, for today. */
  toggleKudo: (toUser: string, emoji: KudoEmoji) => Promise<void>;
  received: ReceivedKudo[];
  /** The selected squad's plant (null until loaded, or if it failed). */
  plant: PlantData | null;
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

type Cached = { squads: Squad[]; selectedId: string | null; members: Member[]; received: ReceivedKudo[]; day: DayKey; plant?: PlantData | null };

function SquadsStore({ children, userId }: { children: ReactNode; userId: string | undefined }) {
  const [squads, setSquads] = useState<Squad[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [received, setReceived] = useState<ReceivedKudo[]>([]);
  const [plant, setPlant] = useState<PlantData | null>(null);
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
      // older caches have no kudos field; yesterday's kudos don't belong on today
      const fresh = c.day === ymd(new Date());
      setMembers(c.members.map((m) => ({ ...m, kudos: fresh ? (m.kudos ?? []) : [] })));
      setReceived(fresh ? (c.received ?? []) : []);
      setPlant(c.plant ?? null);
      setLoading(false);
    });
  }, [userId]);

  useEffect(() => {
    if (!userId || loading) return;
    writeCache(userId, 'squads', { squads, selectedId: selected?.id ?? null, members, received, plant, day: ymd(new Date()) } satisfies Cached);
  }, [userId, loading, squads, selected?.id, members, received, plant]);

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
    const kudos = ids.length
      ? await supabase.from('kudos').select('from_user, to_user, emoji').in('to_user', ids).eq('done_on', to)
      : { data: [], error: null };
    if (kudos.error) throw kudos.error;

    const byUser = new Map<string, Member>();
    for (const row of (mem.data ?? []) as unknown as { user_id: string; profiles: { display_name: string; emoji: string } | null }[]) {
      byUser.set(row.user_id, {
        id: row.user_id,
        display_name: row.profiles?.display_name ?? '',
        emoji: row.profiles?.emoji ?? '🌱',
        counts: {},
        today: [],
        kudos: [],
      });
    }
    for (const r of (counts.data ?? []) as { user_id: string; done_on: string; n: number }[]) {
      const m = byUser.get(r.user_id);
      if (m) m.counts[r.done_on] = r.n;
    }
    for (const e of (today.data ?? []) as unknown as (Member['today'][number] & { user_id: string })[]) {
      byUser.get(e.user_id)?.today.push({ id: e.id, text: e.text, category: e.category, created_at: e.created_at });
    }
    for (const k of (kudos.data ?? []) as { from_user: string; to_user: string; emoji: KudoEmoji }[]) {
      byUser.get(k.to_user)?.kudos.push({ from: k.from_user, emoji: k.emoji });
    }
    return [...byUser.values()];
  }, []);

  const loadReceived = useCallback(async (): Promise<ReceivedKudo[]> => {
    if (!userId) return [];
    const { data, error } = await supabase
      .from('kudos')
      .select('from_user, emoji, created_at, sender:profiles!kudos_from_user_fkey(display_name, emoji)')
      .eq('to_user', userId)
      .eq('done_on', ymd(new Date()))
      .order('created_at', { ascending: false });
    if (error) throw error;
    return ((data ?? []) as unknown as { from_user: string; emoji: KudoEmoji; sender: { display_name: string; emoji: string } | null }[]).map(
      (r) => ({ from: r.from_user, emoji: r.emoji, name: r.sender?.display_name || 'Someone', avatar: r.sender?.emoji ?? '🌱' }),
    );
  }, [userId]);

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
      const [mem, rec, pl] = await Promise.all([
        current ? loadMembers(current.id) : Promise.resolve([]),
        loadReceived(),
        current
          ? supabase.rpc('squad_plant', { p_squad: current.id, p_today: ymd(new Date()) }).then(({ data, error }) => (error ? null : (data as PlantData | null)))
          : Promise.resolve(null),
      ]);
      setMembers(mem);
      setPlant(pl);
      setReceived(rec);
      setError(null);
    } catch {
      setError('Couldn’t reach the server. Showing what’s saved on this phone.');
    } finally {
      setLoading(false);
    }
  }, [userId, selectedId, loadMembers, loadReceived]);

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
    setPlant(null);
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

  const toggleKudo = useCallback(
    async (toUser: string, emoji: KudoEmoji) => {
      if (!userId || toUser === userId) return;
      const day = ymd(new Date());
      const target = members.find((m) => m.id === toUser);
      const had = !!target?.kudos.some((k) => k.from === userId && k.emoji === emoji);
      const apply = (add: boolean) =>
        setMembers((ms) =>
          ms.map((m) =>
            m.id !== toUser
              ? m
              : {
                  ...m,
                  kudos: add
                    ? [...m.kudos, { from: userId, emoji }]
                    : m.kudos.filter((k) => !(k.from === userId && k.emoji === emoji)),
                },
          ),
        );
      apply(!had); // optimistic
      const { error } = had
        ? await supabase.from('kudos').delete().match({ from_user: userId, to_user: toUser, done_on: day, emoji })
        : await supabase.from('kudos').insert({ to_user: toUser, done_on: day, emoji });
      // 23505 = already sent (e.g. from another device): the state we wanted is true anyway
      if (error && error.code !== '23505') {
        apply(had);
        throw error;
      }
    },
    [userId, members],
  );

  const value = useMemo(
    () => ({ squads, selected, select, members, loading, error, refresh, create, join, leave, toggleKudo, received, plant }),
    [squads, selected, select, members, loading, error, refresh, create, join, leave, toggleKudo, received, plant],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSquads() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSquads must be used inside SquadsProvider');
  return v;
}
