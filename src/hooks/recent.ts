import { useEffect, useState } from 'react';
import { addDays, ymd } from '@/lib/dates';
import type { RecapEntry } from '@/lib/recap';
import { supabase } from '@/lib/supabase';
import { useAuth } from './auth';
import { useEntries } from './entries';

/** Your own entries from the last 7 days. Refetches when today's list changes. */
export function useRecentEntries() {
  const { session } = useAuth();
  const { today } = useEntries();
  const userId = session?.user.id;
  const [entries, setEntries] = useState<RecapEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const todayIds = today.map((e) => e.id).join(',');

  useEffect(() => {
    if (!userId) return;
    let live = true;
    supabase
      .from('entries')
      .select('id,text,category,done_on')
      .eq('user_id', userId)
      .gte('done_on', ymd(addDays(new Date(), -6)))
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!live) return;
        if (error) setError('Couldn’t load your week. Pull down on Today to retry.');
        else {
          setEntries((data ?? []) as RecapEntry[]);
          setError(null);
        }
      });
    return () => {
      live = false;
    };
  }, [userId, todayIds]);

  return { entries, error };
}
