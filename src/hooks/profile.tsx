import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { readCache, writeCache } from '@/lib/cache';
import { supabase } from '@/lib/supabase';
import { useAuth } from './auth';

export type Profile = {
  id: string;
  display_name: string;
  emoji: string;
  onboarded_at: string | null;
  /** IANA time zone, so server-side nudges arrive at a sensible local hour. */
  tz?: string | null;
  // push preferences (older cached profiles may not have them: treat missing as on)
  notify_kudos?: boolean;
  notify_nudges?: boolean;
  notify_sessions?: boolean;
};

export type ProfilePatch = Partial<Pick<Profile, 'display_name' | 'emoji' | 'tz' | 'notify_kudos' | 'notify_nudges' | 'notify_sessions'>>;

const COLUMNS = 'id,display_name,emoji,onboarded_at,tz,notify_kudos,notify_nudges,notify_sessions';

type ProfileState = {
  profile: Profile | null;
  /** True once we know this user's profile (from cache or server), so routing can decide. */
  ready: boolean;
  save: (patch: ProfilePatch) => Promise<void>;
  /** Record that the intro has been seen (on this account, across devices). */
  finishOnboarding: () => Promise<void>;
};

const Ctx = createContext<ProfileState | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const id = session?.user.id;
  const [loaded, setLoaded] = useState<Profile | null>(null);
  const [readyFor, setReadyFor] = useState<string | null>(null);
  // Only expose state belonging to the signed-in user (clears on sign-out/switch).
  const profile = loaded && loaded.id === id ? loaded : null;
  const ready = !!id && readyFor === id;

  const put = useCallback((p: Profile) => {
    setLoaded(p);
    setReadyFor(p.id);
    writeCache(p.id, 'profile', p);
  }, []);

  useEffect(() => {
    if (!id) return;
    let fetched = false;
    readCache<Profile>(id, 'profile').then((c) => {
      if (c && !fetched) {
        setLoaded(c);
        setReadyFor(id);
      }
    });
    supabase
      .from('profiles')
      .select(COLUMNS)
      .eq('id', id)
      .single()
      .then(({ data }) => {
        fetched = true;
        if (data) put(data as Profile);
        else setReadyFor(id); // offline with no cache: let the app open rather than hang
      });
  }, [id, put]);

  const update = useCallback(
    async (patch: Partial<Profile>) => {
      if (!id) return;
      const { data, error } = await supabase.from('profiles').update(patch).eq('id', id).select(COLUMNS).single();
      if (error) throw error;
      put(data as Profile);
    },
    [id, put],
  );

  const save = useCallback<ProfileState['save']>((patch) => update(patch), [update]);

  const finishOnboarding = useCallback(async () => {
    const at = new Date().toISOString();
    // Let them in immediately; the server write catches up.
    if (profile) setLoaded({ ...profile, onboarded_at: at });
    try {
      await update({ onboarded_at: at });
    } catch {
      // Not fatal: worst case they see the intro once more on another device.
    }
  }, [profile, update]);

  const value = useMemo(() => ({ profile, ready, save, finishOnboarding }), [profile, ready, save, finishOnboarding]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProfile() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useProfile must be used inside ProfileProvider');
  return v;
}
