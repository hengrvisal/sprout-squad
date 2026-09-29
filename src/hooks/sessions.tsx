import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { notifyServer } from '@/lib/notifications';
import { isLive, Session, SessionLength, SessionMember } from '@/lib/sessions';
import { supabase } from '@/lib/supabase';
import { useAuth } from './auth';
import { useSquads } from './squads';

type SessionsState = {
  /** The running session in the selected squad, if any. */
  live: { session: Session; members: SessionMember[] } | null;
  /** True if you're in the live session and haven't left. */
  joined: boolean;
  start: (minutes: SessionLength, title: string) => Promise<void>;
  join: () => Promise<void>;
  leave: () => Promise<void>;
  end: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<SessionsState | null>(null);

export function SessionsProvider({ children }: { children: ReactNode }) {
  const { session: auth } = useAuth();
  const me = auth?.user.id;
  const { selected } = useSquads();
  const squadId = selected?.id;
  const [live, setLive] = useState<SessionsState['live']>(null);
  const [now, setNow] = useState(() => Date.now());

  const refresh = useCallback(async () => {
    if (!squadId) {
      setLive(null);
      return;
    }
    const { data: s } = await supabase
      .from('sessions')
      .select('id, squad_id, host, title, started_at, ends_at')
      .eq('squad_id', squadId)
      .gt('ends_at', new Date().toISOString())
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!s) {
      setLive(null);
      return;
    }
    const { data: rows } = await supabase
      .from('session_members')
      .select('user_id, joined_at, left_at, profiles(display_name, emoji)')
      .eq('session_id', s.id)
      .order('joined_at');
    const members = ((rows ?? []) as unknown as { user_id: string; joined_at: string; left_at: string | null; profiles: { display_name: string; emoji: string } | null }[]).map(
      (r) => ({ user_id: r.user_id, joined_at: r.joined_at, left_at: r.left_at, name: r.profiles?.display_name || 'Someone', emoji: r.profiles?.emoji ?? '🌱' }),
    );
    setLive({ session: s as Session, members });
    setNow(Date.now());
  }, [squadId]);

  // load, then follow changes live while the squad is selected
  useEffect(() => {
    // refresh() only sets state after awaiting the network.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    if (!squadId) return;
    const channel = supabase
      .channel(`grow-${squadId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions', filter: `squad_id=eq.${squadId}` }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_members' }, () => refresh())
      .subscribe();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => {
      supabase.removeChannel(channel);
      sub.remove();
    };
  }, [squadId, refresh]);

  // notice when the running session's time is up
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, [live]);
  const current = live && isLive(live.session, now) ? live : null;

  const joined = !!current && current.members.some((m) => m.user_id === me && !m.left_at);

  const start = useCallback(
    async (minutes: SessionLength, title: string) => {
      if (!squadId) return;
      const { data, error } = await supabase.rpc('start_session', { p_squad: squadId, p_minutes: minutes, p_title: title.trim() || null });
      if (error) throw error;
      const s = data as Session;
      // the server only pushes if we're the host of a new, running session
      if (s.host === me) notifyServer({ type: 'session', session_id: s.id });
      await refresh();
    },
    [squadId, me, refresh],
  );

  const call = useCallback(
    async (fn: 'join_session' | 'leave_session' | 'end_session') => {
      if (!current) return;
      const { error } = await supabase.rpc(fn, { p_session: current.session.id });
      if (error) throw error;
      await refresh();
    },
    [current, refresh],
  );

  const value = useMemo(
    () => ({
      live: current,
      joined,
      start,
      join: () => call('join_session'),
      leave: () => call('leave_session'),
      end: () => call('end_session'),
      refresh,
    }),
    [current, joined, start, call, refresh],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSessions() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSessions must be used inside SessionsProvider');
  return v;
}
