import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './auth';

export type Profile = { id: string; display_name: string; emoji: string };

type ProfileState = {
  profile: Profile | null;
  save: (patch: Partial<Pick<Profile, 'display_name' | 'emoji'>>) => Promise<void>;
};

const Ctx = createContext<ProfileState | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const id = session?.user.id;
  const [loaded, setProfile] = useState<Profile | null>(null);
  // Only expose the profile belonging to the signed-in user (clears on sign-out/switch).
  const profile = loaded && loaded.id === id ? loaded : null;

  useEffect(() => {
    if (!id) return;
    supabase
      .from('profiles')
      .select('id,display_name,emoji')
      .eq('id', id)
      .single()
      .then(({ data }) => setProfile((data as Profile | null) ?? null));
  }, [id]);

  const save = useCallback<ProfileState['save']>(
    async (patch) => {
      if (!id) return;
      const { data, error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', id)
        .select('id,display_name,emoji')
        .single();
      if (error) throw error;
      setProfile(data as Profile);
    },
    [id],
  );

  const value = useMemo(() => ({ profile, save }), [profile, save]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProfile() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useProfile must be used inside ProfileProvider');
  return v;
}
