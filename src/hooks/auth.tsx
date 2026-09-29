import type { Session } from '@supabase/supabase-js';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { clearCache } from '@/lib/cache';
import { supabase } from '@/lib/supabase';

type AuthState = { session: Session | null; loading: boolean };

const AuthContext = createContext<AuthState>({ session: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, loading: true });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setState({ session: data.session, loading: false }));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setState({ session, loading: false }));
    return () => sub.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/** Step 1: email a 6-digit code. Creates the account on first use. */
export async function sendCode(email: string) {
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) throw error;
}

/**
 * Step 2: exchange the code for a session.
 *
 * Fallback for App Store / TestFlight review: reviewers can't receive our emails, so a
 * demo account (created in the Supabase dashboard with a numeric password) signs in by
 * typing that password into the same code box. Normal accounts have no password, so
 * this path does nothing for them.
 */
export async function verifyCode(email: string, token: string) {
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (!error) return;
  const { error: pwError } = await supabase.auth.signInWithPassword({ email, password: token });
  if (pwError) throw error;
}

/** Sign out and wipe this user's cached data from the phone. */
export async function signOut() {
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  await supabase.auth.signOut();
  if (uid) await clearCache(uid);
}
